import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { BOSS_DEFINITIONS } from "@/lib/game/bosses";

/**
 * GET /api/bosses
 * Returns all boss entities and their defeat progress for current user.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to boss archives." },
        { status: 401 }
      );
    }

    const bossesProgress = await db.findBossesByUserId(session.userId);

    const bosses = BOSS_DEFINITIONS.map((def) => {
      const prog = bossesProgress.find((p) => p.bossKey === def.key);
      const currentHp = prog ? prog.currentHp : def.maxHp;
      const isDefeated = prog ? prog.isDefeated : false;
      const defeatedAt = prog?.defeatedAt || null;

      return {
        ...def,
        currentHp,
        isDefeated,
        defeatedAt,
        hpPercent: def.maxHp > 0 ? Math.round((currentHp / def.maxHp) * 100) : 0,
      };
    });

    return NextResponse.json({ success: true, bosses }, { status: 200 });
  } catch (error) {
    console.error("[API Bosses Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to scan dimensional threats." },
      { status: 500 }
    );
  }
}
