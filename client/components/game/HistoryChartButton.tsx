'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import { HistoryEntry } from '@aviator/shared';
import { TIER_TAILWIND, tierFor } from '@/lib/multiplierColors';
import { HistoryChart } from './HistoryChart';

interface Props {
  history: HistoryEntry[];
}

export function HistoryChartButton({ history }: Props) {
  const [open, setOpen] = useState(false);
  const disabled = history.length === 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 w-full bg-[var(--color-bg-panel)] hover:bg-[var(--color-bg-elevated)] border border-white/5 rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <BarChart3 size={16} className="text-rose-400 shrink-0" />
        <span>Ver gráfico do histórico</span>
        <span className="ml-auto text-xs text-white/40 font-normal">
          {history.length} {history.length === 1 ? 'rodada' : 'rodadas'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <HistoryChartModal
            history={history}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface ModalProps {
  history: HistoryEntry[];
  onClose: () => void;
}

function HistoryChartModal({ history, onClose }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const stats = computeStats(history);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-chart-title"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-bg-panel)] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2
              id="history-chart-title"
              className="text-base font-bold text-white"
            >
              Histórico de multiplicadores
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Últimas {history.length}{' '}
              {history.length === 1 ? 'rodada' : 'rodadas'} · linha tracejada
              marca 2.00x
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-4 py-4">
          <HistoryChart history={history} height={320} />
        </div>

        <StatsGrid stats={stats} total={history.length} />
      </motion.div>
    </motion.div>
  );
}

function StatsGrid({
  stats,
  total,
}: {
  stats: ReturnType<typeof computeStats>;
  total: number;
}) {
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="px-6 pb-6 pt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <StatCell label="Média" value={`${stats.avg.toFixed(2)}x`} />
      <StatCell label="Mínimo" value={`${stats.min.toFixed(2)}x`} />
      <StatCell label="Máximo" value={`${stats.max.toFixed(2)}x`} />
      <StatCell
        label="Abaixo de 2x"
        value={`${stats.below2x} (${pct(stats.below2x).toFixed(0)}%)`}
        emphasis
      />
      <TierCell
        label="< 2.00x"
        tier="blue"
        count={stats.tiers.blue}
        percent={pct(stats.tiers.blue)}
      />
      <TierCell
        label="2.00 – 9.99x"
        tier="purple"
        count={stats.tiers.purple}
        percent={pct(stats.tiers.purple)}
      />
      <TierCell
        label="≥ 10.00x"
        tier="pink"
        count={stats.tiers.pink}
        percent={pct(stats.tiers.pink)}
      />
      <StatCell label="Total" value={`${total}`} />
    </div>
  );
}

function StatCell({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div
        className={`font-bold tabular-nums ${emphasis ? 'text-rose-300' : 'text-white'}`}
      >
        {value}
      </div>
    </div>
  );
}

function TierCell({
  label,
  tier,
  count,
  percent,
}: {
  label: string;
  tier: 'blue' | 'purple' | 'pink';
  count: number;
  percent: number;
}) {
  return (
    <div
      className={`border rounded-lg px-3 py-2 ${TIER_TAILWIND[tier]}`}
    >
      <div className="text-[10px] uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="font-bold tabular-nums">
        {count}{' '}
        <span className="text-xs opacity-70">({percent.toFixed(0)}%)</span>
      </div>
    </div>
  );
}

function computeStats(history: HistoryEntry[]) {
  if (history.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      below2x: 0,
      tiers: { blue: 0, purple: 0, pink: 0 },
    };
  }
  const crashes = history.map((h) => h.crashPoint);
  const sum = crashes.reduce((s, c) => s + c, 0);
  const tiers = { blue: 0, purple: 0, pink: 0 };
  let below2x = 0;
  for (const c of crashes) {
    tiers[tierFor(c)] += 1;
    if (c < 2) below2x += 1;
  }
  return {
    avg: sum / crashes.length,
    min: Math.min(...crashes),
    max: Math.max(...crashes),
    below2x,
    tiers,
  };
}
