// THE OTHER SIDE - Centralized World & Corruption Engine (Phase 5)
// Authoritative formulas for world areas, corruption reduction, and dimensional restoration.

import { MissionCategory, MissionDifficulty } from "@/lib/db/client";

export type WorldAreaKey =
  | "THE_GATE"
  | "KNOWLEDGE_FOREST"
  | "FOCUS_LAB"
  | "IRON_PEAK"
  | "STILLWATER"
  | "THE_CITADEL";

export interface WorldAreaDefinition {
  key: WorldAreaKey;
  name: string;
  subtitle: string;
  description: string;
  category: MissionCategory | null;
  requiredCorruption: number; // Unlocked when current corruption <= requiredCorruption
  accentColor: string;
  theme: {
    border: string;
    glow: string;
    bg: string;
    text: string;
  };
}

export const WORLD_AREAS: WorldAreaDefinition[] = [
  {
    key: "THE_GATE",
    name: "THE GATE",
    subtitle: "Sanctuary Breach Point",
    description: "The dimensional anchor connecting your physical domain to the parallel realm.",
    category: null,
    requiredCorruption: 100, // Always unlocked
    accentColor: "cyan",
    theme: {
      border: "border-cyan-500/50",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      bg: "bg-cyan-950/30",
      text: "text-cyan-300",
    },
  },
  {
    key: "KNOWLEDGE_FOREST",
    name: "KNOWLEDGE FOREST",
    subtitle: "Arboretum of Pure Cognition",
    description: "Vast neural groves blooming with intellectual clarity and deep focus.",
    category: "MIND",
    requiredCorruption: 85,
    accentColor: "blue",
    theme: {
      border: "border-blue-500/50",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
      bg: "bg-blue-950/30",
      text: "text-blue-300",
    },
  },
  {
    key: "FOCUS_LAB",
    name: "FOCUS LAB",
    subtitle: "Chamber of Singularity",
    description: "High-energy precision research sector shielded from external noise and distractions.",
    category: "FOCUS",
    requiredCorruption: 70,
    accentColor: "amber",
    theme: {
      border: "border-amber-500/50",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      bg: "bg-amber-950/30",
      text: "text-amber-300",
    },
  },
  {
    key: "IRON_PEAK",
    name: "IRON PEAK",
    subtitle: "Citadel of Physical Vitality",
    description: "Towering obsidian monolith forged through athletic discipline and somatic endurance.",
    category: "BODY",
    requiredCorruption: 55,
    accentColor: "emerald",
    theme: {
      border: "border-emerald-500/50",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
      bg: "bg-emerald-950/30",
      text: "text-emerald-300",
    },
  },
  {
    key: "STILLWATER",
    name: "STILLWATER",
    subtitle: "Reflective Basin",
    description: "Tranquil mirror lake dissolving psychological tension, anxiety, and doubt.",
    category: "SPIRIT",
    requiredCorruption: 40,
    accentColor: "purple",
    theme: {
      border: "border-purple-500/50",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
      bg: "bg-purple-950/30",
      text: "text-purple-300",
    },
  },
  {
    key: "THE_CITADEL",
    name: "THE CITADEL",
    subtitle: "Spire of Human Resonance",
    description: "Grand communal beacon strengthening trust, empathy, and unbreakable bonds.",
    category: "CONNECTION",
    requiredCorruption: 20,
    accentColor: "rose",
    theme: {
      border: "border-rose-500/50",
      glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
      bg: "bg-rose-950/30",
      text: "text-rose-300",
    },
  },
];

/**
 * Authoritative Corruption Reduction by Mission Difficulty
 */
export const CORRUPTION_REDUCTIONS: Record<MissionDifficulty, number> = {
  EASY: 2,
  MEDIUM: 4,
  HARD: 6,
  EPIC: 10,
};

/**
 * Authoritative Area Restoration Gain by Mission Difficulty
 */
export const AREA_RESTORATION_GAINS: Record<MissionDifficulty, number> = {
  EASY: 2,
  MEDIUM: 4,
  HARD: 6,
  EPIC: 10,
};

/**
 * Category to World Area mapping
 */
export const CATEGORY_TO_AREA_MAP: Record<MissionCategory, WorldAreaKey> = {
  MIND: "KNOWLEDGE_FOREST",
  FOCUS: "FOCUS_LAB",
  BODY: "IRON_PEAK",
  SPIRIT: "STILLWATER",
  CONNECTION: "THE_CITADEL",
};

/**
 * Calculate corruption reduction for a mission
 */
export function getCorruptionReduction(difficulty: MissionDifficulty): number {
  return CORRUPTION_REDUCTIONS[difficulty] ?? 2;
}

/**
 * Calculate area restoration percentage gain for a mission
 */
export function getAreaRestorationGain(difficulty: MissionDifficulty): number {
  return AREA_RESTORATION_GAINS[difficulty] ?? 2;
}

/**
 * Get target world area for mission category
 */
export function getAreaForCategory(category: MissionCategory): WorldAreaKey {
  return CATEGORY_TO_AREA_MAP[category] ?? "THE_GATE";
}

/**
 * Clamps corruption strictly within [0, 100]
 */
export function clampCorruption(corruption: number): number {
  return Math.min(100, Math.max(0, Math.round(corruption)));
}

/**
 * Clamps restoration strictly within [0, 100]
 */
export function clampRestoration(restoration: number): number {
  return Math.min(100, Math.max(0, Math.round(restoration)));
}

/**
 * Returns whether an area is unlocked given the world's corruption
 */
export function isAreaUnlockedByCorruption(
  areaKey: WorldAreaKey,
  corruption: number
): boolean {
  const def = WORLD_AREAS.find((a) => a.key === areaKey);
  if (!def) return false;
  return corruption <= def.requiredCorruption;
}

/**
 * Evaluates all unlocked areas given current corruption
 */
export function getUnlockedAreas(corruption: number): WorldAreaKey[] {
  return WORLD_AREAS.filter((a) => corruption <= a.requiredCorruption).map(
    (a) => a.key
  );
}

/**
 * Look up area definition by key
 */
export function getAreaDefinition(key: WorldAreaKey): WorldAreaDefinition {
  const found = WORLD_AREAS.find((a) => a.key === key);
  return found || WORLD_AREAS[0];
}
