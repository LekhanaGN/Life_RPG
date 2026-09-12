import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/focus/start
 * Authoritatively initiates a server-monitored focus protocol session.
 *
 * @boundary between #client and #server -- "Focus session initialization endpoint"
 * @handles internal on API.Focus.Start -- "Creates server-authoritative focus timer and telemetry record"
 * @mitigates API.Focus.Start against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Focus.Start against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 * @mitigates API.Focus.Start against #focus-spoofing using #server-timed-heartbeat -- "Server sets startedAt and required duration"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Transmission denied. Session expired or unauthenticated." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.missionId) {
      return NextResponse.json(
        { success: false, error: "Mission identifier required to initiate Focus Protocol." },
        { status: 400 }
      );
    }

    const missionId = String(body.missionId);

    // 1. Verify mission exists and belongs to authenticated survivor
    const mission = await db.findMissionById(missionId, session.userId);
    if (!mission) {
      return NextResponse.json(
        { success: false, error: "Target mission not found in your survivor dossier." },
        { status: 404 }
      );
    }

    // 2. Verify mission verification type
    if (mission.verificationType !== "FOCUS_SESSION") {
      return NextResponse.json(
        { success: false, error: "Mission does not require a timed focus protocol." },
        { status: 400 }
      );
    }

    // 3. Verify mission is not archived or already completed today
    if (mission.status === "ARCHIVED" || mission.isCompletedToday) {
      return NextResponse.json(
        { success: false, error: "Mission is not currently eligible for focus verification." },
        { status: 400 }
      );
    }

    // 4. Check for existing active session for this mission (resilient refresh recovery)
    const existingActive = await db.findActiveFocusSession(session.userId, missionId);
    if (existingActive) {
      return NextResponse.json(
        {
          success: true,
          session: existingActive,
          resumed: true,
          message: "Active Focus Protocol session resumed from dimensional anchor.",
        },
        { status: 200 }
      );
    }

    // 5. Server determines required duration in seconds
    const durationMinutes = Math.max(1, Math.min(240, mission.focusDurationMinutes || 25));
    const requiredDurationSeconds = durationMinutes * 60;

    // 6. Server creates authoritative session
    const newFocusSession = await db.createFocusSession({
      userId: session.userId,
      missionId: mission.id,
      requiredDurationSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        session: newFocusSession,
        resumed: false,
        message: "Focus Protocol initialized. Dimensional telemetry active.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API Focus Start Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to establish Focus Protocol connection." },
      { status: 500 }
    );
  }
}
