// THE OTHER SIDE - Non-Linear Level Progression Engine (Phase 4)
// Mathematical formula: XP required for level N span = floor(100 * N^1.5)

export interface LevelProgression {
  level: number;
  totalXP: number;
  currentLevelXP: number; // XP earned within the current level
  nextLevelXP: number;    // XP required to reach the next level
  progressPercent: number;// Percentage (0-100) towards next level
}

export interface LevelUpCheck {
  levelUp: boolean;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
}

/**
 * Returns the incremental XP required to advance from `level` to `level + 1`.
 * Formula: floor(100 * level^1.5)
 */
export function getXPForLevelSpan(level: number): number {
  if (level < 1) return 100;
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Returns the total cumulative XP required to reach `level` from level 1.
 * Level 1 requires 0 total XP.
 * Level 2 requires getXPForLevelSpan(1) = 100.
 * Level 3 requires getXPForLevelSpan(1) + getXPForLevelSpan(2) = 100 + 282 = 382.
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  let cumulative = 0;
  for (let i = 1; i < level; i++) {
    cumulative += getXPForLevelSpan(i);
  }
  return cumulative;
}

/**
 * Derives current level and level-relative progression from total accumulated XP.
 */
export function getLevelFromXP(totalXP: number): LevelProgression {
  const safeXP = Math.max(0, Math.floor(totalXP || 0));

  let currentLevel = 1;
  let cumulativeXP = 0;

  while (true) {
    const span = getXPForLevelSpan(currentLevel);
    if (safeXP < cumulativeXP + span) {
      const currentLevelXP = safeXP - cumulativeXP;
      const nextLevelXP = span;
      const progressPercent = Math.min(
        100,
        Math.max(0, Math.round((currentLevelXP / nextLevelXP) * 100))
      );

      return {
        level: currentLevel,
        totalXP: safeXP,
        currentLevelXP,
        nextLevelXP,
        progressPercent,
      };
    }

    cumulativeXP += span;
    currentLevel++;
  }
}

/**
 * Compares two total XP values to determine whether one or more level-ups occurred.
 */
export function checkLevelUp(previousXP: number, newXP: number): LevelUpCheck {
  const prev = getLevelFromXP(previousXP);
  const next = getLevelFromXP(newXP);

  const levelUp = next.level > prev.level;
  const levelsGained = Math.max(0, next.level - prev.level);

  return {
    levelUp,
    previousLevel: prev.level,
    newLevel: next.level,
    levelsGained,
  };
}
