import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * GET /api/leaderboard
 * Fetch public real-time server-authoritative leaderboard rankings and user position.
 *
 * @boundary between #client and #server -- "Public leaderboard query API"
 * @handles character_data on App.API.Leaderboard -- "Returns public ranking and character progression projections"
 * @mitigates App.API.Leaderboard against #unauthorized-access using #prepared-queries -- "Safe public projection, no PII or password exposed"
 * @mitigates App.API.Leaderboard against #data-tampering using #prepared-queries -- "Read-only server sorted leaderboard"
 * @flows Client -> App.API.Leaderboard via HTTPS -- "Public leaderboard transmission"
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const limit = Number.isNaN(limitParam) ? 100 : Math.max(1, Math.min(100, limitParam));

    const leaderboardData = await db.getLeaderboard({
      currentUserId: session?.userId,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: leaderboardData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("[API Leaderboard Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve leaderboard rankings.",
      },
      { status: 500 }
    );
  }
}
