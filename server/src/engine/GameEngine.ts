import { EventEmitter } from 'events';
import { GAME_RULES, ROUND_TIMING } from '../config/constants';
import { multiplierAt } from '../domain/multiplier';
import { createRound } from '../domain/provablyFair';
import {
  GamePhase,
  HistoryEntry,
  RoundSnapshot,
} from '../domain/types';

export interface GameEngineEvents {
  waiting: (snapshot: RoundSnapshot) => void;
  running: (snapshot: RoundSnapshot) => void;
  tick: (payload: { multiplier: number; elapsed: number }) => void;
  crashed: (entry: HistoryEntry) => void;
}

export class GameEngine extends EventEmitter {
  private phase: GamePhase = 'WAITING';
  private roundId = 0;
  private nonce = 1;
  private hash = '';
  private serverSeed = '';
  private crashPoint = 1;
  private multiplier = 1;
  private startsAt = 0;
  private startedAt = 0;
  private crashedAt = 0;
  private tickHandle: NodeJS.Timeout | null = null;
  private waitingHandle: NodeJS.Timeout | null = null;
  private crashedHandle: NodeJS.Timeout | null = null;
  private readonly history: HistoryEntry[] = [];

  override on<E extends keyof GameEngineEvents>(
    event: E,
    listener: GameEngineEvents[E],
  ): this {
    return super.on(event, listener);
  }

  override emit<E extends keyof GameEngineEvents>(
    event: E,
    ...args: Parameters<GameEngineEvents[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  start(): void {
    this.beginWaitingPhase();
  }

  stop(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    if (this.waitingHandle) clearTimeout(this.waitingHandle);
    if (this.crashedHandle) clearTimeout(this.crashedHandle);
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  getHistory(): HistoryEntry[] {
    return this.history;
  }

  snapshot(): RoundSnapshot {
    return {
      roundId: this.roundId,
      phase: this.phase,
      multiplier: this.multiplier,
      crashPoint: this.phase === 'CRASHED' ? this.crashPoint : undefined,
      hash: this.hash,
      serverSeed: this.phase === 'CRASHED' ? this.serverSeed : undefined,
      startsAt: this.phase === 'WAITING' ? this.startsAt : undefined,
      startedAt: this.phase === 'RUNNING' ? this.startedAt : undefined,
      crashedAt: this.phase === 'CRASHED' ? this.crashedAt : undefined,
    };
  }

  private beginWaitingPhase(): void {
    this.phase = 'WAITING';
    this.multiplier = 1;
    this.roundId += 1;
    this.nonce += 1;

    const round = createRound(this.nonce);
    this.serverSeed = round.serverSeed;
    this.hash = round.hash;
    this.crashPoint = round.crashPoint;

    this.startsAt = Date.now() + ROUND_TIMING.waitingMs;
    this.startedAt = 0;
    this.crashedAt = 0;

    this.emit('waiting', this.snapshot());

    this.waitingHandle = setTimeout(
      () => this.beginRunningPhase(),
      ROUND_TIMING.waitingMs,
    );
  }

  private beginRunningPhase(): void {
    this.phase = 'RUNNING';
    this.startedAt = Date.now();
    this.multiplier = 1;

    this.emit('running', this.snapshot());

    this.tickHandle = setInterval(() => this.tick(), ROUND_TIMING.tickMs);
  }

  private tick(): void {
    const elapsed = (Date.now() - this.startedAt) / 1000;
    this.multiplier = multiplierAt(elapsed);

    if (this.multiplier >= this.crashPoint) {
      this.multiplier = this.crashPoint;
      this.endRound();
      return;
    }

    this.emit('tick', { multiplier: this.multiplier, elapsed });
  }

  private endRound(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
    this.phase = 'CRASHED';
    this.crashedAt = Date.now();

    const entry: HistoryEntry = {
      roundId: this.roundId,
      crashPoint: this.crashPoint,
      hash: this.hash,
      serverSeed: this.serverSeed,
    };
    this.history.unshift(entry);
    if (this.history.length > GAME_RULES.historySize) this.history.pop();

    this.emit('crashed', entry);

    this.crashedHandle = setTimeout(
      () => this.beginWaitingPhase(),
      ROUND_TIMING.crashedMs,
    );
  }
}
