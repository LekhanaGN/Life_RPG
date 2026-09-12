// THE OTHER SIDE - Mission API Endpoint (Single Resource)
// GET /api/missions/[id] - Get mission by ID (scoped to owner)
// PATCH /api/missions/[id] - Update mission by ID (scoped to owner)
// DELETE /api/missions/[id] - Abandon/Delete mission by ID (scoped to owner)

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { validateUpdateMission } from "@/lib/missions/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @flows Survivor -> API.Missions.Single.GET via HTTPS -- "Fetch single mission details"
 * @mitigates API.Missions.Single.GET against #unauthorized-access using #session-auth -- "Requires valid HTTP session"
 * @mitigates API.Missions.Single.GET against #idor using #user-scoping -- "Verifies mission belongs strictly to authenticated user"
 * @handles internal on API.Missions.Single.GET -- "Returns full single mission record"
 */
export async function GET(
  _req: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Transmission unauthorized. Please re-authenticate." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Mission identifier required." },
        { status: 400 }
      );
    }

    const mission = await db.findMissionById(id, session.userId);
    if (!mission) {
      return NextResponse.json(
        { error: "Mission not found in your current timeline." },
        { status: 404 }
      );
    }

    return NextResponse.json({ mission }, { status: 200 });
  } catch (error) {
    console.error("[API Missions Single GET Error]:", error);
    return NextResponse.json(
      { error: "Dimensional resonance failure. Could not inspect mission." },
      { status: 500 }
    );
  }
}

/**
 * @flows Survivor -> API.Missions.Single.PATCH via HTTPS -- "Update mission attributes"
 * @mitigates API.Missions.Single.PATCH against #unauthorized-access using #session-auth -- "Enforces session validation"
 * @mitigates API.Missions.Single.PATCH against #idor using #user-scoping -- "Disallows modifying another user's mission"
 * @mitigates API.Missions.Single.PATCH against #input-validation-failure using #input-validation -- "Sanitizes update payload"
 * @handles internal on API.Missions.Single.PATCH -- "Updates mutable mission fields"
 */
export async function PATCH(
  req: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Transmission unauthorized. Please re-authenticate." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Mission identifier required." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Malformed update transmission body." },
        { status: 400 }
      );
    }

    const validation = validateUpdateMission(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        {
          error: "Mission update rejected by dimensional filter.",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const updated = await db.updateMission(id, session.userId, validation.data);
    if (!updated) {
      return NextResponse.json(
        { error: "Mission not found or not owned by your survivor profile." },
        { status: 404 }
      );
    }

    return NextResponse.json({ mission: updated }, { status: 200 });
  } catch (error) {
    console.error("[API Missions Single PATCH Error]:", error);
    return NextResponse.json(
      { error: "Dimensional resonance failure. Could not update mission." },
      { status: 500 }
    );
  }
}

/**
 * @flows Survivor -> API.Missions.Single.DELETE via HTTPS -- "Abandon/Delete mission"
 * @mitigates API.Missions.Single.DELETE against #unauthorized-access using #session-auth -- "Enforces session validation"
 * @mitigates API.Missions.Single.DELETE against #idor using #user-scoping -- "Only allows abandoning owned missions"
 * @handles internal on API.Missions.Single.DELETE -- "Permanently purges mission record"
 */
export async function DELETE(
  _req: NextRequest,
  context: RouteParams
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Transmission unauthorized. Please re-authenticate." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Mission identifier required." },
        { status: 400 }
      );
    }

    const deleted = await db.deleteMission(id, session.userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Mission not found or not owned by your survivor profile." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Mission abandoned." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Missions Single DELETE Error]:", error);
    return NextResponse.json(
      { error: "Dimensional resonance failure. Could not abandon mission." },
      { status: 500 }
    );
  }
}
