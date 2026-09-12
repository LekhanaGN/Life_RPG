// THE OTHER SIDE - Canonical World Events & Lore Registry (Phase 8)
// Server-authoritative definitions for anomalous world events and recovered lore logs.

import { MissionCategory } from "@/lib/db/client";

export type WorldEventKey =
  | "SIGNAL_SURGE"
  | "STATIC_STORM"
  | "IRON_WAKE"
  | "STILL_SIGNAL"
  | "OPEN_CHANNEL"
  | "BREACH_WARNING"
  | "THE_LONG_NIGHT"
  | "MEMORY_ECHO";

export type EventRarity = "COMMON" | "RARE" | "SPECIAL";
export type EventStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";

export interface WorldEventTemplate {
  key: WorldEventKey;
  title: string;
  description: string;
  loreSnippet: string;
  targetAttribute: MissionCategory | "ANY";
  targetArea?: string;
  requiredCompletions: number;
  durationHours: number;
  rewardCredits: number;
  rewardXp: number;
  corruptionChange: number; // Negative value reduces corruption further
  bossDamageBonus: number; // Bonus damage dealt to active boss upon completion
  rarity: EventRarity;
  loreId?: string;
  visualEffect: {
    ambientColor: string;
    hudBadgeClass: string;
    description: string;
    distortionStyle: "pulse" | "static" | "vibration" | "calm" | "breach" | "darkness";
  };
}

export interface LoreLogDefinition {
  key: string;
  title: string;
  content: string;
  source: string;
}

/**
 * Canonical World Lore Logs
 * Discovered when containing specific supernatural anomalies.
 */
export const WORLD_LORE_LOGS: LoreLogDefinition[] = [
  {
    key: "LOG_07",
    title: "SIGNAL ARCHIVE // LOG 07",
    content: "The signal does not originate from the gate. It is reflected off something located much deeper beneath the threshold.",
    source: "SIGNAL_SURGE",
  },
  {
    key: "LOG_12",
    title: "SIGNAL ARCHIVE // LOG 12",
    content: "The corruption reacts to human attention. When you withdraw focus, the void rushes in to claim the empty ground.",
    source: "STATIC_STORM",
  },
  {
    key: "LOG_19",
    title: "SIGNAL ARCHIVE // LOG 19",
    content: "Someone has been here before us. We found equipment housings dated decades prior to the first reported breach.",
    source: "IRON_WAKE",
  },
  {
    key: "LOG_23",
    title: "SIGNAL ARCHIVE // LOG 23",
    content: "The boundary remembers repeated patterns. Consistency is the only force capable of hardening the dimensional membrane.",
    source: "THE_LONG_NIGHT",
  },
  {
    key: "LOG_31",
    title: "SIGNAL ARCHIVE // LOG 31",
    content: "The Other Side is not empty. It was never empty. It listens to our broadcasts and shifts form to mirror our expectations.",
    source: "BREACH_WARNING",
  },
  {
    key: "LOG_42",
    title: "SIGNAL ARCHIVE // LOG 42",
    content: "When the resonance stabilizes across all frequencies, the threshold inverts. What was shadow becomes glass.",
    source: "MEMORY_ECHO",
  },
];

/**
 * Canonical 8 World Event Templates
 */
