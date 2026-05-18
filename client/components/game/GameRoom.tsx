'use client';

import { useGameSocket } from '@/hooks/useGameSocket';
import { AviatorCanvas } from '@/components/canvas/AviatorCanvas';
import { BetSlot } from '@/components/game/BetSlot';
import { HistoryBar } from '@/components/game/HistoryBar';
import { Header } from '@/components/layout/Header';
import { PlayersList } from '@/components/game/PlayersList';
import { FairnessPanel } from '@/components/game/FairnessPanel';
import { HistoryChartButton } from '@/components/game/HistoryChartButton';

export function GameRoom() {
  const { state, placeBet, cashout, deposit } = useGameSocket();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        player={state.player}
        connected={state.connected}
        onDeposit={deposit}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 p-4 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col gap-4 min-h-0 min-w-0">
          <HistoryBar history={state.history} />

          <div className="relative flex-1 min-h-[420px] w-full max-w-[960px] mx-auto rounded-2xl overflow-hidden border border-white/5 bg-black/30">
            <AviatorCanvas
              phase={state.phase}
              multiplier={state.multiplier}
              startsAt={state.startsAt}
              crashPoint={state.crashPoint}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BetSlot
              slot={0}
              phase={state.phase}
              multiplier={state.multiplier}
              player={state.player}
              myBet={state.myBets[0]}
              lastCashout={state.lastCashouts[0]}
              error={state.errors[0]}
              defaultAmount={20}
              onPlaceBet={placeBet}
              onCashout={cashout}
            />
            <BetSlot
              slot={1}
              phase={state.phase}
              multiplier={state.multiplier}
              player={state.player}
              myBet={state.myBets[1]}
              lastCashout={state.lastCashouts[1]}
              error={state.errors[1]}
              defaultAmount={50}
              onPlaceBet={placeBet}
              onCashout={cashout}
            />
          </div>
        </div>

        <aside className="flex flex-col gap-4 min-w-0">
          <PlayersList bets={state.activeBets} />
          <FairnessPanel
            hash={state.hash}
            serverSeed={state.serverSeed}
            roundId={state.roundId}
            crashPoint={state.crashPoint}
          />
          <HistoryChartButton history={state.history} />
        </aside>
      </main>

      <footer className="px-6 py-3 text-center text-xs text-white/30 border-t border-white/5">
        Simulador educacional · saldo fictício · sem dinheiro real · server-authoritative state via Socket.io
      </footer>
    </div>
  );
}
