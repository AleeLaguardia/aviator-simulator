import { GamePhase } from '@/lib/types';
import { TierStyle } from './types';

export interface CurveGeometry {
  originX: number;
  originY: number;
  planeX: number;
  planeY: number;
}

export function computeGeometry(
  width: number,
  height: number,
  multiplier: number,
): CurveGeometry {
  const padL = 60;
  const padB = 60;
  const plotW = width - padL - 30;
  const plotH = height - padB - 60;
  const originX = padL;
  const originY = height - padB;

  const t = Math.min(1, (multiplier - 1) / 5);
  const easedX = 1 - Math.pow(1 - t, 1.6);
  const easedY = Math.pow(t, 0.7);

  return {
    originX,
    originY,
    planeX: originX + plotW * (0.05 + 0.95 * easedX),
    planeY: originY - plotH * easedY,
  };
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  geometry: CurveGeometry,
  phase: GamePhase,
  tier: TierStyle,
): void {
  const { originX, originY, planeX, planeY } = geometry;
  const curveColor = phase === 'CRASHED' ? tier.strokeDim : tier.stroke;

  const gradient = ctx.createLinearGradient(originX, originY, originX, planeY);
  gradient.addColorStop(0, tier.fillRgbaTransparent);
  gradient.addColorStop(1, tier.fillRgba);

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.quadraticCurveTo(planeX, originY, planeX, planeY);
  ctx.lineTo(planeX, originY);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.quadraticCurveTo(planeX, originY, planeX, planeY);
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = tier.glow;
  ctx.shadowBlur = phase === 'CRASHED' ? 0 : 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}
