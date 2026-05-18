import { GAME_RULES } from '../config/constants';
import { Player } from '@aviator/shared';

const round2 = (n: number) => Math.floor(n * 100) / 100;

export class PlayerStore {
  private readonly players = new Map<string, Player>();

  create(id: string): Player {
    const player: Player = {
      id,
      name: `Pilot-${id.slice(0, 4)}`,
      balance: GAME_RULES.startingBalance,
    };
    this.players.set(id, player);
    return player;
  }

  get(id: string): Player | undefined {
    return this.players.get(id);
  }

  remove(id: string): void {
    this.players.delete(id);
  }

  rename(id: string, name: string): Player | undefined {
    const p = this.players.get(id);
    if (!p) return undefined;
    p.name = name.slice(0, 16) || p.name;
    return p;
  }

  deposit(id: string, amount: number): Player | undefined {
    const p = this.players.get(id);
    if (!p) return undefined;
    const value = Math.max(0, Math.min(GAME_RULES.maxDeposit, Math.floor(amount)));
    if (value <= 0) return p;
    p.balance = round2(p.balance + value);
    return p;
  }

  debit(id: string, amount: number): boolean {
    const p = this.players.get(id);
    if (!p || amount > p.balance) return false;
    p.balance = round2(p.balance - amount);
    return true;
  }

  credit(id: string, amount: number): void {
    const p = this.players.get(id);
    if (!p) return;
    p.balance = round2(p.balance + amount);
  }
}
