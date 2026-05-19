import crypto from 'crypto';
import { FAIRNESS } from '../config/constants';

export interface ProvablyFairResult {
  serverSeed: string;
  hash: string;
  crashPoint: number;
}

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function deriveCrashPoint(serverSeed: string, nonce: number): number {
  const hmac = crypto
    .createHmac('sha256', serverSeed)
    .update(String(nonce))
    .digest('hex');

  const intVal = parseInt(hmac.slice(0, 8), 16);
  const X = (intVal / 0xffffffff) * 99.99;

  const raw = Math.max(1.0, FAIRNESS.rtpPercent / (100 - X));
  return Math.floor(raw * 100) / 100;
}

export function createRound(nonce: number): ProvablyFairResult {
  const serverSeed = generateServerSeed();
  const hash = hashSeed(serverSeed);
  const crashPoint = deriveCrashPoint(serverSeed, nonce);
  return { serverSeed, hash, crashPoint };
}
