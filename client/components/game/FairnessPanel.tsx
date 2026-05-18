'use client';

import { ShieldCheck, Hash, Key } from 'lucide-react';

interface Props {
  hash: string;
  serverSeed?: string;
  roundId: number;
  crashPoint?: number;
}

export function FairnessPanel({ hash, serverSeed, roundId, crashPoint }: Props) {
  return (
    <div className="bg-[var(--color-bg-panel)] rounded-2xl border border-white/5 p-5 flex flex-col gap-3">
      <h3 className="font-semibold flex items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-400" />
        Provably Fair · Round #{roundId}
      </h3>
      <p className="text-xs text-white/50 leading-relaxed">
        O servidor sorteia uma <span className="text-white/80">seed</span> antes da rodada e publica seu{' '}
        <span className="text-white/80">hash SHA-256</span>. Quando o avião cai, a seed é revelada e você pode verificar que o multiplicador foi derivado de
        <code className="text-rose-300"> max(1, 99 / (100 − X))</code>.
      </p>

      <div className="space-y-2 text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-white/40 uppercase tracking-wider text-[10px] mb-1">
            <Hash size={10} /> Hash (comprometido antes)
          </div>
          <code className="block bg-black/40 rounded-lg px-3 py-2 break-all text-white/70 font-mono">
            {hash || '—'}
          </code>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-white/40 uppercase tracking-wider text-[10px] mb-1">
            <Key size={10} /> Server seed (revelada no crash)
          </div>
          <code className="block bg-black/40 rounded-lg px-3 py-2 break-all text-emerald-200/80 font-mono">
            {serverSeed || 'aguardando crash…'}
          </code>
        </div>
        {crashPoint !== undefined && (
          <div className="text-rose-300 text-center font-semibold pt-1">
            Crash desta rodada: {crashPoint.toFixed(2)}x
          </div>
        )}
      </div>
    </div>
  );
}
