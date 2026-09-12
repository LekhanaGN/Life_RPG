// THE OTHER SIDE - Comeback Protocol API
// Authoritative status and activation of Comeback Recovery Challenges.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  COMEBACK_CONFIG,
  getComebackTimeRemainingMs,
  formatTimeRemaining,
  isComebackExpired,
} from "@/lib/game/comeback";

/**
 * @boundary between #client and #server (#api-boundary) -- "Comeback challenge endpoint"
 * @handles pii on App.API.Comeback -- "Processes authenticated survivor session token"
 * @mitigates App.API.Comeback against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.Comeback against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates App.API.Comeback against #comeback-spoofing using #prepared-queries -- "Server checks qualification"
 */

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transmission denied. Unauthenticated or expired session.",
        },
        { status: 401 }
      );
    }

    const challenge = await db.findActiveComebackChallenge(session.userId);

    if (!challenge) {
      return NextResponse.json(
        {
          success: true,
          hasActiveChallenge: false,
          challenge: null,
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const timeRemainingMs = getComebackTimeRemainingMs(challenge.expiresAt, now);
    const expired = isComebackExpired(challenge.expiresAt, now);

    return NextResponse.json(
      {
        success: true,
        hasActiveChallenge: !expired && !challenge.completed,
        challenge: {
          id: challenge.id,
          startedAt: challenge.startedAt,
          expiresAt: challenge.expiresAt,
          missionsRequired: challenge.missionsRequired,
          missionsCompleted: challenge.missionsCompleted,
          completed: challenge.completed,
          rewardClaimed: challenge.rewardClaimed,
          rewardCredits: COMEBACK_CONFIG.rewardCredits,
          corruptionReduction: COMEBACK_CONFIG.corruptionReduction,
          timeRemainingMs,
          formattedTimeRemaining: formatTimeRemaining(timeRemainingMs),
          isExpired: expired,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Comeback Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read Comeback Protocol status.",
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transmission denied. Unauthenticated or expired session.",
        },
        { status: 401 }
      );
    }

    const existing = await db.findActiveComebackChallenge(session.userId);
    if (existing && !isComebackExpired(existing.expiresAt, new Date()) && !existing.completed) {
      return NextResponse.json(
        {
          success: false,
          error: "A Comeback Protocol challenge is already active.",
        },
        { status: 400 }
      );
    }

    const challenge = await db.startComebackChallenge(session.userId);
    const timeRemainingMs = getComebackTimeRemainingMs(challenge.expiresAt, new Date());

    return NextResponse.json(
      {
        success: true,
        challenge: {
          id: challenge.id,
          startedAt: challenge.startedAt,
          expiresAt: challenge.expiresAt,
          missionsRequired: challenge.missionsRequired,
          missionsCompleted: challenge.missionsCompleted,
          completed: challenge.completed,
          rewardClaimed: challenge.rewardClaimed,
          rewardCredits: COMEBACK_CONFIG.rewardCredits,
          corruptionReduction: COMEBACK_CONFIG.corruptionReduction,
          timeRemainingMs,
          formattedTimeRemaining: formatTimeRemaining(timeRemainingMs),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API Comeback Start Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate Comeback Protocol.",
      },
      { status: 500 }
    );
  }
}
