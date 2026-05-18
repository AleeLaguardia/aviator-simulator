'use client';

import { useEffect, useRef } from 'react';
import { GamePhase } from '@aviator/shared';
import { TIER_HEX, tierFor } from '@/lib/multiplierColors';
import { drawBackground } from './drawing/background';
import { drawCenterText } from './drawing/centerText';
import { computeGeometry, drawCurve } from './drawing/curve';
import { drawPlane } from './drawing/plane';
import {
  Particle,
  spawnPlaneParticles,
  updateAndDrawParticles,
} from './drawing/particles';

interface Props {
  phase: GamePhase;
  multiplier: number;
  startsAt?: number;
  crashPoint?: number;
}

const SHAKE_THRESHOLD = 10;

export function AviatorCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const size = { w: 0, h: 0 };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      size.w = rect.width;
      size.h = rect.height;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    let raf = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const W = size.w;
      const H = size.h;
      const { phase, multiplier, startsAt, crashPoint } = propsRef.current;
      const tier = TIER_HEX[tierFor(multiplier)];

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      applyScreenShake(ctx, phase, multiplier);
      drawBackground(ctx, W, H, phase, multiplier);

      const geometry = computeGeometry(W, H, multiplier);

      if (phase !== 'WAITING') {
        drawCurve(ctx, geometry, phase, tier);
      }

      if (phase === 'RUNNING') {
        spawnPlaneParticles(
          particlesRef.current,
          geometry.planeX,
          geometry.planeY,
          multiplier,
        );
      }
      particlesRef.current = updateAndDrawParticles(
        ctx,
        particlesRef.current,
        dt,
      );

      if (phase !== 'WAITING') {
        drawPlane(
          ctx,
          geometry.planeX,
          geometry.planeY,
          phase === 'CRASHED',
          tier.stroke,
        );
      }

      drawCenterText(ctx, W, H, phase, multiplier, crashPoint, startsAt, tier);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block rounded-2xl"
      style={{ touchAction: 'none', width: '100%', height: '100%' }}
    />
  );
}

function applyScreenShake(
  ctx: CanvasRenderingContext2D,
  phase: GamePhase,
  multiplier: number,
): void {
  if (phase !== 'RUNNING' || multiplier <= SHAKE_THRESHOLD) return;
  const intensity = Math.min(10, (multiplier - SHAKE_THRESHOLD) / 3);
  ctx.translate(
    (Math.random() - 0.5) * intensity,
    (Math.random() - 0.5) * intensity,
  );
}
