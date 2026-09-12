import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
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

  return <RightSideClient user={authData.user} character={authData.character} />;
}
