import { GamePhase } from '@aviator/shared';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: GamePhase,
  multiplier: number,
): void {
  const bg = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    width,
  );
  if (phase === 'CRASHED') {
    bg.addColorStop(0, '#2a0a14');
    bg.addColorStop(1, '#0b0810');
  } else {
    bg.addColorStop(0, '#15152a');
    bg.addColorStop(1, '#07070d');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const offset = phase === 'RUNNING' ? (multiplier * 30) % 40 : 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = -offset; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = -offset; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
