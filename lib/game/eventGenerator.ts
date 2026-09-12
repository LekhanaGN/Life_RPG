// THE OTHER SIDE - Context-Aware World Event Generator (Phase 8)
// Server-authoritative logic for event qualification, lifecycle evaluation, and intelligent scheduling.

import {
  WorldEventKey,
  WorldEventTemplate,
  CANONICAL_WORLD_EVENTS,
} from "./worldEvents";

export interface EventGenerationContext {
  corruption: number;
  activeBossDefeated: boolean;
  activeBossKey?: string;
  characterAttributes?: {
    mind: number;
    body: number;
    focus: number;
    spirit: number;
    connection: number;
  };
  recentCompletedEventKeys?: string[];
  lastEventFinishedAt?: Date | null;
}

// Minimum rest cooldown between world events (in milliseconds)
// Default: 2 hours, can be adjusted for testing/simulation
export const EVENT_COOLDOWN_MS = 2 * 60 * 60 * 1000;

/**
 * Pure function: Checks if the user is eligible for a new event generation.
 */
export function isEligibleForNewEvent(
  hasActiveEvent: boolean,
  lastFinishedAt?: Date | null,
  now: Date = new Date(),
  bypassCooldown: boolean = false
): boolean {
  if (hasActiveEvent) return false;
  if (bypassCooldown || !lastFinishedAt) return true;

  const elapsed = now.getTime() - new Date(lastFinishedAt).getTime();
  return elapsed >= EVENT_COOLDOWN_MS;
}

/**
 * Evaluates whether an active event instance has expired based on server time.
 */
export function isEventExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(expiresAt).getTime();
}

/**
 * Intelligently selects the next World Event template based on game world context.
 * Adapts to high corruption, active boss threat, and player variety.
 */
export function selectEligibleEventTemplate(
  ctx: EventGenerationContext
): WorldEventTemplate {
  const recentSet = new Set(ctx.recentCompletedEventKeys || []);

  // Candidate weighting pool
  const candidates: { key: WorldEventKey; weight: number }[] = [
    { key: "SIGNAL_SURGE", weight: 15 },
    { key: "STATIC_STORM", weight: 15 },
    { key: "IRON_WAKE", weight: 15 },
    { key: "STILL_SIGNAL", weight: 15 },
    { key: "OPEN_CHANNEL", weight: 15 },
    { key: "BREACH_WARNING", weight: 10 },
    { key: "THE_LONG_NIGHT", weight: 5 },
    { key: "MEMORY_ECHO", weight: 10 },
  ];

  // 1. If world corruption is critically high (> 60%), emergency events surge
  if (ctx.corruption >= 60) {
    for (const c of candidates) {
      if (c.key === "BREACH_WARNING") c.weight += 35;
      if (c.key === "STATIC_STORM") c.weight += 25;
      if (c.key === "THE_LONG_NIGHT") c.weight += 20;
    }
  }

  // 2. If active boss is still roaming, combat event IRON_WAKE gains priority
  if (!ctx.activeBossDefeated) {
    const ironWake = candidates.find((c) => c.key === "IRON_WAKE");
    if (ironWake) ironWake.weight += 30;
  }

  // 3. De-prioritize recently completed events to prevent repetition
  for (const c of candidates) {
    if (recentSet.has(c.key)) {
      c.weight = Math.max(2, Math.floor(c.weight * 0.3));
    }
  }

  // Calculate weighted sum
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) {
      return CANONICAL_WORLD_EVENTS[c.key];
    }
  }

  return CANONICAL_WORLD_EVENTS.SIGNAL_SURGE;
}
