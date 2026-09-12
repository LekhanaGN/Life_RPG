import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { OtherSideClient } from "@/components/world/OtherSideClient";

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

  return <OtherSideClient user={authData.user} character={authData.character} />;
}
