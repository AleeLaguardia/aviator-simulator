import { EventEmitter } from 'events';
import { GAME_RULES } from '../config/constants';
import { GameEngine } from '../engine/GameEngine';
import {
  ActiveBet,
  BetError,
  BetSlot,
  CashoutResult,
} from '@aviator/shared';
import { PlayerStore } from './PlayerStore';

export interface PlaceBetInput {
  socketId: string;
  slot: BetSlot;
  amount: number;
  autoCashout?: number;
}

export interface BettingServiceEvents {
  betPlaced: (payload: { socketId: string; bet: ActiveBet }) => void;
  cashedOut: (payload: { socketId: string; result: CashoutResult }) => void;
  betError: (payload: { socketId: string; error: BetError }) => void;
  activeBetsChanged: () => void;
}

const round2 = (n: number) => Math.floor(n * 100) / 100;

export class BettingService extends EventEmitter {
  private readonly bets = new Map<string, ActiveBet>();

  constructor(
    private readonly engine: GameEngine,
    private readonly players: PlayerStore,
  ) {
    super();
    this.engine.on('waiting', () => {
      this.bets.clear();
      this.emit('activeBetsChanged');
    });
    this.engine.on('tick', () => this.processAutoCashouts());
  }

  override on<E extends keyof BettingServiceEvents>(
    event: E,
    listener: BettingServiceEvents[E],
  ): this {
    return super.on(event, listener);
  }

  override emit<E extends keyof BettingServiceEvents>(
    event: E,
    ...args: Parameters<BettingServiceEvents[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  placeBet(input: PlaceBetInput): void {
    const { socketId, amount, autoCashout } = input;
    const slot: BetSlot = input.slot === 1 ? 1 : 0;
    const fail = (message: string): void => {
      this.emit('betError', { socketId, error: { slot, message } });
    };

    const player = this.players.get(socketId);
    if (!player) return;

    if (this.engine.getPhase() !== 'WAITING') {
      return fail('A rodada já começou. Aguarde a próxima.');
    }

    const key = this.betKey(socketId, slot);
    if (this.bets.has(key)) {
      return fail('Você já apostou neste slot.');
    }

    const value = round2(Number(amount) || 0);
    if (!Number.isFinite(value) || value < GAME_RULES.minBet) {
      return fail('Aposta mínima de R$ 1,00.');
    }
    if (!this.players.debit(socketId, value)) {
      return fail('Saldo insuficiente.');
    }

    const auto = autoCashout ? Math.max(1.01, Number(autoCashout)) : undefined;

    const bet: ActiveBet = {
      playerId: player.id,
      playerName: player.name,
      slot,
      amount: value,
      autoCashout: auto,
    };
    this.bets.set(key, bet);

    this.emit('betPlaced', { socketId, bet });
    this.emit('activeBetsChanged');
  }

  cashout(socketId: string, requestedSlot: BetSlot): void {
    const slot: BetSlot = requestedSlot === 1 ? 1 : 0;
    const key = this.betKey(socketId, slot);
    const bet = this.bets.get(key);
    const player = this.players.get(socketId);
    if (!bet || !player) return;

    if (this.engine.getPhase() !== 'RUNNING') {
      this.emit('betError', {
        socketId,
        error: { slot, message: 'Cashout indisponível no momento.' },
      });
      return;
    }
    if (bet.cashedOutAt) return;

    const multiplier = this.engine.getMultiplier();
    const winnings = round2(bet.amount * multiplier);
    bet.cashedOutAt = multiplier;
    bet.winnings = winnings;
    this.players.credit(socketId, winnings);

    this.emit('cashedOut', {
      socketId,
      result: { slot, multiplier, winnings },
    });
    this.emit('activeBetsChanged');
  }

  removePlayerBets(socketId: string): void {
    let removed = false;
    for (const slot of [0, 1] as const) {
      if (this.bets.delete(this.betKey(socketId, slot))) removed = true;
    }
    if (removed) this.emit('activeBetsChanged');
  }

  getActiveBets(): ActiveBet[] {
    return Array.from(this.bets.values()).map((b) => ({
      playerId: b.playerId,
      playerName: b.playerName,
      slot: b.slot,
      amount: b.amount,
      autoCashout: b.autoCashout,
      cashedOutAt: b.cashedOutAt,
      winnings: b.winnings,
    }));
  }

  private betKey(socketId: string, slot: BetSlot): string {
    return `${socketId}::${slot}`;
  }

  private processAutoCashouts(): void {
    const mult = this.engine.getMultiplier();
    for (const bet of this.bets.values()) {
      if (!bet.cashedOutAt && bet.autoCashout && mult >= bet.autoCashout) {
        this.cashout(bet.playerId, bet.slot);
      }
    }
  }
}
