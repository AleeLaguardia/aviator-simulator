import { TIER_HEX } from '@/lib/multiplierColors';

export type TierStyle = (typeof TIER_HEX)[keyof typeof TIER_HEX];
