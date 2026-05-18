'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Plus,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import {
  ActiveBet,
  BetSlot as BetSlotType,
  CashoutResult,
  GamePhase,
  Player,
} from '@aviator/shared';

interface Props {
  slot: BetSlotType;
  phase: GamePhase;
  multiplier: number;
  player: Player | null;
  myBet: ActiveBet | null;
  lastCashout: CashoutResult | null;
  error: string | null;
  defaultAmount?: number;
  onPlaceBet: (slot: BetSlotType, amount: number, autoCashout?: number) => void;
  onCashout: (slot: BetSlotType) => void;
}

const QUICK_AMOUNTS = [10, 50, 100, 500];

export function BetSlot({
  slot,
  phase,
  multiplier,
  player,
  myBet,
  lastCashout,
  error,
  defaultAmount = 20,
  onPlaceBet,
  onCashout,
}: Props) {
  const [amountStr, setAmountStr] = useState(String(defaultAmount));
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoValue, setAutoValue] = useState(2);
  const [pending, setPending] = useState<{
    amount: number;
    autoCashout?: number;
  } | null>(null);

  const amount = Number(amountStr) || 0;
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (
      prevPhaseRef.current !== 'WAITING' &&
      phase === 'WAITING' &&
      pending &&
      !myBet
    ) {
      onPlaceBet(slot, pending.amount, pending.autoCashout);
      setPending(null);
    }
    prevPhaseRef.current = phase;
  }, [phase, pending, myBet, slot, onPlaceBet]);

  const handleAmountChange = (raw: string) => {
    const cleaned = raw.replace(',', '.');
    if (cleaned === '') {
      setAmountStr('');
      return;
    }
    if (!/^\d*\.?\d{0,2}$/.test(cleaned)) return;
    const normalized = cleaned.replace(/^0+(?=\d)/, '');
    setAmountStr(normalized);
  };

  const adjustAmount = (delta: number) => {
    const next = Math.max(1, Math.round((amount + delta) * 100) / 100);
    setAmountStr(String(next));
  };

  const validAmount =
    player !== null && amount >= 1 && amount <= (player?.balance ?? 0);

  const canPlace = phase === 'WAITING' && !myBet && validAmount;
  const canSchedule =
    phase !== 'WAITING' && !myBet && !pending && validAmount;

  const canCashout = phase === 'RUNNING' && !!myBet && !myBet.cashedOutAt;

  const liveWin = canCashout ? (myBet?.amount ?? 0) * multiplier : 0;

  const handlePlace = () => {
    onPlaceBet(slot, amount, autoEnabled ? autoValue : undefined);
  };

  const handleSchedule = () => {
    setPending({
      amount,
      autoCashout: autoEnabled ? autoValue : undefined,
    });
  };

  const handleCancelPending = () => {
    setPending(null);
  };

  const handleCashout = () => {
    onCashout(slot);
  };

  const inputsLocked = !!myBet;

  useEffect(() => {
    if (!pending) return;
    setPending((p) =>
      p
        ? {
            amount,
            autoCashout: autoEnabled ? autoValue : undefined,
          }
        : p,
    );
  }, [amount, autoEnabled, autoValue]);

  return (
    <div className="bg-[var(--color-bg-panel)] rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${
              slot === 0
                ? 'bg-rose-500/30 text-rose-200'
                : 'bg-cyan-500/30 text-cyan-200'
            }`}
          >
            {slot + 1}
          </span>
          Aposta {slot + 1}
        </h3>
        {myBet && !myBet.cashedOutAt && phase !== 'CRASHED' && (
          <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
            ativa
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustAmount(-10)}
          disabled={inputsLocked}
          className="bg-white/5 hover:bg-white/10 rounded-lg p-2"
        >
          <Minus size={12} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={amountStr}
          disabled={inputsLocked}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-center font-bold tabular-nums text-sm focus:outline-none focus:border-rose-500/50 disabled:opacity-60 min-w-0"
        />
        <button
          onClick={() => adjustAmount(10)}
          disabled={inputsLocked}
          className="bg-white/5 hover:bg-white/10 rounded-lg p-2"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            disabled={inputsLocked}
            onClick={() => setAmountStr(String(v))}
            className="text-[11px] bg-white/5 hover:bg-white/10 rounded-md py-1 font-semibold disabled:opacity-50"
          >
            {v}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1.5 text-xs">
        <input
          type="checkbox"
          checked={autoEnabled}
          disabled={inputsLocked}
          onChange={(e) => setAutoEnabled(e.target.checked)}
          className="accent-rose-500"
        />
        Auto
        <input
          type="number"
          step="0.1"
          min="1.01"
          value={autoValue}
          disabled={!autoEnabled || inputsLocked}
          onChange={(e) =>
            setAutoValue(Math.max(1.01, Number(e.target.value)))
          }
          className="w-14 bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-center tabular-nums disabled:opacity-50"
        />
        x
      </label>

      <AnimatePresence mode="wait">
        {canCashout ? (
          <motion.button
            key="cashout"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleCashout}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-black font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/30"
          >
            RETIRAR
            <div className="text-xs opacity-80 tabular-nums">
              R$ {liveWin.toFixed(2)} ({multiplier.toFixed(2)}x)
            </div>
          </motion.button>
        ) : myBet?.cashedOutAt ? (
          <motion.div
            key="cashed"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 font-semibold py-3 rounded-xl text-center text-xs"
          >
            <CheckCircle2 size={14} className="inline mr-1.5" />
            {myBet.cashedOutAt.toFixed(2)}x → R${' '}
            {myBet.winnings?.toFixed(2)}
          </motion.div>
        ) : myBet && phase === 'CRASHED' ? (
          <motion.div
            key="lost"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-rose-500/15 border border-rose-500/40 text-rose-200 font-semibold py-3 rounded-xl text-center text-xs"
          >
            Perdeu R$ {myBet.amount.toFixed(2)}
          </motion.div>
        ) : myBet ? (
          <motion.div
            key="waiting"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-amber-500/15 border border-amber-500/40 text-amber-200 font-semibold py-3 rounded-xl text-center text-xs"
          >
            R$ {myBet.amount.toFixed(2)} confirmada
          </motion.div>
        ) : pending ? (
          <motion.button
            key="pending"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleCancelPending}
            className="bg-amber-500/15 border border-amber-500/40 text-amber-100 hover:bg-amber-500/25 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 group"
          >
            <Clock size={14} className="shrink-0" />
            <span>
              Próxima rodada: R$ {pending.amount.toFixed(2)}
              {pending.autoCashout
                ? ` · auto ${pending.autoCashout}x`
                : ''}
            </span>
            <X
              size={14}
              className="shrink-0 opacity-60 group-hover:opacity-100"
            />
          </motion.button>
        ) : phase === 'WAITING' ? (
          <motion.button
            key="place"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handlePlace}
            disabled={!canPlace}
            className={`${
              slot === 0
                ? 'from-rose-500 to-rose-700 shadow-rose-500/30'
                : 'from-cyan-500 to-cyan-700 shadow-cyan-500/30'
            } bg-gradient-to-r hover:brightness-110 text-white font-bold py-3 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 disabled:from-white/10 disabled:to-white/5 disabled:text-white/40 disabled:shadow-none`}
          >
            <Rocket size={14} />
            APOSTAR
          </motion.button>
        ) : (
          <motion.button
            key="schedule"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleSchedule}
            disabled={!canSchedule}
            className={`${
              slot === 0
                ? 'border-rose-500/40 text-rose-200 hover:bg-rose-500/15'
                : 'border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/15'
            } bg-transparent border-2 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent`}
          >
            <Clock size={14} />
            APOSTAR NA PRÓXIMA
          </motion.button>
        )}
      </AnimatePresence>

      {lastCashout && phase === 'CRASHED' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-emerald-300 text-center"
        >
          última: {lastCashout.multiplier.toFixed(2)}x → R${' '}
          {lastCashout.winnings.toFixed(2)}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2 py-1.5"
        >
          <AlertTriangle size={12} className="shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
