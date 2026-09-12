// THE OTHER SIDE - Signal Archive & Event History API (Phase 8)
// Authoritative endpoint returning past event entries and recovered lore logs.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getWorldEventDefinition } from "@/lib/game/worldEvents";

/**
 * @boundary between #client and #server (#world-events-history-api-boundary) -- "World event history endpoint"
 * @handles pii on App.API.WorldEventHistory -- "Processes authenticated survivor session token"
 * @mitigates App.API.WorldEventHistory against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.WorldEventHistory against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
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

    const history = await db.findUserWorldEventHistory(session.userId, 20);
    const loreUnlocks = await db.findUserLoreUnlocks(session.userId);

    const formattedHistory = history.map((h) => {
      const template = getWorldEventDefinition(h.worldEvent?.key || "SIGNAL_SURGE");
      return {
        id: h.id,
        key: template.key,
        title: template.title,
        status: h.status, // COMPLETED or EXPIRED
        statusLabel: h.status === "COMPLETED" ? "CONTAINED" : "FADED",
        progress: h.progress,
        requiredProgress: h.requiredProgress,
        completedAt: h.completedAt,
        expiresAt: h.expiresAt,
        createdAt: h.createdAt,
        rarity: template.rarity,
        rewardCredits: template.rewardCredits,
        rewardXp: template.rewardXp,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        history: formattedHistory,
        loreArchive: loreUnlocks,
      },
    });
  } catch (error) {
    console.error("Failed to retrieve world event archive:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve signal archive.",
      },
      { status: 500 }
    );
  }
}
