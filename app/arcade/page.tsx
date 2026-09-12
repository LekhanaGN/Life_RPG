import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ArcadeClient } from "@/components/arcade/ArcadeClient";

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect("/auth/login");
  }

  if (!authData.character) {
    redirect("/onboarding");
  }

  const { items, credits, corruption } = await db.findShopItems(authData.user.id);

  return (
    <ArcadeClient
      user={authData.user}
      character={authData.character}
      initialItems={items}
      initialCredits={credits}
      initialCorruption={corruption}
    />
  );
}
