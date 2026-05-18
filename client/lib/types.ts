export type GamePhase = 'WAITING' | 'RUNNING' | 'CRASHED';
export type BetSlot = 0 | 1;

export interface Player {
  id: string;
  name: string;
  balance: number;
}

export interface ActiveBet {
  playerId: string;
  playerName: string;
  slot: BetSlot;
  amount: number;
  autoCashout?: number;
  cashedOutAt?: number;
  winnings?: number;
}

export interface HistoryEntry {
  roundId: number;
  crashPoint: number;
  hash: string;
  serverSeed: string;
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

export interface CashoutResult {
  slot: BetSlot;
  multiplier: number;
  winnings: number;
}

export interface BetErrorPayload {
  slot: BetSlot;
  message: string;
}

export interface InitPayload {
  player: Player;
  snapshot: RoundSnapshot;
  history: HistoryEntry[];
  activeBets: ActiveBet[];
}
