import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/missions/[id]/complete
 * Complete a mission and trigger authoritative server-side character progression.
 *
 * The client only sends the mission ID.
 * The server computes:
 * - XP rewards
 * - Credit rewards
 * - Attribute training gains
 * - Level advancement & level-up triggers
 * - Atomic persistence of MissionCompletion + Character stats
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user from session
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Transmission denied. Session expired or unauthenticated.",
        },
        { status: 401 }
      );
    }

    // 2. Resolve parameters
    const { id: missionId } = await params;
    if (!missionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Mission identifier required.",
        },
        { status: 400 }
      );
    }

    // 3. Execute atomic progression transaction
    const result = await db.completeMissionTransaction(session.userId, missionId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Mission completion rejected.",
        },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[API Mission Complete Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "The Other Side resisted your action. Unexpected dimensional anomaly.",
      },
      { status: 500 }
    );
  }
}
