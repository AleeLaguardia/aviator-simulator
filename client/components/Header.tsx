'use client';

import { Plane, Wallet, Plus, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Player } from '@/lib/types';
import { useState } from 'react';

interface Props {
  player: Player | null;
  connected: boolean;
  onDeposit: (amount: number) => void;
}

export function Header({ player, connected, onDeposit }: Props) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositValue, setDepositValue] = useState(500);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[var(--color-bg-panel)] border-b border-white/5">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, -8, 0, 8, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center"
        >
          <Plane size={22} className="text-white" />
        </motion.div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Aviator</h1>
          <p className="text-xs text-white/40">Provably Fair Simulator</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
            connected
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-rose-500/10 text-rose-300'
          }`}
        >
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'conectado' : 'offline'}
        </div>

        {player && (
          <div className="flex items-center gap-2 bg-[var(--color-bg-elevated)] rounded-xl px-4 py-2 border border-white/5">
            <Wallet size={16} className="text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                Saldo
              </div>
              <div className="font-bold text-emerald-300 tabular-nums">
                R$ {player.balance.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => setShowDeposit((v) => !v)}
              className="ml-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 p-1.5 rounded-lg transition"
              title="Depositar saldo fictício"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {showDeposit && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-6 top-20 z-10 bg-[var(--color-bg-elevated)] border border-white/10 rounded-xl p-4 shadow-2xl min-w-[260px]"
        >
          <div className="text-xs text-white/60 mb-2">
            Depósito fictício (R$ 0–10.000)
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={depositValue}
              onChange={(e) => setDepositValue(Number(e.target.value))}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={() => {
                onDeposit(depositValue);
                setShowDeposit(false);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 rounded-lg text-sm"
            >
              Depositar
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setDepositValue(v)}
                className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded px-2 py-1"
              >
                {v}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
