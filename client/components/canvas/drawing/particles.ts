export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

export function spawnPlaneParticles(
  particles: Particle[],
  planeX: number,
  planeY: number,
  multiplier: number,
): void {
  const count = multiplier > 5 ? 3 : 2;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: planeX - 16,
      y: planeY + 4,
      vx: -60 - Math.random() * 60,
      vy: -15 + Math.random() * 30,
      r: 4 + Math.random() * 4,
      life: 1,
    });
  }
}

export function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  dt: number,
): Particle[] {
  return particles.filter((p) => {
    p.life -= dt * 1.4;
    if (p.life <= 0) return false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const alpha = p.life * 0.35;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (0.4 + p.life * 0.8), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 220, 230, ${alpha})`;
    ctx.fill();
    return true;
  });
}
