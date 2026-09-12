// THE OTHER SIDE - Comeback Protocol Engine
// Lightweight, server-authoritative recovery mechanic when a survival streak is broken.

/**
 * @asset #comeback-challenge -- "Active comeback recovery challenges and countdown timers"
 * @threat #comeback-spoofing -- "Direct modification of comeback challenge progress or completion status"
 * @mitigates App.Comeback against #comeback-spoofing using #prepared-queries -- "Server increments mission counts"
 * @comment -- "24-hour window, 3 completed missions grant +50 credits and -5 corruption"
 */

export const COMEBACK_CONFIG = {
  durationHours: 24,
  durationMs: 24 * 60 * 60 * 1000,
  missionsRequired: 3,
  rewardCredits: 50,
  corruptionReduction: 5,
};

export interface ComebackStatusSummary {
  hasActiveChallenge: boolean;
  isEligibleForNew: boolean;
  challenge: {
    id: string;
    startedAt: Date;
    expiresAt: Date;
    missionsRequired: number;
    missionsCompleted: number;
    completed: boolean;
    rewardClaimed: boolean;
    timeRemainingMs: number;
    isExpired: boolean;
  } | null;
}

/**
 * Check if a comeback challenge is currently expired based on current timestamp.
 */
export function isComebackExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() > new Date(expiresAt).getTime();
}

/**
 * Calculate remaining milliseconds for an active challenge.
 */
export function getComebackTimeRemainingMs(expiresAt: Date, now: Date = new Date()): number {
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime());
}

/**
 * Format remaining milliseconds as HH:MM:SS for HUD displays.
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
