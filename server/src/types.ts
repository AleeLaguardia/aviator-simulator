export type GamePhase = 'WAITING' | 'RUNNING' | 'CRASHED';

export interface Player {
  id: string;
  name: string;
  balance: number;
}

export type BetSlot = 0 | 1;

export interface Bet {
  playerId: string;
  playerName: string;
  slot: BetSlot;
  amount: number;
  autoCashout?: number;
  cashedOutAt?: number;
  winnings?: number;
}

export interface RoundSnapshot {
  roundId: number;
  phase: GamePhase;
  multiplier: number;
  crashPoint?: number;
  hash: string;
  serverSeed?: string;
  startsAt?: number;
  startedAt?: number;
  crashedAt?: number;
}

export interface HistoryEntry {
  roundId: number;
  crashPoint: number;
  hash: string;
  serverSeed: string;
}
