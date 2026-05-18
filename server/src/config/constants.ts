export const ROUND_TIMING = {
  waitingMs: 6_000,
  crashedMs: 4_000,
  tickMs: 50,
} as const;

export const GAME_RULES = {
  startingBalance: 0,
  minBet: 1,
  maxDeposit: 10_000,
  historySize: 40,
} as const;

export const MULTIPLIER = {
  growthRate: 0.06,
} as const;
