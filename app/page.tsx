import React from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { LandingClient } from "@/components/landing/LandingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "THE OTHER SIDE — Your Real Life Has Two Worlds",
  description:
    "THE OTHER SIDE is a life RPG that turns real-world goals into missions, XP, attributes, rewards and a living game world.",
};

/**
 * Landing Page Server Entrypoint
 *
 * @flows Client -> LandingPage via HTTPS -- "Landing page view"
 * @mitigates LandingPage against #unauthorized-access using #session-auth -- "Retrieves session state to customize CTAs and world routing"
 */
export default async function LandingPage() {
  const authData = await getCurrentUser();

  return (
    <LandingClient
      user={authData?.user || null}
      character={authData?.character || null}
      isAuthenticated={Boolean(authData?.user)}
    />
  );
}
