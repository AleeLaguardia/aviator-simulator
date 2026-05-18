'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppSocket, createSocket } from '@/lib/socket/client';
import { BetSlot } from '@aviator/shared';
import { gameReducer, initialGameState } from './gameReducer';

const BET_ERROR_TIMEOUT = 3000;

export function useGameSocket() {
  const socketRef = useRef<AppSocket | null>(null);
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('connect', () => dispatch({ type: 'connected' }));
    socket.on('disconnect', () => dispatch({ type: 'disconnected' }));

    socket.on('init', (payload) =>
      dispatch({ type: 'init', ...payload }),
    );
    socket.on('player', (player) => dispatch({ type: 'player', player }));
    socket.on('phase', (payload) => dispatch({ type: 'phase', ...payload }));
    socket.on('tick', (payload) =>
      dispatch({ type: 'tick', multiplier: payload.multiplier }),
    );
    socket.on('crash', (payload) =>
      dispatch({
        type: 'crashed',
        crashPoint: payload.crashPoint,
        serverSeed: payload.serverSeed,
      }),
    );
    socket.on('history', (history) => dispatch({ type: 'history', history }));
    socket.on('activeBets', (bets) => dispatch({ type: 'activeBets', bets }));
    socket.on('betPlaced', (bet) => dispatch({ type: 'betPlaced', bet }));
    socket.on('cashedOut', (result) =>
      dispatch({ type: 'cashedOut', result }),
    );
    socket.on('betError', ({ slot, message }) => {
      dispatch({ type: 'betError', slot, message });
      setTimeout(
        () => dispatch({ type: 'clearError', slot }),
        BET_ERROR_TIMEOUT,
      );
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

export type GameState = typeof initialGameState;
