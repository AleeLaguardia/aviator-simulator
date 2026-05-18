import { Server, Socket } from 'socket.io';
import { createRound } from './provablyFair';
import {
  Bet,
  BetSlot,
  GamePhase,
  HistoryEntry,
  Player,
  RoundSnapshot,
} from './types';

const WAITING_MS = 6000;
const CRASHED_MS = 4000;
const TICK_MS = 50;
const GROWTH_K = 0.06;
const MAX_HISTORY = 25;
const STARTING_BALANCE = 0;

export class GameEngine {
  private io: Server;
  private players = new Map<string, Player>();
  private bets = new Map<string, Bet>();
  private history: HistoryEntry[] = [];

  private phase: GamePhase = 'WAITING';
  private roundId = 0;
  private nonce = 1;
  private hash = '';
  private serverSeed = '';
  private crashPoint = 1;
  private multiplier = 1;
  private startedAt = 0;
  private startsAt = 0;
  private crashedAt = 0;
  private tickHandle: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
  }

  start() {
    this.beginWaitingPhase();
  }

  registerSocket(socket: Socket) {
    const player: Player = {
      id: socket.id,
      name: `Pilot-${socket.id.slice(0, 4)}`,
      balance: STARTING_BALANCE,
    };
    this.players.set(socket.id, player);

    socket.emit('init', {
      player,
      snapshot: this.snapshot(),
      history: this.history,
      activeBets: this.activeBetsPayload(),
    });

    socket.on('rename', (name: string) => {
      const p = this.players.get(socket.id);
      if (!p || typeof name !== 'string') return;
      p.name = name.slice(0, 16) || p.name;
      socket.emit('player', p);
    });

    socket.on(
      'placeBet',
      (data: { slot: BetSlot; amount: number; autoCashout?: number }) => {
        this.placeBet(socket, data);
      },
    );

    socket.on('cashout', (data: { slot: BetSlot }) => {
      this.cashout(socket, data?.slot);
    });

    socket.on('deposit', (amount: number) => {
      const p = this.players.get(socket.id);
      if (!p) return;
      const value = Math.max(0, Math.min(10000, Math.floor(Number(amount) || 0)));
      if (value <= 0) return;
      p.balance += value;
      socket.emit('player', p);
    });

    socket.on('disconnect', () => {
      this.players.delete(socket.id);
      this.bets.delete(this.betKey(socket.id, 0));
      this.bets.delete(this.betKey(socket.id, 1));
      this.io.emit('activeBets', this.activeBetsPayload());
    });
  }

  private betKey(socketId: string, slot: BetSlot) {
    return `${socketId}::${slot}`;
  }

  private placeBet(
    socket: Socket,
    data: { slot: BetSlot; amount: number; autoCashout?: number },
  ) {
    const player = this.players.get(socket.id);
    if (!player) return;

    const slot: BetSlot = data?.slot === 1 ? 1 : 0;

    if (this.phase !== 'WAITING') {
      socket.emit('betError', {
        slot,
        message: 'A rodada já começou. Aguarde a próxima.',
      });
      return;
    }

    const key = this.betKey(socket.id, slot);
    if (this.bets.has(key)) {
      socket.emit('betError', {
        slot,
        message: 'Você já apostou neste slot.',
      });
      return;
    }

    const amount = Math.floor(Number(data?.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 1) {
      socket.emit('betError', { slot, message: 'Aposta mínima de R$ 1,00.' });
      return;
    }
    if (amount > player.balance) {
      socket.emit('betError', { slot, message: 'Saldo insuficiente.' });
      return;
    }

    const autoCashout = data?.autoCashout
      ? Math.max(1.01, Number(data.autoCashout))
      : undefined;

    player.balance = Math.floor((player.balance - amount) * 100) / 100;

    const bet: Bet = {
      playerId: player.id,
      playerName: player.name,
      slot,
      amount,
      autoCashout,
    };
    this.bets.set(key, bet);

    socket.emit('player', player);
    socket.emit('betPlaced', bet);
    this.io.emit('activeBets', this.activeBetsPayload());
  }

  private cashout(socket: Socket, slot: BetSlot) {
    const player = this.players.get(socket.id);
    const normalizedSlot: BetSlot = slot === 1 ? 1 : 0;
    const key = this.betKey(socket.id, normalizedSlot);
    const bet = this.bets.get(key);
    if (!player || !bet) return;
    if (this.phase !== 'RUNNING') {
      socket.emit('betError', {
        slot: normalizedSlot,
        message: 'Cashout indisponível no momento.',
      });
      return;
    }
    if (bet.cashedOutAt) return;

    const mult = this.multiplier;
    const winnings = Math.floor(bet.amount * mult * 100) / 100;
    bet.cashedOutAt = mult;
    bet.winnings = winnings;
    player.balance = Math.floor((player.balance + winnings) * 100) / 100;

    socket.emit('player', player);
    socket.emit('cashedOut', {
      slot: normalizedSlot,
      multiplier: mult,
      winnings,
    });
    this.io.emit('activeBets', this.activeBetsPayload());
  }

  private beginWaitingPhase() {
    this.phase = 'WAITING';
    this.bets.clear();
    this.multiplier = 1;
    this.roundId += 1;
    this.nonce += 1;

    const round = createRound(this.nonce);
    this.serverSeed = round.serverSeed;
    this.hash = round.hash;
    this.crashPoint = round.crashPoint;

    this.startsAt = Date.now() + WAITING_MS;
    this.startedAt = 0;
    this.crashedAt = 0;

    this.io.emit('phase', {
      phase: this.phase,
      roundId: this.roundId,
      hash: this.hash,
      startsAt: this.startsAt,
    });
    this.io.emit('activeBets', this.activeBetsPayload());

    setTimeout(() => this.beginRunningPhase(), WAITING_MS);
  }

  private beginRunningPhase() {
    this.phase = 'RUNNING';
    this.startedAt = Date.now();
    this.multiplier = 1;

    this.io.emit('phase', {
      phase: this.phase,
      roundId: this.roundId,
      startedAt: this.startedAt,
    });

    this.tickHandle = setInterval(() => this.tick(), TICK_MS);
  }

  private tick() {
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const mult = Math.exp(GROWTH_K * elapsed);
    this.multiplier = Math.floor(mult * 100) / 100;

    if (this.multiplier >= this.crashPoint) {
      this.multiplier = this.crashPoint;
      this.endRound();
      return;
    }

    for (const bet of this.bets.values()) {
      if (
        !bet.cashedOutAt &&
        bet.autoCashout &&
        this.multiplier >= bet.autoCashout
      ) {
        const socket = this.io.sockets.sockets.get(bet.playerId);
        if (socket) this.cashout(socket, bet.slot);
      }
    }

    this.io.emit('tick', {
      multiplier: this.multiplier,
      elapsed,
    });
  }

  private endRound() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    this.phase = 'CRASHED';
    this.crashedAt = Date.now();

    const entry: HistoryEntry = {
      roundId: this.roundId,
      crashPoint: this.crashPoint,
      hash: this.hash,
      serverSeed: this.serverSeed,
    };
    this.history.unshift(entry);
    if (this.history.length > MAX_HISTORY) this.history.pop();

    this.io.emit('crash', {
      crashPoint: this.crashPoint,
      serverSeed: this.serverSeed,
      hash: this.hash,
      roundId: this.roundId,
    });
    this.io.emit('history', this.history);
    this.io.emit('activeBets', this.activeBetsPayload());

    setTimeout(() => this.beginWaitingPhase(), CRASHED_MS);
  }

  private activeBetsPayload() {
    return Array.from(this.bets.values()).map((b) => ({
      playerId: b.playerId,
      playerName: b.playerName,
      slot: b.slot,
      amount: b.amount,
      cashedOutAt: b.cashedOutAt,
      winnings: b.winnings,
    }));
  }

  private snapshot(): RoundSnapshot {
    return {
      roundId: this.roundId,
      phase: this.phase,
      multiplier: this.multiplier,
      crashPoint: this.phase === 'CRASHED' ? this.crashPoint : undefined,
      hash: this.hash,
      serverSeed: this.phase === 'CRASHED' ? this.serverSeed : undefined,
      startsAt: this.phase === 'WAITING' ? this.startsAt : undefined,
      startedAt: this.phase === 'RUNNING' ? this.startedAt : undefined,
      crashedAt: this.phase === 'CRASHED' ? this.crashedAt : undefined,
    };
  }
}
