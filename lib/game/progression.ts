// THE OTHER SIDE - Game Progression Coordinator (Phase 4)
// Coordinates reward evaluation, duplicate checks, attribute boosts, and leveling.

import { DbCharacter, DbMission, MissionFrequency } from "@/lib/db/client";
import { calculateMissionReward, RewardBreakdown } from "./rewards";
import { getLevelFromXP, checkLevelUp, LevelUpCheck } from "./leveling";

export interface ProgressionResult {
  eligible: boolean;
  reason?: string;
  rewards: RewardBreakdown;
  character: {
    id: string;
    userId: string;
    name: string;
    archetype: string;
    level: number;
    xp: number;
    credits: number;
    mind: number;
    body: number;
    focus: number;
    spirit: number;
    connection: number;
  };
  levelUp: {
    occurred: boolean;
    previousLevel: number;
    newLevel: number;
    levelsGained: number;
  };
}

/**
 * Checks if two dates fall on the same calendar day (UTC)
 */
export function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

/**
 * Checks if two dates fall in the same calendar week (Monday as start of week)
 */
export function isSameCalendarWeek(d1: Date, d2: Date): boolean {
  const getWeekNumber = (d: Date) => {
    const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNr = (target.getUTCDay() + 6) % 7; // Monday = 0
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.getTime();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
  };

  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    getWeekNumber(d1) === getWeekNumber(d2)
  );
}

/**
 * Validates whether a mission can be completed based on its frequency and prior completions.
 */
export function validateMissionCompletionEligibility(
  frequency: MissionFrequency,
  lastCompletedAt?: Date | null,
  now = new Date()
): { eligible: boolean; reason?: string } {
  if (!lastCompletedAt) {
    return { eligible: true };
  }

  const lastDate = new Date(lastCompletedAt);

  switch (frequency) {
    case "ONCE":
      return {
        eligible: false,
        reason: "MISSION ALREADY COMPLETED: Single-occurrence objective has already been fulfilled.",
      };

    case "DAILY":
      if (isSameCalendarDay(lastDate, now)) {
        return {
          eligible: false,
          reason: "MISSION ALREADY COMPLETED: Daily objective has already been fulfilled for today.",
        };
      }
      return { eligible: true };

    case "WEEKLY":
      if (isSameCalendarWeek(lastDate, now)) {
        return {
          eligible: false,
          reason: "MISSION ALREADY COMPLETED: Weekly objective has already been fulfilled for this week.",
        };
      }
      return { eligible: true };

    default:
      return { eligible: true };
  }
}

/**
 * Evaluates the full progression payload when a mission is completed.
 * Pure deterministic calculation.
 */
export function processProgressionMath(
  character: DbCharacter,
  mission: DbMission
): {
  rewards: RewardBreakdown;
  updatedStats: {
    xp: number;
    credits: number;
    level: number;
    mind: number;
    body: number;
    focus: number;
    spirit: number;
    connection: number;
  };
  levelUp: LevelUpCheck;
} {
  // 1. Calculate Rewards
  const rewards = calculateMissionReward({
    category: mission.category,
    difficulty: mission.difficulty,
  });

  // 2. Compute new XP & Level
  const previousXP = (character as any).currentXp ?? character.xp ?? 0;
  const newXP = previousXP + rewards.xp;
  const levelUp = checkLevelUp(previousXP, newXP);
  const nextLevelProgression = getLevelFromXP(newXP);

  // 3. Compute new Credits
  const newCredits = (character.credits || 0) + rewards.credits;

  // 4. Compute updated Attributes
  const updatedStats = {
    currentXp: newXP,
    xp: newXP,
    credits: newCredits,
    level: nextLevelProgression.level,
    mind: character.mind + (rewards.attribute === "mind" ? rewards.attributeIncrease : 0),
    body: character.body + (rewards.attribute === "body" ? rewards.attributeIncrease : 0),
    focus: character.focus + (rewards.attribute === "focus" ? rewards.attributeIncrease : 0),
    spirit: character.spirit + (rewards.attribute === "spirit" ? rewards.attributeIncrease : 0),
    connection:
      character.connection + (rewards.attribute === "connection" ? rewards.attributeIncrease : 0),
  };

  return {
    rewards,
    updatedStats,
    levelUp,
  };
}
