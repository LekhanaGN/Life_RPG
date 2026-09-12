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

  // Fetch live world, boss & streak telemetry directly for zero-latency hydration
  const [initialWorldState, initialStreakSummary] = await Promise.all([
    db.findWorldStateByUserId(authData.user.id),
    db.findStreakSummary(authData.user.id, authData.user.timezone),
  ]);

  const initialWorldEvent = formatActiveAnomalyData(activeEvent);

  return (
    <OtherSideClient
      user={authData.user}
      character={authData.character}
      initialWorldState={initialWorldState}
      initialStreakSummary={initialStreakSummary}
      initialWorldEvent={initialWorldEvent}
    />
  );
}
