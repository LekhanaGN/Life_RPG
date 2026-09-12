import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getBossDefinition } from "@/lib/game/bosses";

/**
 * GET /api/bosses/active
 * Returns the current active boss entity for the authenticated survivor.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to active threat telemetry." },
        { status: 401 }
      );
    }

    const activeBossProgress = await db.findActiveBossByUserId(session.userId);
    const bossDef = getBossDefinition(activeBossProgress.bossKey);

    const activeBoss = {
      ...bossDef,
      currentHp: activeBossProgress.currentHp,
      maxHp: activeBossProgress.maxHp,
      isDefeated: activeBossProgress.isDefeated,
      defeatedAt: activeBossProgress.defeatedAt,
      hpPercent:
        activeBossProgress.maxHp > 0
          ? Math.round((activeBossProgress.currentHp / activeBossProgress.maxHp) * 100)
          : 0,
    };

    return NextResponse.json({ success: true, activeBoss }, { status: 200 });
  } catch (error) {
    console.error("[API Active Boss Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to scan active dimensional anomaly." },
      { status: 500 }
    );
  }
}
