import {
  ActiveBet,
  BetError,
  BetSlot,
  CashoutResult,
  GamePhase,
  HistoryEntry,
  Player,
  RoundSnapshot,
} from './types';

export interface ServerToClientEvents {
  init: (payload: {
    player: Player;
    snapshot: RoundSnapshot;
    history: HistoryEntry[];
    activeBets: ActiveBet[];
    config: { rtpPercent: number };
  }) => void;
  player: (player: Player) => void;
  phase: (payload: {
    phase: GamePhase;
    roundId: number;
    hash?: string;
    startsAt?: number;
    startedAt?: number;
  }) => void;
  tick: (payload: { multiplier: number; elapsed: number }) => void;
  crash: (payload: {
    roundId: number;
    crashPoint: number;
    serverSeed: string;
    hash: string;
  }) => void;
  history: (history: HistoryEntry[]) => void;
  activeBets: (bets: ActiveBet[]) => void;
  betPlaced: (bet: ActiveBet) => void;
  cashedOut: (result: CashoutResult) => void;
  betError: (error: BetError) => void;
}

export interface ClientToServerEvents {
  placeBet: (data: {
    slot: BetSlot;
    amount: number;
    autoCashout?: number;
  }) => void;
  cashout: (data: { slot: BetSlot }) => void;
  deposit: (amount: number) => void;
  rename: (name: string) => void;
}
