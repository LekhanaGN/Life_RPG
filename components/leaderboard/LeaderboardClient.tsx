"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Zap,
  User,
  Shield,
  Search,
  RefreshCw,
  Compass,
  Brain,
  Dumbbell,
  Target,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeaderboardData, LeaderboardEntry, DbUser, DbCharacter } from "@/lib/db/client";
import { getLevelFromXP } from "@/lib/game/leveling";
import { soundscape } from "@/lib/audio/soundscape";
import { cn } from "@/lib/utils";

interface LeaderboardClientProps {
  initialData: LeaderboardData;
  currentUser?: DbUser | null;
  currentCharacter?: DbCharacter | null;
}

export function LeaderboardClient({
  initialData,
  currentUser,
  currentCharacter,
}: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardData>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Progression Stats for Tips Panel
  const currentXp = currentCharacter?.xp ?? 0;
  const progression = useMemo(() => getLevelFromXP(currentXp), [currentXp]);
  const xpNeededForNext = progression.nextLevelXP - progression.currentLevelXP;

  // Refresh leaderboard data from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    soundscape.playHover();

    try {
      const res = await fetch("/api/leaderboard?limit=100", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        soundscape.playRestoration();
      } else {
        setError(json.error || "Failed to refresh signal rankings.");
        soundscape.playGlitch();
      }
    } catch (err) {
      setError("Network anomaly: could not reach ranking servers.");
      soundscape.playGlitch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered leaderboard entries based on search & class filter
  const filteredEntries = useMemo(() => {
    return data.entries.filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass =
        selectedClass === "ALL" ||
        entry.archetype.toUpperCase() === selectedClass.toUpperCase();
      return matchesSearch && matchesClass;
    });
  }, [data.entries, searchQuery, selectedClass]);

  const userEntry = data.currentUserEntry;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" pulse>
              GLOBAL SIGNAL
            </Badge>
            <span className="text-xs font-mono text-slate-400">
              {data.totalPlayers.toLocaleString()} REGISTERED SURVIVORS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-cinzel font-black tracking-widest text-white uppercase neon-glow-cyan">
            GLOBAL LEADERBOARD
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1">
            Every completed mission leaves a permanent trace across the worlds.
          </p>
        </div>

        {/* Action / Refresh Button */}
        <div className="flex items-center gap-3">
          <Button
            id="refresh-leaderboard-btn"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-cyan-300 font-mono text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing && "animate-spin text-cyan-400")} />
            <span>{isRefreshing ? "SYNCING..." : "REFRESH SIGNAL"}</span>
          </Button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-950/80 border border-red-600 rounded-xs flex items-center justify-between gap-3 text-xs font-mono text-red-200"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <strong className="text-white block">LEADERBOARD UNAVAILABLE</strong>
              <span>{error}</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 border border-red-700 rounded-xs text-white font-bold"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Grid: Main Leaderboard + Sidebar Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Main Leaderboard (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Current User Position Card */}
          {currentUser ? (
            <Card
              variant={userEntry ? "cyan" : "default"}
              glow={Boolean(userEntry)}
              className="border-2 border-cyan-500/70 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                      YOUR CURRENT POSITION
                    </span>
                  </div>
                  <Badge variant="cyan" pulse>
                    {userEntry ? `RANK #${userEntry.rank}` : "UNRANKED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {userEntry ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xs border-2 border-cyan-400 bg-cyan-950/60 flex items-center justify-center font-orbitron font-extrabold text-cyan-200 text-lg shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                        #{userEntry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cinzel text-lg font-bold text-white">
                            {userEntry.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                            YOU
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          CLASS: <strong className="text-amber-300">{userEntry.archetype}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-center">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">LEVEL</div>
                        <div className="font-orbitron font-bold text-sm text-cyan-300">
                          LVL {userEntry.level < 10 ? `0${userEntry.level}` : userEntry.level}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">TOTAL XP</div>
                        <div className="font-orbitron font-extrabold text-sm sm:text-base text-cyan-200">
                          {userEntry.xp.toLocaleString()} XP
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">STREAK</div>
                        <div className="font-orbitron font-bold text-sm text-amber-300 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>{userEntry.streak}D</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Complete your first mission to initialize your position on the leaderboard.</span>
                    <Link href="/right-side" className="text-cyan-400 underline font-bold">
                      View Missions
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card variant="default" className="border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Log in with your account to view your global ranking and track progression.</span>
                </div>
                <Link
                  href="/auth/login"
                  className="px-3 py-1.5 rounded-xs bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold uppercase tracking-wider text-center hover:bg-cyan-900 transition-colors"
                >
                  LOG IN
                </Link>
              </div>
            </Card>
          )}

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search survivor or username..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xs text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Class Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
              {["ALL", "EXPLORER", "SCHOLAR", "WARRIOR", "STRATEGIST"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={cn(
                    "px-2.5 py-1 rounded-xs border transition-colors text-[11px] font-bold uppercase whitespace-nowrap cursor-pointer",
                    selectedClass === cls
                      ? "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Table / Card List */}
          <div className="rounded-xs border border-slate-800 bg-slate-950/80 overflow-hidden shadow-lg">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 p-3.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-1 text-center">RANK</div>
              <div className="col-span-5">SURVIVOR</div>
              <div className="col-span-2 text-center">CLASS</div>
              <div className="col-span-2 text-center">LEVEL</div>
              <div className="col-span-2 text-right pr-2">TOTAL XP</div>
            </div>

            {/* Entries List */}
            <div className="divide-y divide-slate-800/80">
              {data.entries.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-slate-400 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="font-cinzel text-base font-bold text-slate-200">
                    NO PLAYERS YET
                  </div>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Complete your first mission to get on the leaderboard.
                  </p>
                  {currentUser && (
                    <div className="pt-2">
                      <Link
                        href="/right-side"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-cyan-950 border border-cyan-500/60 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-colors"
                      >
                        <span>VIEW MISSIONS</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-1">
                  <div>NO SURVIVORS FOUND MATCHING FILTER.</div>
                  <div className="text-[11px] text-slate-600">Try changing your search query or class filter.</div>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;
                  const isMe = entry.isCurrentUser;

                  return (
                    <div
                      key={entry.userId}
                      className={cn(
                        "flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 p-3.5 transition-all",
                        isMe
                          ? "bg-cyan-950/30 border-l-4 border-cyan-400"
                          : isTop1
                          ? "bg-amber-950/15 hover:bg-slate-900/60"
                          : "hover:bg-slate-900/50"
                      )}
                    >
                      {/* Mobile Row: Top Rank & Player Header */}
                      <div className="flex md:contents items-center justify-between">
                        {/* Rank Column */}
                        <div className="col-span-1 flex items-center md:justify-center">
                          <span
                            className={cn(
                              "font-orbitron font-bold text-xs px-2 py-0.5 rounded-xs",
                              isTop1
                                ? "bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                                : isTop2
                                ? "bg-slate-300 text-black"
                                : isTop3
                                ? "bg-amber-800 text-amber-100"
                                : "text-slate-400 font-mono"
                            )}
                          >
                            #{entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                          </span>
                        </div>

                        {/* Player Details */}
                        <div className="col-span-5 flex items-center gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-cinzel text-sm font-bold", isMe ? "text-cyan-300 font-black" : "text-white")}>
                                {entry.name}
                              </span>
                              {isMe && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold uppercase">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 md:hidden flex items-center gap-2 mt-0.5">
                              <span>{entry.archetype}</span>
                              <span>•</span>
                              <span>LVL {entry.level}</span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Total XP Display */}
                        <div className="md:hidden text-right">
                          <div className="font-orbitron text-sm font-extrabold text-cyan-300">
                            {entry.xp.toLocaleString()} XP
                          </div>
                          {entry.streak > 0 && (
                            <div className="text-[10px] font-mono text-amber-400 flex items-center justify-end gap-0.5">
                              <Flame className="w-3 h-3" />
                              <span>{entry.streak}D STREAK</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Only Columns */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-center text-xs font-mono text-slate-300">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-800 uppercase">
                          {entry.archetype}
                        </span>
                      </div>

                      <div className="hidden md:flex md:col-span-2 items-center justify-center font-orbitron text-xs font-bold text-cyan-300">
                        LVL {entry.level < 10 ? `0${entry.level}` : entry.level}
                      </div>

                      <div className="hidden md:flex md:col-span-2 flex-col items-end justify-center pr-2">
                        <div className="font-orbitron text-sm font-extrabold text-cyan-200">
                          {entry.xp.toLocaleString()}
                        </div>
                        {entry.streak > 0 && (
                          <div className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />
                            <span>{entry.streak}D</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: In-World Points & Tips Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dynamic User Signal Summary (if logged in) */}
          {currentUser && (
            <Card variant="cyan" glow className="border border-cyan-500/50 bg-slate-950/90">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <CardTitle className="text-white text-base">YOUR PROGRESS</CardTitle>
                </div>
                <CardDescription>
                  LIVE TELEMETRY FROM YOUR PROFILE
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xs bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">CURRENT XP</div>
                    <div className="text-base font-orbitron font-extrabold text-cyan-300 mt-0.5">
                      {currentXp.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xs bg-black/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">NEXT LEVEL</div>
                    <div className="text-base font-orbitron font-extrabold text-amber-400 mt-0.5">
                      +{xpNeededForNext} XP
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xs bg-cyan-950/30 border border-cyan-800/40 text-xs font-mono text-cyan-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Level {progression.level}: {progression.progressPercent}% to Level {progression.level + 1}. Complete higher difficulty tasks to rank up faster.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Points & XP Strategy Guide (Actual Game Mechanics) */}
          <Card variant="default" className="border-amber-500/40 bg-slate-950/95 space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <CardTitle className="text-white text-base tracking-widest font-cinzel">
                  HOW TO EARN XP
                </CardTitle>
              </div>
              <CardDescription>
                REAL SCORING MECHANICS
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs font-mono">
              {/* 1. Mission Difficulties */}
              <div className="space-y-1.5 border-b border-slate-800 pb-3">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>+ COMPLETE MISSIONS</span>
                  <span className="text-[10px] text-slate-400 font-normal">BASE REWARDS</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Higher difficulty objectives grant substantially greater XP and credits:
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                  <div className="p-1.5 bg-black/50 border border-slate-800 rounded-xs flex justify-between">
                    <span className="text-emerald-400 font-bold">EASY</span>
                    <span className="text-slate-300">+20 XP</span>
                  </div>
                  <div className="p-1.5 bg-black/50 border border-slate-800 rounded-xs flex justify-between">
                    <span className="text-cyan-400 font-bold">MEDIUM</span>
                    <span className="text-slate-300">+40 XP</span>
                  </div>
                  <div className="p-1.5 bg-black/50 border border-slate-800 rounded-xs flex justify-between">
                    <span className="text-amber-400 font-bold">HARD</span>
                    <span className="text-slate-300">+70 XP</span>
                  </div>
                  <div className="p-1.5 bg-black/50 border border-slate-800 rounded-xs flex justify-between">
                    <span className="text-purple-400 font-bold">EPIC</span>
                    <span className="text-slate-300">+120 XP</span>
                  </div>
                </div>
              </div>

              {/* 2. Streaks */}
              <div className="space-y-1.5 border-b border-slate-800 pb-3">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ BUILD DAILY STREAKS</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Complete at least one mission every day. Consistent activity unlocks milestone awards (+25 to +250 XP/Credits) and strengthens world integrity.
                </p>
              </div>

              {/* 3. Boss Victory Bonuses */}
              <div className="space-y-1.5 border-b border-slate-800 pb-3">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>+ DEFEAT WORLD BOSSES</span>
                  <span className="text-[10px] text-red-400 font-bold">MAJOR XP</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Completing missions deals damage to active bosses in The Other Side. Purging a boss awards large bonus XP:
                </p>
                <ul className="text-[10px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>The Procrastinator: <span className="text-amber-300 font-bold">+200 XP</span></li>
                  <li>The Distraction: <span className="text-amber-300 font-bold">+350 XP</span></li>
                  <li>The Doubt: <span className="text-amber-300 font-bold">+500 XP</span></li>
                  <li>The Sleepless: <span className="text-amber-300 font-bold">+800 XP</span></li>
                </ul>
              </div>

              {/* 4. Special Challenges */}
              <div className="space-y-1.5 border-b border-slate-800 pb-3">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>+ SPECIAL CHALLENGES</span>
                  <span className="text-[10px] text-purple-400 font-bold">LIMITED TIME</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  When a world anomaly appears, fulfill its targeted requirements to claim bonus credits (+60 to +150) and story lore.
                </p>
              </div>

              {/* 5. Stat Leveling */}
              <div className="space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>+ STAT PROGRESSION</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Every mission improves its category stat:
                </p>
                <div className="text-[10px] text-slate-400 grid grid-cols-2 gap-1 pt-0.5">
                  <div>🧠 <strong className="text-blue-300">Mind</strong>: Reading/Learning</div>
                  <div>💪 <strong className="text-emerald-300">Body</strong>: Fitness/Gym</div>
                  <div>🎯 <strong className="text-cyan-300">Focus</strong>: Deep Work</div>
                  <div>✨ <strong className="text-amber-300">Spirit</strong>: Mindfulness</div>
                  <div className="col-span-2">🤝 <strong className="text-purple-300">Connection</strong>: Social/Friends</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
