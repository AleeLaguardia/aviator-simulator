import { describe, expect, it } from 'vitest';
import {
  createRound,
  deriveCrashPoint,
  generateServerSeed,
  hashSeed,
} from './provablyFair';

describe('hashSeed', () => {
  it('produces the SHA-256 of the input', () => {
    expect(hashSeed('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(hashSeed('aviator')).toBe(
      '6cfeb2b7d2d4ab1d46fdaa3a7c67745e1f97daaf336cd1afe85a8499a3d7b31f',
    );
  });

  it('is deterministic', () => {
    const seed = 'deadbeefcafebabe';
    expect(hashSeed(seed)).toBe(hashSeed(seed));
  });
});

describe('generateServerSeed', () => {
  it('returns a 64-character hex string (32 bytes)', () => {
    const seed = generateServerSeed();
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique seeds across calls', () => {
    const seeds = new Set(Array.from({ length: 50 }, generateServerSeed));
    expect(seeds.size).toBe(50);
  });
});

describe('deriveCrashPoint', () => {
  it('is deterministic for a given seed + nonce', () => {
    const seed = 'a'.repeat(64);
    expect(deriveCrashPoint(seed, 1)).toBe(deriveCrashPoint(seed, 1));
    expect(deriveCrashPoint(seed, 99)).toBe(deriveCrashPoint(seed, 99));
  });

  it('produces different values for different nonces', () => {
    const seed = 'a'.repeat(64);
    const a = deriveCrashPoint(seed, 1);
    const b = deriveCrashPoint(seed, 2);
    expect(a).not.toBe(b);
  });

  it('produces different values for different seeds', () => {
    const a = deriveCrashPoint('a'.repeat(64), 1);
    const b = deriveCrashPoint('b'.repeat(64), 1);
    expect(a).not.toBe(b);
  });

  it('always returns a value >= 1.00', () => {
    for (let nonce = 1; nonce < 500; nonce++) {
      const crash = deriveCrashPoint('seed', nonce);
      expect(crash).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('caps to two decimal places', () => {
    for (let nonce = 1; nonce < 100; nonce++) {
      const crash = deriveCrashPoint('seed', nonce);
      const cents = crash * 100;
      expect(Math.abs(cents - Math.round(cents))).toBeLessThan(0.0001);
    }
  });
});

describe('createRound', () => {
  it('returns hash that matches sha256(serverSeed)', () => {
    const { serverSeed, hash } = createRound(1);
    expect(hashSeed(serverSeed)).toBe(hash);
  });

  it('returns crashPoint matching deriveCrashPoint(serverSeed, nonce)', () => {
    const nonce = 42;
    const { serverSeed, crashPoint } = createRound(nonce);
    expect(crashPoint).toBe(deriveCrashPoint(serverSeed, nonce));
  });
});
