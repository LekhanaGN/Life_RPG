import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { WorldBackground } from "@/components/world/WorldBackground";
import { CharacterCreationForm } from "@/components/character/CharacterCreationForm";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  // Server-side Route Guard
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect("/auth/login");
  }

  // If survivor already created their character, go directly to Right Side
  if (authData.character) {
    redirect("/right-side");
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden p-4 sm:p-8">
      {/* Dynamic Cyber / Forest Background */}
      <WorldBackground mode="landing" />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 max-w-5xl w-full mx-auto my-8 space-y-8">
        {/* Onboarding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-mono tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>DIMENSION ANOMALY // GENESIS SEQUENCE</span>
          </div>

          <h1 className="font-cinzel text-4xl sm:text-6xl font-black tracking-[0.14em] text-white uppercase neon-glow-cyan select-none">
            WHO ARE YOU?
          </h1>

          <p className="font-cinzel text-lg sm:text-2xl text-cyan-200/90 italic tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            &ldquo;Every survivor begins somewhere.&rdquo;
          </p>
        </div>

        {/* Character Creation Interactive System */}
        <CharacterCreationForm defaultUsername={authData.user.username} />
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center border-t border-cyan-950/40 text-xs font-mono text-slate-500">
        THE OTHER SIDE // GENESIS TERMINAL // LOGGED IN AS: {authData.user.email}
      </footer>
    </div>
  );
}
