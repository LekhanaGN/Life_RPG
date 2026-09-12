import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { calculateSignalIntegrity } from "@/lib/game/verification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/focus/[id]
 * Fetch current focus session status and telemetry.
 *
 * @boundary between #client and #server -- "Focus session inspection endpoint"
 * @handles internal on API.Focus.Get -- "Retrieves session state, active seconds, and integrity"
 * @mitigates API.Focus.Get against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Focus.Get against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const focusSession = await db.findFocusSessionById(sessionId, session.userId);
    if (!focusSession) {
      return NextResponse.json(
        { success: false, error: "Focus session not found." },
        { status: 404 }
      );
    }

    const signalIntegrity = calculateSignalIntegrity(
      "FOCUS_SESSION",
      focusSession.accumulatedActiveSeconds,
      focusSession.idleSeconds
    );

    return NextResponse.json(
      {
        success: true,
        session: focusSession,
        signalIntegrity,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Focus GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve focus session telemetry." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/focus/[id]
 * Mutates session state: PAUSE, RESUME, or CANCEL.
 *
 * @boundary between #client and #server -- "Focus session control endpoint"
 * @handles internal on API.Focus.Patch -- "Transitions session to PAUSED, ACTIVE, or CANCELLED"
 * @mitigates API.Focus.Patch against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Focus.Patch against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const body = await req.json().catch(() => null);
    const action = body?.action ? String(body.action).toUpperCase() : "";

    let updatedSession = null;

    if (action === "PAUSE") {
      updatedSession = await db.pauseFocusSession(sessionId, session.userId);
    } else if (action === "RESUME") {
      updatedSession = await db.resumeFocusSession(sessionId, session.userId);
    } else if (action === "CANCEL" || action === "ABORT") {
      updatedSession = await db.cancelFocusSession(sessionId, session.userId);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Supported actions: PAUSE, RESUME, CANCEL." },
        { status: 400 }
      );
    }

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: `Could not transition session to ${action}.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session: updatedSession,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Focus PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update Focus Protocol state." },
      { status: 500 }
    );
  }
}