export const CANONICAL_WORLD_EVENTS: Record<WorldEventKey, WorldEventTemplate> = {
  SIGNAL_SURGE: {
    key: "SIGNAL_SURGE",
    title: "SIGNAL SURGE",
    description: "Intense dimensional interference detected on high-frequency monitoring bands. Concentrated thought stabilizes the carrier wave.",
    loreSnippet: "Something is interfering with the signal. Concentration strengthens the boundary.",
    targetAttribute: "FOCUS",
    targetArea: "THE_GATE",
    requiredCompletions: 3,
    durationHours: 12,
    rewardCredits: 60,
    rewardXp: 40,
    corruptionChange: -3,
    bossDamageBonus: 0,
    rarity: "COMMON",
    loreId: "LOG_07",
    visualEffect: {
      ambientColor: "#06b6d4",
      hudBadgeClass: "border-cyan-500 text-cyan-300 bg-cyan-950/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]",
      description: "Focused light flickers and electrical distortion pulses.",
      distortionStyle: "pulse",
    },
  },
  STATIC_STORM: {
    key: "STATIC_STORM",
    title: "STATIC STORM",
    description: "Atmospheric ionization is scrambling cognitive telemetry. Mental clarity is required to pierce the electromagnetic haze.",
    loreSnippet: "The signal is breaking apart. Thought is the only thing cutting through.",
    targetAttribute: "MIND",
    targetArea: "PERIMETER_WALL",
    requiredCompletions: 3,
    durationHours: 12,
    rewardCredits: 60,
    rewardXp: 40,
    corruptionChange: -5,
    bossDamageBonus: 0,
    rarity: "COMMON",
    loreId: "LOG_12",
    visualEffect: {
      ambientColor: "#a855f7",
      hudBadgeClass: "border-purple-500 text-purple-300 bg-purple-950/60 shadow-[0_0_12px_rgba(168,85,247,0.4)]",
      description: "Increased scanline static and purple visual interference.",
      distortionStyle: "static",
    },
  },
  IRON_WAKE: {
    key: "IRON_WAKE",
    title: "IRON WAKE",
    description: "Sub-surface seismic tremors indicate entity mobilization beneath the boundary. Somatic rigor channels defensive kinetic energy.",
    loreSnippet: "Something beneath the boundary has started moving.",
    targetAttribute: "BODY",
    targetArea: "WATCHTOWER",
    requiredCompletions: 3,
    durationHours: 14,
    rewardCredits: 70,
    rewardXp: 45,
    corruptionChange: -2,
    bossDamageBonus: 40, // Deals 40 bonus damage to current boss upon containment!
    rarity: "COMMON",
    loreId: "LOG_19",
    visualEffect: {
      ambientColor: "#f97316",
      hudBadgeClass: "border-orange-500 text-orange-300 bg-orange-950/60 shadow-[0_0_12px_rgba(249,115,22,0.4)]",
      description: "Low-frequency rumble vibrations and heavy atmospheric haze.",
      distortionStyle: "vibration",
    },
  },
  STILL_SIGNAL: {
    key: "STILL_SIGNAL",
    title: "STILL SIGNAL",
    description: "An eerie silence has fallen across all broadcast frequencies. Centered intention purges corrupted residual signals.",
    loreSnippet: "The noise stopped. For a moment, everything is still.",
    targetAttribute: "SPIRIT",
    targetArea: "STILLWATER",
    requiredCompletions: 2,
    durationHours: 10,
    rewardCredits: 50,
    rewardXp: 35,
    corruptionChange: -5,
    bossDamageBonus: 0,
    rarity: "COMMON",
    loreId: undefined,
    visualEffect: {
      ambientColor: "#38bdf8",
      hudBadgeClass: "border-sky-500 text-sky-300 bg-sky-950/60 shadow-[0_0_12px_rgba(56,189,248,0.4)]",
      description: "Eerie calm, slowed ambient motion, and muted cyan glow.",
      distortionStyle: "calm",
    },
  },
  OPEN_CHANNEL: {
    key: "OPEN_CHANNEL",
    title: "OPEN CHANNEL",
    description: "A harmonic carrier wave has locked onto a distant human transmission. Cooperative resonance reinforces our outpost.",
    loreSnippet: "The signal has found another human frequency.",
    targetAttribute: "CONNECTION",
    targetArea: "THE_CITADEL",
    requiredCompletions: 2,
    durationHours: 12,
    rewardCredits: 60,
    rewardXp: 40,
    corruptionChange: -3,
    bossDamageBonus: 0,
    rarity: "COMMON",
    loreId: undefined,
    visualEffect: {
      ambientColor: "#10b981",
      hudBadgeClass: "border-emerald-500 text-emerald-300 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
      description: "Emerald harmonic pulses and coherent audio modulation.",
      distortionStyle: "pulse",
    },
  },
  BREACH_WARNING: {
    key: "BREACH_WARNING",
    title: "BREACH WARNING",
    description: "Massive dimensional strain detected across multiple sectors. Execute immediate containment protocols across any discipline.",
    loreSnippet: "The boundary is weakening. All hands to stations.",
    targetAttribute: "ANY",
    targetArea: "THE_GATE",
    requiredCompletions: 4,
    durationHours: 18,
    rewardCredits: 120,
    rewardXp: 80,
    corruptionChange: -8,
    bossDamageBonus: 25,
    rarity: "RARE",
    loreId: "LOG_31",
    visualEffect: {
      ambientColor: "#ef4444",
      hudBadgeClass: "border-red-500 text-red-300 bg-red-950/60 shadow-[0_0_16px_rgba(239,68,68,0.6)] animate-pulse",
      description: "Crimson warning strobes and active tear boundary distortion.",
      distortionStyle: "breach",
    },
  },
  THE_LONG_NIGHT: {
    key: "THE_LONG_NIGHT",
    title: "THE LONG NIGHT",
    description: "A rare total eclipse of the carrier frequency. The Void presses directly against the perimeter until morning breaks.",
    loreSnippet: "Darkness settles across the threshold. Keep the beacon alive.",
    targetAttribute: "ANY",
    targetArea: undefined,
    requiredCompletions: 4,
    durationHours: 24,
    rewardCredits: 200,
    rewardXp: 120,
    corruptionChange: -10,
    bossDamageBonus: 50,
    rarity: "SPECIAL",
    loreId: "LOG_23",
    visualEffect: {
      ambientColor: "#6366f1",
      hudBadgeClass: "border-indigo-400 text-indigo-200 bg-indigo-950/80 shadow-[0_0_20px_rgba(99,102,241,0.5)]",
      description: "Deep shadow vignette, intermittent darkness flickering, extreme tension.",
      distortionStyle: "darkness",
    },
  },
  MEMORY_ECHO: {
    key: "MEMORY_ECHO",
    title: "MEMORY ECHO",
    description: "A resonant feedback loop has surfaced from past survivor missions. Rekindling familiar routines fortifies the anchor.",
    loreSnippet: "Something remembers what you completed before.",
    targetAttribute: "ANY",
    targetArea: undefined,
    requiredCompletions: 2,
    durationHours: 10,
    rewardCredits: 60,
    rewardXp: 40,
    corruptionChange: -3,
    bossDamageBonus: 0,
    rarity: "COMMON",
    loreId: "LOG_42",
    visualEffect: {
      ambientColor: "#f59e0b",
      hudBadgeClass: "border-amber-500 text-amber-300 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.4)]",
      description: "Golden holographic reflections and temporal feedback reverberations.",
      distortionStyle: "pulse",
    },
  },
};

