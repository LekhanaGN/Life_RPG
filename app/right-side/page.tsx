import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { RightSideClient } from "@/components/world/RightSideClient";

export const dynamic = "force-dynamic";

export default async function RightSidePage() {
  // Server-side Route Guard: Must be authenticated
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect("/auth/login");
  }

  // If user hasn't created a character, redirect to onboarding
  if (!authData.character) {
    redirect("/onboarding");
  }

  // Fetch initial world & boss telemetry directly for zero-latency hydration
  const initialWorldState = await db.findWorldStateByUserId(authData.user.id);

  return (
    <RightSideClient
      user={authData.user}
      character={authData.character}
      initialWorldState={initialWorldState}
    />
  );
}
