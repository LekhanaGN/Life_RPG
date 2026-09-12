// THE OTHER SIDE - Survival Protocol Milestones & Streak Rewards Catalog
// Centralized milestone rules, lore narratives, and credit/XP rewards.

/**
 * @mitigates App.StreakRewards against #duplicate-reward-exploit using #prepared-queries -- "Enforces single claim per milestone key"
 */

export interface MilestoneDefinition {
  key: string;
  name: string;
  description: string;
  loreQuote: string;
  requirementType: "STREAK" | "ACTIVE_DAYS";
  requirementValue: number;
  rewardCredits: number;
  rewardXP: number;
  icon: string;
}

export const SURVIVAL_MILESTONES: MilestoneDefinition[] = [
  {
    key: "FIRST_SIGNAL",
    name: "FIRST SIGNAL",
    description: "Survived your first day on the Right Side.",
    loreQuote: "A faint heartbeat cuts through the dimensional noise.",
    requirementType: "ACTIVE_DAYS",
    requirementValue: 1,
    rewardCredits: 10,
    rewardXP: 15,
    icon: "Radio",
  },
  {
    key: "THE_SIGNAL_RETURNS",
    name: "THE SIGNAL RETURNS",
    description: "Maintained a 3-day survival streak.",
    loreQuote: "The frequencies stabilize. The Other Side takes notice.",
    requirementType: "STREAK",
    requirementValue: 3,
    rewardCredits: 25,
    rewardXP: 25,
    icon: "Sparkles",
  },
  {
    key: "HOLD_THE_LINE",
    name: "HOLD THE LINE",
    description: "Maintained a 7-day survival streak.",
    loreQuote: "One full cycle held against the decay. Resonance shields active.",
    requirementType: "STREAK",
    requirementValue: 7,
    rewardCredits: 75,
    rewardXP: 50,
    icon: "ShieldAlert",
  },
  {
    key: "NO_TURNING_BACK",
    name: "NO TURNING BACK",
    description: "Maintained a 14-day survival streak.",
    loreQuote: "Two unbroken weeks. The Other Side is losing ground.",
    requirementType: "STREAK",
    requirementValue: 14,
    rewardCredits: 150,
    rewardXP: 100,
    icon: "Flame",
  },
  {
    key: "FORTIFIED",
    name: "FORTIFIED",
    description: "Maintained a 30-day survival streak.",
    loreQuote: "A month in the dark, and you shine brighter than the void.",
    requirementType: "STREAK",
    requirementValue: 30,
    rewardCredits: 300,
    rewardXP: 200,
    icon: "Zap",
  },
  {
    key: "UNBREAKABLE",
    name: "UNBREAKABLE",
    description: "Maintained a 60-day survival streak.",
    loreQuote: "Sixty rotations. Even the dark void recognizes your existence.",
    requirementType: "STREAK",
    requirementValue: 60,
    rewardCredits: 500,
    rewardXP: 300,
    icon: "Activity",
  },
  {
    key: "BEYOND_THE_GATE",
    name: "BEYOND THE GATE",
    description: "Maintained a 100-day survival streak.",
    loreQuote: "The Other Side remembers you. You are no longer surviving; you are reclaiming.",
    requirementType: "STREAK",
    requirementValue: 100,
    rewardCredits: 1000,
    rewardXP: 500,
    icon: "Compass",
  },
];

/**
 * Retrieve milestone definition by unique key.
 */
export function getMilestoneDefinition(key: string): MilestoneDefinition | undefined {
  return SURVIVAL_MILESTONES.find((m) => m.key === key);
}

/**
 * Check which milestones are newly unlocked given current streak and total active days.
 */
export function checkMilestones(
  currentStreak: number,
  totalActiveDays: number,
  alreadyUnlockedKeys: Set<string>
): MilestoneDefinition[] {
  const newlyUnlocked: MilestoneDefinition[] = [];

  for (const milestone of SURVIVAL_MILESTONES) {
    if (alreadyUnlockedKeys.has(milestone.key)) {
      continue;
    }

    if (
      milestone.requirementType === "STREAK" &&
      currentStreak >= milestone.requirementValue
    ) {
      newlyUnlocked.push(milestone);
    } else if (
      milestone.requirementType === "ACTIVE_DAYS" &&
      totalActiveDays >= milestone.requirementValue
    ) {
      newlyUnlocked.push(milestone);
    }
  }

  return newlyUnlocked;
}

/**
 * Determine the next upcoming streak milestone and days remaining.
 */
export function getNextMilestone(currentStreak: number): {
  milestone: MilestoneDefinition;
  remainingDays: number;
} | null {
  const streakMilestones = SURVIVAL_MILESTONES.filter(
    (m) => m.requirementType === "STREAK" && m.requirementValue > currentStreak
  ).sort((a, b) => a.requirementValue - b.requirementValue);

  if (streakMilestones.length === 0) return null;

  const next = streakMilestones[0];
  return {
    milestone: next,
    remainingDays: next.requirementValue - currentStreak,
  };
}
