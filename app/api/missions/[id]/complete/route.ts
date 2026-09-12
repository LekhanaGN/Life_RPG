import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/missions/[id]/complete
 * Complete a mission and trigger authoritative server-side character progression.
 *
 * @boundary between #client and #server (#api-boundary) -- "Mission complete endpoint"
 * @handles pii on App.API.MissionComplete -- "Processes authenticated survivor session token"
 * @mitigates App.API.MissionComplete against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.MissionComplete against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates App.API.MissionComplete against #streak-tampering using #server-authoritative-time -- "Authoritative streak math"
 * @mitigates App.API.MissionComplete against #duplicate-reward-exploit using #atomic-streak-transaction -- "Synchronous atomic mutation"
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

    // 2. Resolve parameters & optional timezone header
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

    const timezone = request.headers.get("x-timezone") || undefined;

    // 3. Execute atomic progression, streak, and milestone transaction
    const result = await db.completeMissionTransaction(
      session.userId,
      missionId,
      timezone
    );

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
