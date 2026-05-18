export function drawPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  crashed: boolean,
  strokeColor: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(crashed ? Math.PI / 5 : -Math.PI / 7);
  ctx.fillStyle = crashed ? '#2a2a3a' : '#ffffff';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-10, -7, 18, -5);
  ctx.lineTo(26, 0);
  ctx.lineTo(18, 5);
  ctx.quadraticCurveTo(-10, 7, -22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, -3);
  ctx.lineTo(-14, -18);
  ctx.lineTo(4, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, 3);
  ctx.lineTo(-14, 14);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-22, -2);
  ctx.lineTo(-28, -10);
  ctx.lineTo(-18, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
