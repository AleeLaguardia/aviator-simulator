import { GamePhase } from '@aviator/shared';
import { TierStyle } from './types';

export function drawCenterText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: GamePhase,
  multiplier: number,
  crashPoint: number | undefined,
  startsAt: number | undefined,
  tier: TierStyle,
): void {
  const cx = width / 2;
  const cy = height / 2 - 10;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (phase === 'WAITING') {
    const remaining = Math.max(0, ((startsAt || 0) - Date.now()) / 1000);
    ctx.font = '600 18px ui-sans-serif, system-ui';
    ctx.fillStyle = 'rgba(245, 245, 247, 0.65)';
    ctx.fillText('Próxima rodada em', cx, cy - 50);
    ctx.font = 'bold 88px ui-sans-serif, system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(remaining.toFixed(1) + 's', cx, cy + 20);
    return;
  }

  if (phase === 'CRASHED') {
    ctx.font = 'bold 28px ui-sans-serif, system-ui';
    ctx.fillStyle = tier.glow;
    ctx.fillText('VOOU EMBORA', cx, cy - 60);
    ctx.font = 'bold 108px ui-sans-serif, system-ui';
    ctx.fillStyle = tier.glow;
    ctx.shadowColor = tier.glow;
    ctx.shadowBlur = 30;
    ctx.fillText((crashPoint ?? multiplier).toFixed(2) + 'x', cx, cy + 20);
    ctx.shadowBlur = 0;
    return;
  }

  ctx.font = 'bold 128px ui-sans-serif, system-ui';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = tier.glow;
  ctx.shadowBlur = 35;
  ctx.fillText(multiplier.toFixed(2) + 'x', cx, cy);
  ctx.shadowBlur = 0;
}
