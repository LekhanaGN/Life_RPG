// THE OTHER SIDE - Survival Protocol Streak Engine
// Authoritative server-side calculation for daily streaks, logical timezone dates, and signal stability.

/**
 * @boundary between #client and #server (#time-boundary) -- "Timezone and logical date resolution"
 * @handles pii on App.Streaks -- "Processes user timezone preference"
 * @mitigates App.Streaks against #streak-tampering using #server-authoritative-time -- "Server dictates streak increments"
 * @mitigates App.Streaks against #duplicate-reward-exploit using #prepared-queries -- "Enforces one streak increment per calendar day"
 * @comment -- "Uses Intl.DateTimeFormat with IANA timezones to prevent UTC mismatch around midnight"
 */

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  streakAdvanced: boolean;
  streakBroken: boolean;
  previousStreak: number;
  isFirstDay: boolean;
}

export interface SignalStatus {
  status: "SIGNAL UNCONFIRMED" | "SIGNAL WEAK" | "SIGNAL RETURNING" | "SIGNAL STABLE" | "SIGNAL FORTIFIED" | "UNBREAKABLE HARMONY";
  strengthPercent: number;
  tier: "DORMANT" | "WEAK" | "RECOVERING" | "STABLE" | "FORTIFIED" | "MAXIMUM";
  description: string;
  accentColor: string;
}

/**
 * Convert a Date object into a consistent YYYY-MM-DD string in the specified timezone.
 * Falls back to UTC if the timezone is invalid or unspecified.
 */
export function getLogicalDate(date: Date = new Date(), timeZone: string = "UTC"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch (err) {
    // If invalid IANA timezone string passed, gracefully fallback to UTC
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(date);
  }
}

/**
 * Check if two logical date strings (YYYY-MM-DD) represent the exact same calendar day.
 */
export function isSameDay(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}

/**
 * Check if dateA is exactly one calendar day before dateB.
 * Both dates must be in YYYY-MM-DD format.
 */
export function isYesterday(lastActiveDateStr: string, todayStr: string): boolean {
  if (!lastActiveDateStr || !todayStr) return false;
  if (lastActiveDateStr === todayStr) return false;

  const [y1, m1, d1] = lastActiveDateStr.split("-").map(Number);
  const [y2, m2, d2] = todayStr.split("-").map(Number);

  const dA = new Date(Date.UTC(y1, m1 - 1, d1));
  const dB = new Date(Date.UTC(y2, m2 - 1, d2));

  const diffMs = dB.getTime() - dA.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays === 1;
}

/**
 * Check if the difference between two dates is strictly greater than 1 day (streak lost).
 */
export function isDayMissed(lastActiveDateStr: string, todayStr: string): boolean {
  if (!lastActiveDateStr || !todayStr) return false;
  if (lastActiveDateStr === todayStr) return false;

  const [y1, m1, d1] = lastActiveDateStr.split("-").map(Number);
  const [y2, m2, d2] = todayStr.split("-").map(Number);

  const dA = new Date(Date.UTC(y1, m1 - 1, d1));
  const dB = new Date(Date.UTC(y2, m2 - 1, d2));

  const diffMs = dB.getTime() - dA.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 1;
}

/**
 * Pure, deterministic calculation of streak updates on mission completion.
 *
 * Rules:
 * 1. If no previous activity:
 *    currentStreak = 1
 * 2. If lastActiveDate is today:
 *    streak does not increase again (same-day completion idempotent)
 * 3. If lastActiveDate is yesterday:
 *    currentStreak += 1
 * 4. If lastActiveDate was missed (>1 day ago):
 *    currentStreak resets to 1, streakBroken = true
 * 5. longestStreak = Math.max(longestStreak, currentStreak)
 * 6. totalActiveDays += 1 (only if not already active today)
 */
export function calculateStreakUpdate(params: {
  lastActiveDateStr: string | null;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  todayStr: string;
}): StreakCalculationResult {
  const { lastActiveDateStr, currentStreak, longestStreak, totalActiveDays, todayStr } = params;

  // Case 1: First time ever active
  if (!lastActiveDateStr) {
    const newStreak = 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      totalActiveDays: totalActiveDays + 1,
      streakAdvanced: true,
      streakBroken: false,
      previousStreak: 0,
      isFirstDay: true,
    };
  }

  // Case 2: Already active today (e.g. 2nd or 3rd mission on Monday)
  if (isSameDay(lastActiveDateStr, todayStr)) {
    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      streakAdvanced: false,
      streakBroken: false,
      previousStreak: currentStreak,
      isFirstDay: false,
    };
  }

  // Case 3: Consecutive day (yesterday)
  if (isYesterday(lastActiveDateStr, todayStr)) {
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      totalActiveDays: totalActiveDays + 1,
      streakAdvanced: true,
      streakBroken: false,
      previousStreak: currentStreak,
      isFirstDay: false,
    };
  }

  // Case 4: Missed one or more days (broken streak)
  const newStreak = 1;
  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    totalActiveDays: totalActiveDays + 1,
    streakAdvanced: true,
    streakBroken: currentStreak > 0,
    previousStreak: currentStreak,
    isFirstDay: false,
  };
}

/**
 * Derive Signal Status HUD indicators from current streak and activity state.
 */
export function getSignalStrength(streak: number, todayActive: boolean): SignalStatus {
  if (!todayActive && streak === 0) {
    return {
      status: "SIGNAL UNCONFIRMED",
      strengthPercent: 10,
      tier: "DORMANT",
      description: "Complete a mission today to start your streak.",
      accentColor: "#ef4444", // Red
    };
  }

  if (streak >= 30) {
    return {
      status: "UNBREAKABLE HARMONY",
      strengthPercent: 100,
      tier: "MAXIMUM",
      description: "30+ day streak! Your daily consistency keeps the world safe.",
      accentColor: "#10b981", // Emerald
    };
  }

  if (streak >= 14) {
    return {
      status: "SIGNAL FORTIFIED",
      strengthPercent: 85,
      tier: "FORTIFIED",
      description: "14+ day streak! The Other Side is losing ground.",
      accentColor: "#06b6d4", // Cyan
    };
  }

  if (streak >= 7) {
    return {
      status: "SIGNAL STABLE",
      strengthPercent: 70,
      tier: "STABLE",
      description: "7-day streak! You are maintaining strong daily habits.",
      accentColor: "#38bdf8", // Sky blue
    };
  }

  if (streak >= 3) {
    return {
      status: "SIGNAL RETURNING",
      strengthPercent: 45,
      tier: "RECOVERING",
      description: "3-day streak! Great momentum.",
      accentColor: "#f59e0b", // Amber
    };
  }

  return {
    status: "SIGNAL WEAK",
    strengthPercent: 25,
    tier: "WEAK",
    description: "Complete a mission every day to keep your streak.",
    accentColor: "#eab308", // Yellow
  };
}
