// THE OTHER SIDE - Survival Protocol Streak API
// Authoritative server-side telemetry for user streak, active day status, and signal resonance.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * @boundary between #client and #server -- "Streak query endpoint"
 * @handles pii on App.API.Streak -- "Processes authenticated survivor session token"
 * @mitigates App.API.Streak against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.Streak against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates App.API.Streak against #streak-tampering using #server-authoritative-time -- "Server computes streak status"
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user from session
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

    // 2. Resolve user timezone from header or profile
    const timezoneHeader = request.headers.get("x-timezone");
    const userTimezone = timezoneHeader || undefined;

    // 3. Fetch authoritative streak summary
    const summary = await db.findStreakSummary(session.userId, userTimezone);

    return NextResponse.json(
      {
        success: true,
        ...summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Streak Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Dimensional signal interference. Failed to read streak status.",
      },
      { status: 500 }
    );
  }
}
