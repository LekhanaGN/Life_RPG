import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { InventoryClient } from "@/components/inventory/InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect("/auth/login");
  }

  if (!authData.character) {
    redirect("/onboarding");
  }

  const inventory = await db.findInventoryByUserId(authData.user.id);

  return (
    <InventoryClient
      user={authData.user}
      character={authData.character}
      initialInventory={inventory}
    />
  );
}
