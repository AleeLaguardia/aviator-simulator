'use client';

import { HistoryEntry } from '@aviator/shared';
import { History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIER_TAILWIND, tierFor } from '@/lib/multiplierColors';

interface Props {
  history: HistoryEntry[];
}

export function HistoryBar({ history }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-panel)] rounded-xl border border-white/5 min-w-0">
      <History size={16} className="text-white/40 shrink-0" />
      <div className="flex gap-2 overflow-x-auto scrollbar-thin min-w-0 flex-1">
        <AnimatePresence initial={false}>
          {history.map((h) => (
            <motion.div
              key={h.roundId}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`shrink-0 px-3 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
                TIER_TAILWIND[tierFor(h.crashPoint)]
              }`}
              title={`Round #${h.roundId} — hash ${h.hash.slice(0, 12)}…`}
            >
              {h.crashPoint.toFixed(2)}x
            </motion.div>
          ))}
        </AnimatePresence>
        {history.length === 0 && (
          <span className="text-white/30 text-xs">Sem histórico ainda</span>
        )}
      </div>
    </div>
  );
}
