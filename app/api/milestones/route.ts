// THE OTHER SIDE - Survival Protocol Milestones API
// Authoritative catalog and user discovery status for survival milestones.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * @boundary between #client and #server (#api-boundary) -- "Milestones query endpoint"
 * @handles pii on App.API.Milestones -- "Processes authenticated survivor session token"
 * @mitigates App.API.Milestones against #unauthorized-access using #session-auth -- "Enforces JWT session check"
 * @mitigates App.API.Milestones against #idor using #user-scoping -- "Scoping queries strictly to session.userId"
 */

export async function GET(_request: NextRequest) {
  try {
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

    const { all, unlocked } = await db.findUserMilestones(session.userId);
    const streak = await db.findUserStreak(session.userId);

    const currentStreak = streak?.currentStreak ?? 0;
    const totalActiveDays = streak?.totalActiveDays ?? 0;

    const unlockedMap = new Map(unlocked.map((um) => [um.milestone?.key || um.milestoneId, um.unlockedAt]));

    const enrichedMilestones = all.map((m) => {
      const isUnlocked = unlockedMap.has(m.key) || unlockedMap.has(m.id);
      const unlockedAt = unlockedMap.get(m.key) || unlockedMap.get(m.id) || null;

      const currentProgress =
        m.requirementType === "STREAK" ? currentStreak : totalActiveDays;
      const progressPercent = Math.min(
        100,
        Math.round((currentProgress / m.requirementValue) * 100)
      );

      return {
        id: m.id,
        key: m.key,
        name: m.name,
        description: m.description,
        loreQuote: m.loreQuote,
        requirementType: m.requirementType,
        requirementValue: m.requirementValue,
        rewardCredits: m.rewardCredits,
        rewardXP: m.rewardXP,
        icon: m.icon,
        isUnlocked,
        unlockedAt,
        currentProgress,
        progressPercent,
      };
    });

    return NextResponse.json(
      {
        success: true,
        milestones: enrichedMilestones,
        unlockedCount: unlocked.length,
        totalCount: all.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Milestones Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve survival milestone telemetry.",
      },
      { status: 500 }
    );
  }
}