/**
 * Look up an event definition by key
 */
export function getWorldEventDefinition(key: string): WorldEventTemplate {
  return CANONICAL_WORLD_EVENTS[key as WorldEventKey] || CANONICAL_WORLD_EVENTS.SIGNAL_SURGE;
}

/**
 * Look up a lore definition by key
 */
export function getLoreDefinition(key: string): LoreLogDefinition | undefined {
  return WORLD_LORE_LOGS.find((l) => l.key === key);
}

/**
 * Formats a UserWorldEvent DB entity into the ActiveAnomalyData client contract
 */
export function formatActiveAnomalyData(event: any): any {
  if (!event) return null;
  const template = getWorldEventDefinition(event.worldEvent?.key || "SIGNAL_SURGE");
  return {
    id: event.id,
    key: template.key,
    title: template.title,
    description: template.description,
    loreSnippet: template.loreSnippet,
    targetAttribute: template.targetAttribute,
    targetArea: template.targetArea,
    progress: event.progress,
    requiredProgress: event.requiredProgress,
    completed: event.completed,
    rewardClaimed: event.rewardClaimed,
    status: event.status,
    startsAt: event.startsAt,
    expiresAt: event.expiresAt,
    rewards: {
      credits: template.rewardCredits,
      xp: template.rewardXp,
      corruptionReduction: Math.abs(template.corruptionChange),
      bossDamage: template.bossDamageBonus,
      rarity: template.rarity,
    },
    visualEffect: template.visualEffect,
  };
}
