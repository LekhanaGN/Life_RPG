import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/focus/[id]/heartbeat
 * Periodic telemetry ping verifying active session continuity.
 *
 * @boundary between #client and #server -- "Heartbeat telemetry endpoint"
 * @handles internal on API.Focus.Heartbeat -- "Processes periodic heartbeat signal and updates elapsed active duration"
 * @mitigates API.Focus.Heartbeat against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Focus.Heartbeat against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates API.Focus.Heartbeat against #heartbeat-replay using #server-timed-heartbeat -- "Authoritative delta computation and clamping"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Transmission denied. Session expired or unauthenticated." },
        { status: 401 }
      );
    }

    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Focus session identifier required." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const clientState = body?.state === "IDLE" ? "IDLE" : "ACTIVE";

    // Record heartbeat on server
    const result = await db.recordFocusHeartbeat(sessionId, session.userId, clientState);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Heartbeat rejected." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: result.session,
        signalIntegrity: result.signalIntegrity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Focus Heartbeat Error]:", error);
    return NextResponse.json(
      { success: false, error: "Transmission error during heartbeat evaluation." },
      { status: 500 }
    );
  }
}
