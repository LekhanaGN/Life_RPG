// THE OTHER SIDE - Signal Integrity & Task Verification Engine (Phase 9)
// Centralized definitions, signal integrity formulas, and privacy disclosures.

export type VerificationType = "SELF_REPORT" | "EVIDENCE" | "FOCUS_SESSION";
export type EvidenceType = "IMAGE" | "TEXT";
export type FocusSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export interface VerificationMeta {
  type: VerificationType;
  name: string;
  shortName: string;
  stars: number;
  ratingStars: string;
  baseIntegrity: number;
  requiresEvidence: boolean;
  requiresFocusSession: boolean;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowClass: string;
  description: string;
  terminalStatus: string;
  feedbackQuote: string;
}

export const VERIFICATION_CONFIG: Record<VerificationType, VerificationMeta> = {
  SELF_REPORT: {
    type: "SELF_REPORT",
    name: "SELF CONFIRMED",
    shortName: "Self Report",
    stars: 1,
    ratingStars: "★",
    baseIntegrity: 50,
    requiresEvidence: false,
    requiresFocusSession: false,
    badgeBg: "bg-slate-900/60",
    badgeBorder: "border-slate-700/60",
    badgeText: "text-slate-300",
    glowClass: "",
    description: "Survivor reports completion directly. Standard telemetry signal.",
    terminalStatus: "SELF CONFIRMED",
    feedbackQuote: "The survivor logged completion through manual confirmation.",
  },
  EVIDENCE: {
    type: "EVIDENCE",
    name: "EVIDENCE REQUIRED",
    shortName: "Evidence",
    stars: 2,
    ratingStars: "★★",
    baseIntegrity: 70,
    requiresEvidence: true,
    requiresFocusSession: false,
    badgeBg: "bg-emerald-950/40",
    badgeBorder: "border-emerald-600/50",
    badgeText: "text-emerald-300",
    glowClass: "shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    description: "Requires supporting image upload or field note before mission clearance.",
    terminalStatus: "EVIDENCE RECEIVED",
    feedbackQuote: "The signal has something tangible to work with.",
  },
  FOCUS_SESSION: {
    type: "FOCUS_SESSION",
    name: "FOCUS VERIFIED",
    shortName: "Focus Protocol",
    stars: 3,
    ratingStars: "★★★",
    baseIntegrity: 91,
    requiresEvidence: false,
    requiresFocusSession: true,
    badgeBg: "bg-amber-950/40",
    badgeBorder: "border-amber-500/50",
    badgeText: "text-amber-300",
    glowClass: "shadow-[0_0_14px_rgba(251,191,36,0.3)]",
    description: "Timed protocol requiring server-monitored focus and valid active duration.",
    terminalStatus: "SESSION VERIFIED",
    feedbackQuote: "The signal remained stable across the dimensional barrier.",
  },
};

/**
 * Authoritative calculation for verification Signal Integrity confidence percentage.
 * Does NOT pretend to prove real-world reality; represents game verification confidence.
 */
export function calculateSignalIntegrity(
  type: VerificationType,
  accumulatedActiveSeconds = 0,
  idleSeconds = 0
): number {
  if (type === "SELF_REPORT") {
    return 50;
  }
  if (type === "EVIDENCE") {
    return 70;
  }
  if (type === "FOCUS_SESSION") {
    const total = accumulatedActiveSeconds + idleSeconds;
    if (total <= 0) return 85;
    const ratio = Math.min(1, Math.max(0, accumulatedActiveSeconds / total));
    // Scales between 85% and 95% depending on active ratio
    const score = Math.round(85 + ratio * 10);
    return Math.min(95, Math.max(80, score));
  }
  return 50;
}

/**
 * Formatted Signal Integrity representation with bar and percentage
 */
export function formatSignalIntegrityDisplay(score: number): {
  percentageText: string;
  blocks: string;
  ratio: number;
} {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const totalBlocks = 10;
  const filledBlocks = Math.round((clamped / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const blocks = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  return {
    percentageText: `${clamped}%`,
    blocks,
    ratio: clamped / 100,
  };
}

/**
 * Universal Privacy Statement for the Focus Protocol.
 * Displayed before and during focus sessions.
 */
export const FOCUS_PRIVACY_DISCLOSURE = {
  title: "SIGNAL INTEGRITY PROTOCOL — PRIVACY GUARANTEE",
  statement:
    "The signal monitors session duration and lightweight browser activity signals only.",
  prohibitions: [
    "No audio or microphone recording",
    "No camera or facial surveillance",
    "No screen recording or screenshot capture",
    "No keystroke monitoring or input logging",
    "No hidden background telemetry",
  ],
  purpose: "Designed purely as a real-world anti-cheat signal, not human surveillance.",
};
