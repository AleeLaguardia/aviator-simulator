'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HistoryEntry } from '@aviator/shared';
import { TIER_HEX, tierFor } from '@/lib/multiplierColors';

interface Props {
  history: HistoryEntry[];
  height?: number;
}

interface ChartDatum {
  round: string;
  crash: number;
  fill: string;
  hash: string;
}

export function HistoryChart({ history, height = 300 }: Props) {
  const data: ChartDatum[] = history
    .slice()
    .reverse()
    .map((h) => ({
      round: `#${h.roundId}`,
      crash: h.crashPoint,
      fill: TIER_HEX[tierFor(h.crashPoint)].stroke,
      hash: h.hash,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="round"
          stroke="rgba(255,255,255,0.4)"
          fontSize={10}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="rgba(255,255,255,0.4)"
          fontSize={10}
          tickLine={false}
          tickFormatter={(v) => `${v}x`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={{
            background: '#11111c',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
          formatter={(value: number) => [`${value.toFixed(2)}x`, 'Crash']}
        />
        <ReferenceLine
          y={2}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="4 4"
          label={{
            value: '2x',
            position: 'right',
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 10,
          }}
        />
        <Bar dataKey="crash" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
