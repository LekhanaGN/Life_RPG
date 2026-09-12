import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { OtherSideClient } from "@/components/world/OtherSideClient";
import { formatActiveAnomalyData } from "@/lib/game/worldEvents";

export const dynamic = "force-dynamic";

export default async function OtherSidePage() {
  // Server-side Route Guard: Must be authenticated
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect("/auth/login");
  }

  // If user hasn't created a character, redirect to onboarding
  if (!authData.character) {
    redirect("/onboarding");
  }

  // Retrieve active anomaly if present
  const activeEvent = await db.findActiveUserWorldEvent(authData.user.id);

  // Fetch live world, boss, streak & focus session telemetry directly for zero-latency hydration
  const [initialWorldState, initialStreakSummary, activeFocusSessionRaw] = await Promise.all([
    db.findWorldStateByUserId(authData.user.id),
    db.findStreakSummary(authData.user.id, authData.user.timezone),
    db.findActiveFocusSession(authData.user.id),
  ]);

  let activeFocusSession = null;
  if (activeFocusSessionRaw) {
    const mission = await db.findMissionById(activeFocusSessionRaw.missionId, authData.user.id);
    activeFocusSession = {
      id: activeFocusSessionRaw.id,
      missionTitle: mission?.title || "Classified Focus Protocol",
      accumulatedActiveSeconds: activeFocusSessionRaw.accumulatedActiveSeconds,
      requiredDurationSeconds: activeFocusSessionRaw.requiredDurationSeconds,
      status: activeFocusSessionRaw.status,
      signalIntegrity: Math.round(
        (activeFocusSessionRaw.accumulatedActiveSeconds / Math.max(1, activeFocusSessionRaw.requiredDurationSeconds)) * 100
      ),
    };
  }

  const initialWorldEvent = formatActiveAnomalyData(activeEvent);

  return (
    <OtherSideClient
      user={authData.user}
      character={authData.character}
      initialWorldState={initialWorldState}
      initialStreakSummary={initialStreakSummary}
      initialWorldEvent={initialWorldEvent}
      activeFocusSession={activeFocusSession}
    />
  );
}
