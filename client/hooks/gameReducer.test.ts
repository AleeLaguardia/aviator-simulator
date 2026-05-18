import { describe, expect, it } from 'vitest';
import { ActiveBet, Player, RoundSnapshot } from '@aviator/shared';
import { gameReducer, initialGameState } from './gameReducer';

const player: Player = { id: 'sock-1', name: 'Pilot-sock', balance: 1000 };

const baseSnapshot: RoundSnapshot = {
  roundId: 1,
  phase: 'WAITING',
  multiplier: 1,
  hash: 'abc',
  startsAt: 1_000,
};

const otherBet = (slot: 0 | 1): ActiveBet => ({
  playerId: 'sock-2',
  playerName: 'Pilot-other',
  slot,
  amount: 25,
});

const myBet = (slot: 0 | 1): ActiveBet => ({
  playerId: player.id,
  playerName: player.name,
  slot,
  amount: 10,
});

describe('gameReducer', () => {
  it('returns the previous state for unknown actions', () => {
    const next = gameReducer(initialGameState, { type: 'noop' } as never);
    expect(next).toBe(initialGameState);
  });

  it('connected sets connected=true and clears errors', () => {
    const seeded = {
      ...initialGameState,
      errors: ['boom', null] as [string | null, string | null],
    };
    const next = gameReducer(seeded, { type: 'connected' });
    expect(next.connected).toBe(true);
    expect(next.errors).toEqual([null, null]);
  });

  it('init derives myBets from playerId match', () => {
    const next = gameReducer(initialGameState, {
      type: 'init',
      player,
      snapshot: baseSnapshot,
      history: [],
      activeBets: [otherBet(0), myBet(1), otherBet(1)],
    });
    expect(next.player).toEqual(player);
    expect(next.myBets[0]).toBeNull();
    expect(next.myBets[1]).toEqual(myBet(1));
  });

  it('tick updates only the multiplier', () => {
    const state = { ...initialGameState, multiplier: 1.5 };
    const next = gameReducer(state, { type: 'tick', multiplier: 2.7 });
    expect(next.multiplier).toBe(2.7);
    expect(next.phase).toBe(state.phase);
  });

  it('crashed sets phase, crashPoint, serverSeed and freezes multiplier', () => {
    const state = { ...initialGameState, multiplier: 1.99 };
    const next = gameReducer(state, {
      type: 'crashed',
      crashPoint: 1.99,
      serverSeed: 'seed-xyz',
    });
    expect(next.phase).toBe('CRASHED');
    expect(next.crashPoint).toBe(1.99);
    expect(next.serverSeed).toBe('seed-xyz');
    expect(next.multiplier).toBe(1.99);
  });

  it('phase=WAITING wipes per-round transient state', () => {
    const seeded = {
      ...initialGameState,
      phase: 'CRASHED' as const,
      multiplier: 3.5,
      crashPoint: 3.5,
      serverSeed: 'old',
      myBets: [myBet(0), myBet(1)] as [ActiveBet | null, ActiveBet | null],
      lastCashouts: [
        { slot: 0 as const, multiplier: 2, winnings: 20 },
        null,
      ] as [
        { slot: 0 | 1; multiplier: number; winnings: number } | null,
        { slot: 0 | 1; multiplier: number; winnings: number } | null,
      ],
      errors: ['x', 'y'] as [string | null, string | null],
    };
    const next = gameReducer(seeded, {
      type: 'phase',
      phase: 'WAITING',
      roundId: 2,
      hash: 'newhash',
      startsAt: 5000,
    });
    expect(next.phase).toBe('WAITING');
    expect(next.multiplier).toBe(1);
    expect(next.crashPoint).toBeUndefined();
    expect(next.serverSeed).toBeUndefined();
    expect(next.myBets).toEqual([null, null]);
    expect(next.lastCashouts).toEqual([null, null]);
    expect(next.errors).toEqual([null, null]);
    expect(next.hash).toBe('newhash');
  });

  it('betPlaced updates the correct slot and clears its error', () => {
    const seeded = {
      ...initialGameState,
      errors: ['some error', null] as [string | null, string | null],
    };
    const bet = myBet(0);
    const next = gameReducer(seeded, { type: 'betPlaced', bet });
    expect(next.myBets[0]).toEqual(bet);
    expect(next.myBets[1]).toBeNull();
    expect(next.errors[0]).toBeNull();
  });

  it('cashedOut records the result on the matching slot only', () => {
    const result = { slot: 1 as const, multiplier: 2.5, winnings: 25 };
    const next = gameReducer(initialGameState, {
      type: 'cashedOut',
      result,
    });
    expect(next.lastCashouts[0]).toBeNull();
    expect(next.lastCashouts[1]).toEqual(result);
  });

  it('betError + clearError toggles the per-slot message', () => {
    const errored = gameReducer(initialGameState, {
      type: 'betError',
      slot: 1,
      message: 'no funds',
    });
    expect(errored.errors).toEqual([null, 'no funds']);

    const cleared = gameReducer(errored, { type: 'clearError', slot: 1 });
    expect(cleared.errors).toEqual([null, null]);
  });

  it('activeBets recomputes myBets when player is known', () => {
    const seeded = { ...initialGameState, player };
    const bets = [myBet(0), otherBet(1)];
    const next = gameReducer(seeded, { type: 'activeBets', bets });
    expect(next.activeBets).toBe(bets);
    expect(next.myBets[0]).toEqual(myBet(0));
    expect(next.myBets[1]).toBeNull();
  });
});
