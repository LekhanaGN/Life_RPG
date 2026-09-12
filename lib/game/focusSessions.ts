// THE OTHER SIDE - Focus Session Engine (Phase 9)
// Server-authoritative timing, heartbeat math, and state transition rules.

import { FocusSessionStatus } from "./verification";

export interface FocusSessionConstants {
  MIN_HEARTBEAT_INTERVAL_SECONDS: number;
  MAX_HEARTBEAT_INTERVAL_SECONDS: number;
  MAX_DELTA_SECONDS_PER_HEARTBEAT: number;
  SESSION_EXPIRATION_TIMEOUT_SECONDS: number;
  IDLE_GRACE_PERIOD_SECONDS: number;
  DEFAULT_REQUIRED_DURATION_MINUTES: number;
}

export const FOCUS_CONSTANTS: FocusSessionConstants = {
  MIN_HEARTBEAT_INTERVAL_SECONDS: 10,
  MAX_HEARTBEAT_INTERVAL_SECONDS: 45,
  MAX_DELTA_SECONDS_PER_HEARTBEAT: 45, // Clamps time advancement per heartbeat to prevent forward-jumping
  SESSION_EXPIRATION_TIMEOUT_SECONDS: 600, // 10 minutes of silence -> expired
  IDLE_GRACE_PERIOD_SECONDS: 120, // 2 minutes grace before penalizing signal
  DEFAULT_REQUIRED_DURATION_MINUTES: 25,
};

export interface HeartbeatEvaluationInput {
  lastHeartbeatAt: Date;
  now: Date;
  clientReportedState: "ACTIVE" | "IDLE";
  currentActiveSeconds: number;
  currentIdleSeconds: number;
  requiredDurationSeconds: number;
  sessionStatus: FocusSessionStatus;
}

export interface HeartbeatEvaluationResult {
  deltaSeconds: number;
  newActiveSeconds: number;
  newIdleSeconds: number;
  isEligibleForCompletion: boolean;
  status: FocusSessionStatus;
  signalIntegrity: number;
  isExpired: boolean;
}

/**
 * Server-authoritative heartbeat advancement calculation.
 * Client does not submit active seconds. The server calculates delta between timestamps.
 */
export function evaluateHeartbeat(
  input: HeartbeatEvaluationInput
): HeartbeatEvaluationResult {
  const {
    lastHeartbeatAt,
    now,
    clientReportedState,
    currentActiveSeconds,
    currentIdleSeconds,
    requiredDurationSeconds,
    sessionStatus,
  } = input;

  // If session is not ACTIVE, do not accumulate active seconds
  if (sessionStatus !== "ACTIVE") {
    return {
      deltaSeconds: 0,
      newActiveSeconds: currentActiveSeconds,
      newIdleSeconds: currentIdleSeconds,
      isEligibleForCompletion: currentActiveSeconds >= requiredDurationSeconds,
      status: sessionStatus,
      signalIntegrity: 85,
      isExpired: false,
    };
  }

  // Calculate true elapsed time on server
  const rawElapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000)
  );

  // Check expiration (prolonged silence)
  if (rawElapsedSeconds > FOCUS_CONSTANTS.SESSION_EXPIRATION_TIMEOUT_SECONDS) {
    return {
      deltaSeconds: 0,
      newActiveSeconds: currentActiveSeconds,
      newIdleSeconds: currentIdleSeconds,
      isEligibleForCompletion: false,
      status: "EXPIRED",
      signalIntegrity: 50,
      isExpired: true,
    };
  }

  // Clamp delta to prevent time-travel spoofing
  const clampedDelta = Math.min(
    rawElapsedSeconds,
    FOCUS_CONSTANTS.MAX_DELTA_SECONDS_PER_HEARTBEAT
  );

  let newActive = currentActiveSeconds;
  let newIdle = currentIdleSeconds;

  if (clientReportedState === "ACTIVE") {
    newActive += clampedDelta;
  } else {
    newIdle += clampedDelta;
  }

  const isEligible = newActive >= requiredDurationSeconds;

  // Calculate integrity score (85-95%)
  const total = newActive + newIdle;
  const ratio = total > 0 ? newActive / total : 1;
  const signalIntegrity = Math.min(95, Math.max(80, Math.round(85 + ratio * 10)));

  return {
    deltaSeconds: clampedDelta,
    newActiveSeconds: newActive,
    newIdleSeconds: newIdle,
    isEligibleForCompletion: isEligible,
    status: "ACTIVE",
    signalIntegrity,
    isExpired: false,
  };
}

/**
 * Validates whether a focus session can be authoritatively marked COMPLETED
 */
export function validateSessionCompletion(
  accumulatedActiveSeconds: number,
  requiredDurationSeconds: number,
  status: FocusSessionStatus
): { eligible: boolean; reason?: string } {
  if (status === "COMPLETED") {
    return { eligible: true };
  }
  if (status === "CANCELLED") {
    return { eligible: false, reason: "Focus session was cancelled by survivor." };
  }
  if (status === "EXPIRED") {
    return { eligible: false, reason: "Focus session expired due to signal loss." };
  }
  if (accumulatedActiveSeconds < requiredDurationSeconds) {
    const remaining = requiredDurationSeconds - accumulatedActiveSeconds;
    return {
      eligible: false,
      reason: `Required focus duration not reached. ${Math.ceil(remaining / 60)} minutes remaining.`,
    };
  }
  return { eligible: true };
}
