'use client';

import { Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveBet } from '@/lib/types';

interface Props {
  bets: ActiveBet[];
}

export function PlayersList({ bets }: Props) {
  const total = bets.reduce((sum, b) => sum + b.amount, 0);
  const cashed = bets.filter((b) => b.cashedOutAt).length;

  return (
    <div className="bg-[var(--color-bg-panel)] rounded-2xl border border-white/5 p-5 flex flex-col gap-3 min-h-0">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Users size={16} className="text-rose-400" />
          Jogadores ({bets.length})
        </h3>
        <div className="text-xs text-white/40">
          Pot: <span className="text-white/80 font-semibold">R$ {total.toFixed(0)}</span>
          {' · '}
          <span className="text-emerald-300">{cashed} retirados</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin min-h-[120px] max-h-[320px]">
        {bets.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">
            Nenhuma aposta nesta rodada
          </div>
        )}
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {bets.map((b) => (
              <motion.div
                key={`${b.playerId}-${b.slot}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  b.cashedOutAt
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white/3 border border-white/5'
                }`}
              >
                <span className="text-white/80 truncate flex items-center gap-1.5 min-w-0">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${
                      b.slot === 0
                        ? 'bg-rose-500/30 text-rose-200'
                        : 'bg-cyan-500/30 text-cyan-200'
                    }`}
                  >
                    {b.slot + 1}
                  </span>
                  <span className="truncate">{b.playerName}</span>
                </span>
                <div className="flex items-center gap-2 tabular-nums shrink-0">
                  <span className="text-white/50 text-xs">
                    R$ {b.amount.toFixed(0)}
                  </span>
                  {b.cashedOutAt && (
                    <span className="text-emerald-300 font-semibold">
                      {b.cashedOutAt.toFixed(2)}x · +
                      {b.winnings?.toFixed(2)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
