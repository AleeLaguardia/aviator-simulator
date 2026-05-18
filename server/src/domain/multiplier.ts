import { MULTIPLIER } from '../config/constants';

export function multiplierAt(
  elapsedSeconds: number,
  growthRate: number = MULTIPLIER.growthRate,
): number {
  const raw = Math.exp(growthRate * elapsedSeconds);
  return Math.floor(raw * 100) / 100;
}
