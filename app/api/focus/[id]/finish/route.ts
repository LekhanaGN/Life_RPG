import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/focus/[id]/finish
 * Concludes and authoritatively verifies focus protocol requirements.
 * Note: Does NOT directly grant game rewards; qualifies mission for completion engine.
 *
 * @boundary between #client and #server -- "Focus session finish endpoint"
 * @handles internal on API.Focus.Finish -- "Validates total active duration and marks session COMPLETED"
 * @mitigates API.Focus.Finish against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Focus.Finish against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates API.Focus.Finish against #focus-spoofing using #verification-bypass-blocker -- "Server evaluates required seconds"
 */
export async function POST(
  _req: NextRequest,
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

    // Server-authoritative finish evaluation
    const result = await db.finishFocusSession(sessionId, session.userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Focus protocol duration requirement not fulfilled.",
          session: result.session,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: result.session,
        signalIntegrity: result.signalIntegrity,
        status: "SESSION VERIFIED",
        message: "Focus Protocol completed. Telemetry signal verified. Mission ready to clear.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Focus Finish Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to finalize Focus Protocol session." },
      { status: 500 }
    );
  }
}
