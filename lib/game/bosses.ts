// THE OTHER SIDE - Centralized Boss Engine (Phase 5)
// Authoritative boss definitions, damage calculations, and progression states.

import { MissionDifficulty } from "@/lib/db/client";

export type BossKey =
  | "THE_PROCRASTINATOR"
  | "THE_DISTRACTION"
  | "THE_DOUBT"
  | "THE_SLEEPLESS";

export interface BossDefinition {
  key: BossKey;
  name: string;
  title: string;
  order: number;
  maxHp: number;
  description: string;
  threatTrait: string;
  threatTraitDesc: string;
  corruptionSource: string;
  corruptionSourceDesc: string;
  accentColor: string;
  banishBonusXp: number;
  banishCorruptionDrop: number;
}

export const BOSS_DEFINITIONS: BossDefinition[] = [
  {
    key: "THE_PROCRASTINATOR",
    name: "THE PROCRASTINATOR",
    title: "Temporal Anomaly",
    order: 1,
    maxHp: 500,
    description:
      "A parasitic entity that distorts your perception of time, murmuring that tomorrow is infinite.",
    threatTrait: "TEMPORAL DISTORTION",
    threatTraitDesc: "Convinces you that tomorrow has infinite hours.",
    corruptionSource: "INFINITE SCROLL VORTEX",
    corruptionSourceDesc: "Siphons dopamine before real-world tasks begin.",
    accentColor: "red",
    banishBonusXp: 200,
    banishCorruptionDrop: 10,
  },
  {
    key: "THE_DISTRACTION",
    name: "THE DISTRACTION",
    title: "Siren of the Void",
    order: 2,
    maxHp: 800,
    description:
      "A relentless sensory swarm fragmenting your attention into thousands of fleeting interruptions.",
    threatTrait: "ATTENTION ATTENUATION",
    threatTraitDesc: "Splits cognitive momentum with micro-impulses.",
    corruptionSource: "NOTIFICATION SWARM",
    corruptionSourceDesc: "Hijacks focus cycles with artificial urgency.",
    accentColor: "purple",
    banishBonusXp: 350,
    banishCorruptionDrop: 12,
  },
  {
    key: "THE_DOUBT",
    name: "THE DOUBT",
    title: "Shadow of Hesitation",
    order: 3,
    maxHp: 1200,
    description:
      "A suffocating mist magnifying self-criticism, paralysis by analysis, and fear of failure.",
    threatTrait: "IMPOSTOR RESONANCE",
    threatTraitDesc: "Amplifies perceived inadequacy and indecision.",
    corruptionSource: "ANALYSIS PARALYSIS",
    corruptionSourceDesc: "Traps intentions in endless circular deliberations.",
    accentColor: "amber",
    banishBonusXp: 500,
    banishCorruptionDrop: 15,
  },
  {
    key: "THE_SLEEPLESS",
    name: "THE SLEEPLESS",
    title: "Midnight Specter",
    order: 4,
    maxHp: 1800,
    description:
      "The ultimate embodiment of burnout, circadian collapse, and destructive exhaustion.",
    threatTrait: "CIRCADIAN EROSION",
    threatTraitDesc: "Trades essential restoration for hollow late-night stimulation.",
    corruptionSource: "RESTLESS INERTIA",
    corruptionSourceDesc: "Depletes somatic stamina and emotional resilience.",
    accentColor: "crimson",
    banishBonusXp: 800,
    banishCorruptionDrop: 20,
  },
];

/**
 * Authoritative Boss Damage by Mission Difficulty
 */
export const BOSS_DAMAGE_MAP: Record<MissionDifficulty, number> = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 45,
  EPIC: 80,
};

/**
 * Calculate damage to active boss for a completed mission
 */
export function getBossDamage(difficulty: MissionDifficulty): number {
  return BOSS_DAMAGE_MAP[difficulty] ?? 10;
}

/**
 * Get boss definition by key
 */
export function getBossDefinition(key: string): BossDefinition {
  const found = BOSS_DEFINITIONS.find((b) => b.key === key);
  return found || BOSS_DEFINITIONS[0];
}

/**
 * Get the next boss definition in the chronological progression sequence
 */
export function getNextBossDefinition(currentKey: string): BossDefinition | null {
  const current = getBossDefinition(currentKey);
  const next = BOSS_DEFINITIONS.find((b) => b.order === current.order + 1);
  return next || null;
}

/**
 * Process boss damage and state changes
 */
export function processBossDamageCalculation(
  currentHp: number,
  maxHp: number,
  damage: number
): {
  damageDealt: number;
  hpBefore: number;
  hpAfter: number;
  isDefeated: boolean;
  hpPercent: number;
} {
  const safeHp = Math.max(0, currentHp);
  const hpAfter = Math.max(0, safeHp - damage);
  const actualDamageDealt = safeHp - hpAfter;
  const isDefeated = hpAfter === 0 && safeHp > 0;
  const hpPercent = maxHp > 0 ? Math.round((hpAfter / maxHp) * 100) : 0;

  return {
    damageDealt: actualDamageDealt,
    hpBefore: safeHp,
    hpAfter,
    isDefeated,
    hpPercent,
  };
}
