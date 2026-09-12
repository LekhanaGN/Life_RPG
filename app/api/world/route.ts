import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * GET /api/world
 * Retrieve the current authenticated player's world corruption, area states, active boss, and character status.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to dimensional telemetry." },
        { status: 401 }
      );
    }

    const [worldState, character] = await Promise.all([
      db.findWorldStateByUserId(session.userId),
      db.findCharacterByUserId(session.userId),
    ]);

    if (!character) {
      return NextResponse.json(
        { success: false, error: "Survivor character not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        corruption: worldState.corruption,
        integrityPercent: worldState.integrityPercent,
        areas: worldState.areas,
        activeBoss: worldState.activeBoss,
        allBosses: worldState.allBosses,
        character,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API World Error]:", error);
    return NextResponse.json(
      { success: false, error: "Dimensional scan failed." },
      { status: 500 }
    );
  }
}
