import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  validateImageMagicBytes,
  validateTextEvidence,
  EVIDENCE_LIMITS,
} from "@/lib/game/evidence";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/missions/[id]/evidence
 * Submits verified photographic evidence or field observation notes for a mission.
 *
 * @boundary between #client and #server -- "Evidence submission endpoint"
 * @handles internal on API.Missions.Evidence.POST -- "Validates file headers, size limits, and sanitizes notes"
 * @mitigates API.Missions.Evidence.POST against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Missions.Evidence.POST against #idor using #user-scoping -- "Verifies mission ownership strictly matches session.userId"
 * @mitigates API.Missions.Evidence.POST against #input-validation-failure using #evidence-ownership-guard -- "Validates MIME, magic bytes, and size"
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Transmission denied. Session expired or unauthenticated." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const missionId = (resolvedParams?.id || "").trim();
    if (!missionId) {
      return NextResponse.json(
        { success: false, error: "Mission identifier required." },
        { status: 400 }
      );
    }

    const userId = session.userId.trim();

    // 1. Verify mission exists and is owned by authenticated survivor
    const mission = await db.findMissionById(missionId, userId);
    if (!mission) {
      // Diagnostic check: check if the mission exists under another user
      const existingUnscoped = await db.findMissionByIdUnscoped(missionId);
      if (existingUnscoped) {
        return NextResponse.json(
          { success: false, error: "Transmission denied. You do not own this mission." },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Mission not found in your survivor dossier." },
        { status: 404 }
      );
    }

    // 2. Parse request payload (supports JSON or multipart form data)
    const contentType = req.headers.get("content-type") || "";
    let evidenceType: "IMAGE" | "TEXT" = "TEXT";
    let fileUrl: string | null = null;
    let description: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textNote = formData.get("description") as string | null;

      if (file && file.size > 0) {
        if (file.size > EVIDENCE_LIMITS.MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { success: false, error: "Evidence file exceeds maximum 5MB limit." },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const magicCheck = validateImageMagicBytes(buffer);
        if (!magicCheck.isValid) {
          return NextResponse.json(
            { success: false, error: magicCheck.error || "Unsupported or malformed image format." },
            { status: 400 }
          );
        }

        // Store as base64 data URI for zero external storage dependencies
        const mimeType = file.type || `image/${magicCheck.detectedType}`;
        fileUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
        evidenceType = "IMAGE";
      }

      if (textNote) {
        const textVal = validateTextEvidence(textNote);
        if (!textVal.isValid && !fileUrl) {
          return NextResponse.json(
            { success: false, error: textVal.error || "Invalid observation note." },
            { status: 400 }
          );
        }
        description = textVal.cleanText || null;
      }
    } else {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return NextResponse.json(
          { success: false, error: "Malformed evidence transmission body." },
          { status: 400 }
        );
      }

      // If image base64 data URI provided
      if (body.imageData && typeof body.imageData === "string") {
        const dataPrefixMatch = body.imageData.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
        if (dataPrefixMatch) {
          const rawMime = dataPrefixMatch[1].toLowerCase();
          if (!EVIDENCE_LIMITS.ALLOWED_MIME_TYPES.includes(rawMime)) {
            return NextResponse.json(
              { success: false, error: "Only JPEG, PNG, and WEBP images are allowed." },
              { status: 400 }
            );
          }

          const base64Data = dataPrefixMatch[2];
          const buffer = Buffer.from(base64Data, "base64");
          if (buffer.length > EVIDENCE_LIMITS.MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
              { success: false, error: "Evidence payload exceeds 5MB limit." },
              { status: 400 }
            );
          }

          const magicCheck = validateImageMagicBytes(buffer);
          if (!magicCheck.isValid) {
            return NextResponse.json(
              { success: false, error: magicCheck.error || "Invalid image bytes." },
              { status: 400 }
            );
          }

          fileUrl = body.imageData;
          evidenceType = "IMAGE";
        }
      }

      if (body.description && typeof body.description === "string") {
        const textVal = validateTextEvidence(body.description);
        if (!textVal.isValid && !fileUrl) {
          return NextResponse.json(
            { success: false, error: textVal.error || "Invalid observation note." },
            { status: 400 }
          );
        }
        description = textVal.cleanText || null;
      }
    }

    if (!fileUrl && !description) {
      return NextResponse.json(
        { success: false, error: "Evidence requires either a valid image upload or observation note." },
        { status: 400 }
      );
    }

    // 3. Persist evidence record
    const evidence = await db.createMissionEvidence({
      userId: session.userId,
      missionId: mission.id,
      type: evidenceType,
      fileUrl,
      description,
    });

    return NextResponse.json(
      {
        success: true,
        evidence: {
          id: evidence.id,
          missionId: evidence.missionId,
          type: evidence.type,
          hasImage: !!evidence.fileUrl,
          description: evidence.description,
          createdAt: evidence.createdAt,
        },
        signalIntegrity: 70,
        status: "EVIDENCE RECEIVED",
        message: "Evidence received. Telemetry signal attached to mission record.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API Mission Evidence POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process mission evidence." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/missions/[id]/evidence
 * Retrieves user's submitted evidence for a mission.
 *
 * @boundary between #client and #server -- "Evidence inspection endpoint"
 * @handles internal on API.Missions.Evidence.GET -- "Retrieves isolated user-scoped evidence logs"
 * @mitigates API.Missions.Evidence.GET against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates API.Missions.Evidence.GET against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
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

    const resolvedParams = await params;
    const missionId = (resolvedParams?.id || "").trim();
    if (!missionId) {
      return NextResponse.json(
        { success: false, error: "Mission identifier required." },
        { status: 400 }
      );
    }

    const userId = session.userId.trim();
    const evidences = await db.findMissionEvidence(userId, missionId);

    return NextResponse.json(
      {
        success: true,
        evidences,
        count: evidences.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Mission Evidence GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve mission evidence." },
      { status: 500 }
    );
  }
}
