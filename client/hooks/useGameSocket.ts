'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ActiveBet,
  BetErrorPayload,
  BetSlot,
  CashoutResult,
  GamePhase,
  HistoryEntry,
  Player,
  RoundSnapshot,
} from '@/lib/types';

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4100';

type SlotState<T> = [T | null, T | null];

export interface GameState {
  connected: boolean;
  player: Player | null;
  phase: GamePhase;
  multiplier: number;
  roundId: number;
  hash: string;
  serverSeed?: string;
  crashPoint?: number;
  startsAt?: number;
  startedAt?: number;
  history: HistoryEntry[];
  activeBets: ActiveBet[];
  myBets: SlotState<ActiveBet>;
  lastCashouts: SlotState<CashoutResult>;
  errors: SlotState<string>;
}

const initialState: GameState = {
  connected: false,
  player: null,
  phase: 'WAITING',
  multiplier: 1,
  roundId: 0,
  hash: '',
  history: [],
  activeBets: [],
  myBets: [null, null],
  lastCashouts: [null, null],
  errors: [null, null],
};

function setSlot<T>(arr: SlotState<T>, slot: BetSlot, value: T | null): SlotState<T> {
  const next: SlotState<T> = [arr[0], arr[1]];
  next[slot] = value;
  return next;
}

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<GameState>(initialState);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState((s) => ({ ...s, connected: true, errors: [null, null] }));
    });

    socket.on('disconnect', () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.on(
      'init',
      (payload: {
        player: Player;
        snapshot: RoundSnapshot;
        history: HistoryEntry[];
        activeBets: ActiveBet[];
      }) => {
        setState((s) => ({
          ...s,
          player: payload.player,
          phase: payload.snapshot.phase,
          multiplier: payload.snapshot.multiplier,
          roundId: payload.snapshot.roundId,
          hash: payload.snapshot.hash,
          serverSeed: payload.snapshot.serverSeed,
          crashPoint: payload.snapshot.crashPoint,
          startsAt: payload.snapshot.startsAt,
          startedAt: payload.snapshot.startedAt,
          history: payload.history,
          activeBets: payload.activeBets,
        }));
      },
    );

    socket.on('player', (player: Player) => {
      setState((s) => ({ ...s, player }));
    });

    socket.on(
      'phase',
      (payload: {
        phase: GamePhase;
        roundId: number;
        hash?: string;
        startsAt?: number;
        startedAt?: number;
      }) => {
        setState((s) => ({
          ...s,
          phase: payload.phase,
          roundId: payload.roundId,
          hash: payload.hash ?? s.hash,
          startsAt: payload.startsAt,
          startedAt: payload.startedAt,
          multiplier: payload.phase === 'WAITING' ? 1 : s.multiplier,
          crashPoint:
            payload.phase === 'WAITING' || payload.phase === 'RUNNING'
              ? undefined
              : s.crashPoint,
          serverSeed:
            payload.phase === 'WAITING' || payload.phase === 'RUNNING'
              ? undefined
              : s.serverSeed,
          myBets: payload.phase === 'WAITING' ? [null, null] : s.myBets,
          lastCashouts:
            payload.phase === 'WAITING' ? [null, null] : s.lastCashouts,
          errors: payload.phase === 'WAITING' ? [null, null] : s.errors,
        }));
      },
    );

    socket.on('tick', (payload: { multiplier: number; elapsed: number }) => {
      setState((s) => ({ ...s, multiplier: payload.multiplier }));
    });

    socket.on(
      'crash',
      (payload: {
        crashPoint: number;
        serverSeed: string;
        hash: string;
        roundId: number;
      }) => {
        setState((s) => ({
          ...s,
          phase: 'CRASHED',
          crashPoint: payload.crashPoint,
          serverSeed: payload.serverSeed,
          multiplier: payload.crashPoint,
        }));
      },
    );

    socket.on('history', (history: HistoryEntry[]) => {
      setState((s) => ({ ...s, history }));
    });

    socket.on('activeBets', (bets: ActiveBet[]) => {
      setState((s) => {
        const mine: SlotState<ActiveBet> = [null, null];
        if (s.player) {
          for (const b of bets) {
            if (b.playerId === s.player.id) mine[b.slot] = b;
          }
        }
        return { ...s, activeBets: bets, myBets: mine };
      });
    });

    socket.on('betPlaced', (bet: ActiveBet) => {
      setState((s) => ({
        ...s,
        myBets: setSlot(s.myBets, bet.slot, bet),
        errors: setSlot(s.errors, bet.slot, null),
      }));
    });

    socket.on('cashedOut', (payload: CashoutResult) => {
      setState((s) => ({
        ...s,
        lastCashouts: setSlot(s.lastCashouts, payload.slot, payload),
      }));
    });

    socket.on('betError', (payload: BetErrorPayload) => {
      setState((s) => ({
        ...s,
        errors: setSlot(s.errors, payload.slot, payload.message),
      }));
      setTimeout(() => {
        setState((s) => ({
          ...s,
          errors: setSlot(s.errors, payload.slot, null),
        }));
      }, 3000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const placeBet = useCallback(
    (slot: BetSlot, amount: number, autoCashout?: number) => {
      socketRef.current?.emit('placeBet', { slot, amount, autoCashout });
    },
    [],
  );

  const cashout = useCallback((slot: BetSlot) => {
    socketRef.current?.emit('cashout', { slot });
  }, []);

  const deposit = useCallback((amount: number) => {
    socketRef.current?.emit('deposit', amount);
  }, []);

  const rename = useCallback((name: string) => {
    socketRef.current?.emit('rename', name);
  }, []);

  return { state, placeBet, cashout, deposit, rename };
}
