import { Server } from 'socket.io';
import { GameEngine } from '../engine/GameEngine';
import { BettingService } from '../services/BettingService';
import { PlayerStore } from '../services/PlayerStore';
import { FAIRNESS } from '../config/constants';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@aviator/shared';

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface Deps {
  io: AppServer;
  engine: GameEngine;
  players: PlayerStore;
  betting: BettingService;
}

export function registerSocketHandlers({
  io,
  engine,
  players,
  betting,
}: Deps): void {
  forwardEngineEvents(io, engine);
  forwardBettingEvents(io, players, betting);

  io.on('connection', (socket) => {
    const player = players.create(socket.id);

    socket.emit('init', {
      player,
      snapshot: engine.snapshot(),
      history: engine.getHistory(),
      activeBets: betting.getActiveBets(),
      config: { rtpPercent: FAIRNESS.rtpPercent },
    });

    socket.on('placeBet', (data) => {
      betting.placeBet({
        socketId: socket.id,
        slot: data?.slot,
        amount: data?.amount,
        autoCashout: data?.autoCashout,
      });
    });

    socket.on('cashout', (data) => {
      betting.cashout(socket.id, data?.slot);
    });

    socket.on('deposit', (amount) => {
      const updated = players.deposit(socket.id, Number(amount) || 0);
      if (updated) socket.emit('player', updated);
    });

    socket.on('rename', (name) => {
      if (typeof name !== 'string') return;
      const updated = players.rename(socket.id, name);
      if (updated) socket.emit('player', updated);
    });

    socket.on('disconnect', () => {
      players.remove(socket.id);
      betting.removePlayerBets(socket.id);
    });
  });
}

function forwardEngineEvents(io: AppServer, engine: GameEngine): void {
  engine.on('waiting', (snapshot) => {
    io.emit('phase', {
      phase: 'WAITING',
      roundId: snapshot.roundId,
      hash: snapshot.hash,
      startsAt: snapshot.startsAt,
    });
  });

  engine.on('running', (snapshot) => {
    io.emit('phase', {
      phase: 'RUNNING',
      roundId: snapshot.roundId,
      startedAt: snapshot.startedAt,
    });
  });

  engine.on('tick', (payload) => {
    io.emit('tick', payload);
  });

  engine.on('crashed', (entry) => {
    io.emit('crash', {
      roundId: entry.roundId,
      crashPoint: entry.crashPoint,
      serverSeed: entry.serverSeed,
      hash: entry.hash,
    });
    io.emit('history', engine.getHistory());
  });
}

function forwardBettingEvents(
  io: AppServer,
  players: PlayerStore,
  betting: BettingService,
): void {
  const socketOf = (id: string) => io.sockets.sockets.get(id);

  betting.on('betPlaced', ({ socketId, bet }) => {
    const socket = socketOf(socketId);
    if (!socket) return;
    socket.emit('betPlaced', bet);
    const player = players.get(socketId);
    if (player) socket.emit('player', player);
  });

  betting.on('cashedOut', ({ socketId, result }) => {
    const socket = socketOf(socketId);
    if (!socket) return;
    socket.emit('cashedOut', result);
    const player = players.get(socketId);
    if (player) socket.emit('player', player);
  });

  betting.on('betError', ({ socketId, error }) => {
    socketOf(socketId)?.emit('betError', error);
  });

  betting.on('activeBetsChanged', () => {
    io.emit('activeBets', betting.getActiveBets());
  });
}
