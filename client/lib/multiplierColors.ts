export type MultiplierTier = 'blue' | 'purple' | 'pink';

export function tierFor(multiplier: number): MultiplierTier {
  if (multiplier < 2) return 'blue';
  if (multiplier < 10) return 'purple';
  return 'pink';
}

export const TIER_HEX: Record<
  MultiplierTier,
  {
    stroke: string;
    strokeDim: string;
    glow: string;
    fillRgba: string;
    fillRgbaTransparent: string;
  }
> = {
  blue: {
    stroke: '#3b82f6',
    strokeDim: '#1e3a8a',
    glow: '#60a5fa',
    fillRgba: 'rgba(59, 130, 246, 0.45)',
    fillRgbaTransparent: 'rgba(59, 130, 246, 0)',
  },
  purple: {
    stroke: '#a855f7',
    strokeDim: '#581c87',
    glow: '#c084fc',
    fillRgba: 'rgba(168, 85, 247, 0.45)',
    fillRgbaTransparent: 'rgba(168, 85, 247, 0)',
  },
  pink: {
    stroke: '#ec4899',
    strokeDim: '#831843',
    glow: '#f472b6',
    fillRgba: 'rgba(236, 72, 153, 0.45)',
    fillRgbaTransparent: 'rgba(236, 72, 153, 0)',
  },
};

export const TIER_TAILWIND: Record<MultiplierTier, string> = {
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  pink: 'bg-pink-500/15 text-pink-300 border-pink-500/40',
};
