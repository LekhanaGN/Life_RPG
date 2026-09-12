// THE OTHER SIDE - Centralized Reward System (Phase 4)
// Authoritative reward calculations for mission completion.

import { MissionCategory, MissionDifficulty } from "@/lib/db/client";

export type AttributeKey = "mind" | "body" | "focus" | "spirit" | "connection";

export interface RewardBreakdown {
  xp: number;
  credits: number;
  attribute: AttributeKey;
  attributeLabel: string;
  attributeIncrease: number;
}

// Base rewards by mission difficulty
export const DIFFICULTY_REWARDS: Record<
  MissionDifficulty,
  { xp: number; credits: number; attributeGain: number }
> = {
  EASY: {
    xp: 20,
    credits: 10,
    attributeGain: 1,
  },
  MEDIUM: {
    xp: 40,
    credits: 20,
    attributeGain: 2,
  },
  HARD: {
    xp: 70,
    credits: 35,
    attributeGain: 3,
  },
  EPIC: {
    xp: 120,
    credits: 60,
    attributeGain: 5,
  },
};

// Mission category to Character attribute mapping
export const CATEGORY_ATTRIBUTE_MAP: Record<
  MissionCategory,
  { key: AttributeKey; label: string; icon: string }
> = {
  MIND: { key: "mind", label: "MIND", icon: "🧠" },
  BODY: { key: "body", label: "BODY", icon: "💪" },
  FOCUS: { key: "focus", label: "FOCUS", icon: "🎯" },
  SPIRIT: { key: "spirit", label: "SPIRIT", icon: "✨" },
  CONNECTION: { key: "connection", label: "CONNECTION", icon: "🤝" },
};

/**
 * Pure function: Calculate reward values for a completed mission.
 * Server is the sole authority for this calculation.
 */
export function calculateMissionReward(mission: {
  category: string;
  difficulty: string;
}): RewardBreakdown {
  const normalizedDifficulty = (
    mission.difficulty?.toUpperCase() || "EASY"
  ) as MissionDifficulty;
  const normalizedCategory = (
    mission.category?.toUpperCase() || "MIND"
  ) as MissionCategory;

  const baseReward =
    DIFFICULTY_REWARDS[normalizedDifficulty] || DIFFICULTY_REWARDS.EASY;
  const attrMapping =
    CATEGORY_ATTRIBUTE_MAP[normalizedCategory] || CATEGORY_ATTRIBUTE_MAP.MIND;

  return {
    xp: baseReward.xp,
    credits: baseReward.credits,
    attribute: attrMapping.key,
    attributeLabel: attrMapping.label,
    attributeIncrease: baseReward.attributeGain,
  };
}
