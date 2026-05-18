import {
  ActiveBet,
  BetSlot,
  CashoutResult,
  GamePhase,
  HistoryEntry,
  Player,
  RoundSnapshot,
} from '@aviator/shared';

export type SlotState<T> = [T | null, T | null];

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

export const initialGameState: GameState = {
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

export type GameAction =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | {
      type: 'init';
      player: Player;
      snapshot: RoundSnapshot;
      history: HistoryEntry[];
      activeBets: ActiveBet[];
    }
  | { type: 'player'; player: Player }
  | {
      type: 'phase';
      phase: GamePhase;
      roundId: number;
      hash?: string;
      startsAt?: number;
      startedAt?: number;
    }
  | { type: 'tick'; multiplier: number }
  | {
      type: 'crashed';
      crashPoint: number;
      serverSeed: string;
    }
  | { type: 'history'; history: HistoryEntry[] }
  | { type: 'activeBets'; bets: ActiveBet[] }
  | { type: 'betPlaced'; bet: ActiveBet }
  | { type: 'cashedOut'; result: CashoutResult }
  | { type: 'betError'; slot: BetSlot; message: string }
  | { type: 'clearError'; slot: BetSlot };

function setSlot<T>(
  arr: SlotState<T>,
  slot: BetSlot,
  value: T | null,
): SlotState<T> {
  const next: SlotState<T> = [arr[0], arr[1]];
  next[slot] = value;
  return next;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'connected':
      return { ...state, connected: true, errors: [null, null] };

    case 'disconnected':
      return { ...state, connected: false };

    case 'init':
      return {
        ...state,
        player: action.player,
        phase: action.snapshot.phase,
        multiplier: action.snapshot.multiplier,
        roundId: action.snapshot.roundId,
        hash: action.snapshot.hash,
        serverSeed: action.snapshot.serverSeed,
        crashPoint: action.snapshot.crashPoint,
        startsAt: action.snapshot.startsAt,
        startedAt: action.snapshot.startedAt,
        history: action.history,
        activeBets: action.activeBets,
        myBets: deriveMyBets(action.activeBets, action.player.id),
      };

    case 'player':
      return { ...state, player: action.player };

    case 'phase': {
      const isWaiting = action.phase === 'WAITING';
      const isRunning = action.phase === 'RUNNING';
      return {
        ...state,
        phase: action.phase,
        roundId: action.roundId,
        hash: action.hash ?? state.hash,
        startsAt: action.startsAt,
        startedAt: action.startedAt,
        multiplier: isWaiting ? 1 : state.multiplier,
        crashPoint: isWaiting || isRunning ? undefined : state.crashPoint,
        serverSeed: isWaiting || isRunning ? undefined : state.serverSeed,
        myBets: isWaiting ? [null, null] : state.myBets,
        lastCashouts: isWaiting ? [null, null] : state.lastCashouts,
        errors: isWaiting ? [null, null] : state.errors,
      };
    }

    case 'tick':
      return { ...state, multiplier: action.multiplier };

    case 'crashed':
      return {
        ...state,
        phase: 'CRASHED',
        crashPoint: action.crashPoint,
        serverSeed: action.serverSeed,
        multiplier: action.crashPoint,
      };

    case 'history':
      return { ...state, history: action.history };

    case 'activeBets':
      return {
        ...state,
        activeBets: action.bets,
        myBets: state.player
          ? deriveMyBets(action.bets, state.player.id)
          : state.myBets,
      };

    case 'betPlaced':
      return {
        ...state,
        myBets: setSlot(state.myBets, action.bet.slot, action.bet),
        errors: setSlot(state.errors, action.bet.slot, null),
      };

    case 'cashedOut':
      return {
        ...state,
        lastCashouts: setSlot(
          state.lastCashouts,
          action.result.slot,
          action.result,
        ),
      };

    case 'betError':
      return {
        ...state,
        errors: setSlot(state.errors, action.slot, action.message),
      };

    case 'clearError':
      return {
        ...state,
        errors: setSlot(state.errors, action.slot, null),
      };

    default:
      return state;
  }
}

function deriveMyBets(
  bets: ActiveBet[],
  playerId: string,
): SlotState<ActiveBet> {
  const mine: SlotState<ActiveBet> = [null, null];
  for (const b of bets) {
    if (b.playerId === playerId) mine[b.slot] = b;
  }
  return mine;
}
