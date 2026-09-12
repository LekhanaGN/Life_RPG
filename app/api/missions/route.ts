// THE OTHER SIDE - Mission API Endpoint (Collection)
// GET /api/missions - List missions owned by authenticated user
// POST /api/missions - Create a new mission for authenticated user

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { validateCreateMission } from "@/lib/missions/validation";

/**
 * @flows Survivor -> API.Missions.GET via HTTPS -- "Fetch survivor missions"
 * @mitigates API.Missions.GET against #unauthorized-access using #session-auth -- "Requires valid HTTP-only session JWT"
 * @mitigates API.Missions.GET against #idor using #user-scoping -- "Queries database scoped strictly to session.userId"
 * @handles #mission-data on API.Missions.GET -- "Returns array of DbMission records"
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Transmission unauthorized. Please re-authenticate." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;

    const missions = await db.findMissionsByUserId(session.userId, {
      category,
      status,
    });

    return NextResponse.json({ missions }, { status: 200 });
  } catch (error) {
    console.error("[API Missions GET Error]:", error);
    return NextResponse.json(
      { error: "Dimensional resonance failure. Could not retrieve missions." },
      { status: 500 }
    );
  }
}

/**
 * @flows Survivor -> API.Missions.POST via HTTPS -- "Create and register new mission"
 * @mitigates API.Missions.POST against #unauthorized-access using #session-auth -- "Verifies session token before creation"
 * @mitigates API.Missions.POST against #idor using #user-scoping -- "Binds new mission userId directly from server session"
 * @mitigates API.Missions.POST against #input-validation-failure using #input-validation -- "Enforces schema validity and sanitization"
 * @handles #mission-data on API.Missions.POST -- "Stores new persistent mission record"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Transmission unauthorized. Please re-authenticate." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Malformed transmission body." },
        { status: 400 }
      );
    }

    const validation = validateCreateMission(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        {
          error: "Mission parameters rejected by dimensional filter.",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const newMission = await db.createMission({
      userId: session.userId,
      title: validation.data.title,
      description: validation.data.description,
      category: validation.data.category,
      difficulty: validation.data.difficulty,
      frequency: validation.data.frequency,
      dueDate: validation.data.dueDate,
    });

    return NextResponse.json({ mission: newMission }, { status: 201 });
  } catch (error) {
    console.error("[API Missions POST Error]:", error);
    return NextResponse.json(
      { error: "Dimensional resonance failure. Could not encode mission." },
      { status: 500 }
    );
  }
}
