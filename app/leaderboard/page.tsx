import React from "react";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { WorldBackground } from "@/components/world/WorldBackground";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export const metadata: Metadata = {
  title: "Global Leaderboard // The Other Side",
  description:
    "Live server-authoritative rankings for all survivors in The Other Side. Real database XP progression and player stats.",
};

export default async function LeaderboardPage() {
  const authData = await getCurrentUser();
  const currentUserId = authData?.user?.id;

  const initialData = await db.getLeaderboard({
    currentUserId,
    limit: 100,
  });

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Background Atmosphere */}
      <WorldBackground mode={authData?.character ? "right-side" : "landing"} />

      {/* Top Header Navigation */}
      <WorldNavigation
        currentRealm={authData?.character ? "right-side" : "landing"}
        user={authData?.user || null}
        character={authData?.character || null}
      />

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 px-4 sm:px-8 py-8">
        <LeaderboardClient
          initialData={initialData}
          currentUser={authData?.user || null}
          currentCharacter={authData?.character || null}
        />
      </main>

      {/* Compact Atmospheric Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xs py-4 px-6 text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>THE OTHER SIDE // GLOBAL LEADERBOARD</span>
          <span className="text-slate-400">
            Real-time server synchronization • © 2026 THE OTHER SIDE
          </span>
        </div>
      </footer>
    </div>
  );
}
