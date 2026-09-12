// THE OTHER SIDE - Active World Events API (Phase 8)
// Authoritative endpoint returning current active anomaly, progress, timer, and visual telemetry.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getWorldEventDefinition } from "@/lib/game/worldEvents";

/**
 * @boundary between #client and #server (#world-events-api-boundary) -- "World events endpoint"
 * @handles pii on App.API.WorldEvents -- "Processes authenticated survivor session token"
 * @mitigates App.API.WorldEvents against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.WorldEvents against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates App.API.WorldEvents against #event-tampering using #authoritative-event-engine -- "Server computes event eligibility"
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

    // Retrieve active event or auto-generate if eligible
    let activeEvent = await db.findActiveUserWorldEvent(session.userId);

    if (!activeEvent) {
      activeEvent = await db.ensureUserWorldEvent(session.userId);
    }

    if (!activeEvent) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveEvent: false,
          event: null,
        },
      });
    }

    const template = getWorldEventDefinition(activeEvent.worldEvent?.key || "SIGNAL_SURGE");
    const now = new Date();
    const expiresAtDate = new Date(activeEvent.expiresAt);
    const timeRemainingMs = Math.max(0, expiresAtDate.getTime() - now.getTime());

    const totalSeconds = Math.floor(timeRemainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formattedTimeRemaining = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return NextResponse.json({
      success: true,
      data: {
        hasActiveEvent: true,
        event: {
          id: activeEvent.id,
          key: template.key,
          title: template.title,
          description: template.description,
          loreSnippet: template.loreSnippet,
          targetAttribute: template.targetAttribute,
          targetArea: template.targetArea,
          progress: activeEvent.progress,
          requiredProgress: activeEvent.requiredProgress,
          completed: activeEvent.completed,
          rewardClaimed: activeEvent.rewardClaimed,
          status: activeEvent.status,
          startsAt: activeEvent.startsAt,
          expiresAt: activeEvent.expiresAt,
          timeRemainingMs,
          formattedTimeRemaining,
          rewards: {
            credits: template.rewardCredits,
            xp: template.rewardXp,
            corruptionReduction: Math.abs(template.corruptionChange),
            bossDamage: template.bossDamageBonus,
            rarity: template.rarity,
          },
          visualEffect: template.visualEffect,
        },
      },
    });
  } catch (error) {
    console.error("Failed to retrieve active world event:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve active anomaly telemetry.",
      },
      { status: 500 }
    );
  }
}
