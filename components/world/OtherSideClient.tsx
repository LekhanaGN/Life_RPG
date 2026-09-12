"use client";

import React, { useState } from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { AttributeBar } from "@/components/character/AttributeBar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DbCharacter, DbUser, WorldStateSummary } from "@/lib/db/client";
import { motion } from "framer-motion";
import {
  Skull,
  AlertOctagon,
  RotateCcw,
  Flame,
  ShieldAlert,
  Sparkles,
  Zap,
  Lock,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { ActiveAnomalyData } from "@/components/events/ActiveAnomalyHUD";
import { SignalConsoleShell } from "@/components/navigation/SignalConsole";

export interface OtherSideClientProps {
  user: DbUser;
  character: DbCharacter;
  initialWorldState?: WorldStateSummary;
  initialStreakSummary?: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    todayActive: boolean;
    streakBroken: boolean;
    previousStreak: number;
  };
  initialWorldEvent?: ActiveAnomalyData | null;
  activeFocusSession?: {
    id: string;
    missionTitle?: string;
    accumulatedActiveSeconds: number;
    requiredDurationSeconds: number;
    status: string;
    signalIntegrity: number;
  } | null;
}

export function OtherSideClient({
  user,
  character,
  initialWorldState,
  initialStreakSummary,
  initialWorldEvent,
  activeFocusSession,
}: OtherSideClientProps) {
  const { triggerTransition, isTransitioning } = useWorldTransition();
  const [worldState] = useState<WorldStateSummary | undefined>(initialWorldState);
  const [streak] = useState(initialStreakSummary);
  const [activeEvent] = useState<ActiveAnomalyData | null>(initialWorldEvent || null);
  const [focusSession] = useState(activeFocusSession || null);

  const handleReturnToRightSide = () => {
    triggerTransition("/right-side", "other-to-right");
  };

  const activeBoss = worldState?.activeBoss;
  const corruption = worldState?.corruption ?? 100;
  const areas = worldState?.areas || [];
  const distortion = activeEvent?.visualEffect?.distortionStyle;

  return (
    <SignalConsoleShell
      user={user}
      character={character}
      corruption={worldState?.corruption ?? 100}
      activeAnomaly={activeEvent}
      realm="other-side"
    >
      <div className={`relative min-h-screen flex flex-col justify-between overflow-hidden ${
        distortion === "static"
          ? "crt-scanlines animate-flicker"
          : distortion === "vibration"
          ? "animate-pulse"
          : ""
      }`}>
      {/* Dynamic atmospheric distortion overlay */}
      {distortion === "breach" && (
        <div className="pointer-events-none fixed inset-0 z-10 border-[6px] border-red-600/40 shadow-[inset_0_0_80px_rgba(220,38,38,0.5)] animate-pulse" />
      )}
      {distortion === "darkness" && (
        <div className="pointer-events-none fixed inset-0 z-10 bg-black/30 shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]" />
      )}
      {/* Corrupted Void, Deep Crimson, and Spore Particles */}
      <WorldBackground mode="other-side" />

      {/* Top HUD Navigation Bar */}
      <WorldNavigation currentRealm="other-side" user={user} character={character} />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* World Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-red-800/40 pb-6 gap-4"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="crimson" pulse>
                THE OTHER SIDE
              </Badge>
              {focusSession ? (
                <Badge variant="cyan" pulse>
                  FOCUS SESSION ACTIVE
                </Badge>
              ) : (
                <Badge variant="amber">
                  NOT STARTED TODAY
                </Badge>
              )}
              <span className="text-xs font-mono text-red-500 uppercase tracking-widest animate-pulse">
                THE OTHER SIDE // PLAYER: {character.name.toUpperCase()} [
                {character.archetype}]
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-red uppercase">
              THE OTHER SIDE
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-red-300/90 italic tracking-wider mt-1">
              &ldquo;Where procrastination grows.&rdquo;
            </p>
          </div>

          {/* Prominent Return Action */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>THE RIGHT SIDE IS READY</span>
            </div>
            <Button
              id="return-right-side-btn"
              variant="portal-cyan"
              size="lg"
              glow
              disabled={isTransitioning}
              onClick={handleReturnToRightSide}
              className="border-cyan-500 text-cyan-200 hover:text-black bg-cyan-950/40 hover:bg-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)]"
              aria-label="Return to the Right Side dimension"
            >
              <RotateCcw className="w-5 h-5 mr-2 text-cyan-400 group-hover:text-black" />
              RETURN TO THE RIGHT SIDE
            </Button>
          </div>
        </motion.div>

        {/* Threat & Corruption Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: World Corruption Meter & Drained Attributes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* World Corruption Gauge Card */}
            <Card variant="corrupted" glow className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                    <CardTitle className="text-red-300">WORLD CORRUPTION</CardTitle>
                  </div>
                  <Badge variant="crimson" pulse>
                    {corruption > 75
                      ? "CRITICAL"
                      : corruption > 40
                      ? "UNSTABLE"
                      : "PURGING"}
                  </Badge>
                </div>
                <CardDescription className="text-red-400/80">
                  The Other Side grows stronger when you stop making progress.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <ProgressBar
                  value={corruption}
                  max={100}
                  variant="crimson"
                  segmented
                  label="WORLD CORRUPTION"
                  sublabel={`${corruption}% REMAINING`}
                />

                <div className="p-3 rounded-xs bg-red-950/40 border border-red-900/60 text-xs font-mono text-red-200/90 leading-relaxed">
                  The Other Side feeds on postponed decisions, bad habits, and lost streaks.
                  Completing real-life missions reduces corruption by 2% to 10% per victory.
                </div>

                {/* Survival Signal & Other Side Reaction Intercept */}
                {streak && (
                  <div className="p-3.5 rounded-xs bg-red-950/60 border border-red-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-red-400 font-bold uppercase flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        YOUR STREAK STATUS
                      </span>
                      <span className="font-orbitron font-extrabold text-red-200">
                        {streak.currentStreak > 0
                          ? `${streak.currentStreak.toString().padStart(2, "0")} DAYS`
                          : "LOST"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-red-900/50">
                      <span className="text-slate-400">WORLD REACTION:</span>
                      <span
                        className={`font-bold uppercase ${
                          streak.streakBroken
                            ? "text-red-400 animate-pulse"
                            : streak.currentStreak >= 14
                            ? "text-cyan-400"
                            : streak.currentStreak >= 7
                            ? "text-amber-300"
                            : "text-red-300"
                        }`}
                      >
                        {streak.streakBroken
                          ? "CORRUPTION SPREADING"
                          : streak.currentStreak >= 30
                          ? "BOSS WEAKENING RAPIDLY"
                          : streak.currentStreak >= 14
                          ? "CORRUPTION RECEDING"
                          : streak.currentStreak >= 7
                          ? "CRACKS EXPANDING"
                          : streak.currentStreak >= 3
                          ? "MOMENTUM BUILDING"
                          : "NO STREAK YET"}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono text-red-300/70 italic pt-0.5">
                      {streak.streakBroken
                        ? "Your streak was broken. Complete missions to rebuild your streak."
                        : streak.currentStreak >= 7
                        ? "Your daily progress is weakening The Other Side."
                        : "Complete a mission every day to keep your streak going."}
                    </p>
                  </div>
                )}

                {/* Active World Event Anomaly Intercept */}
                {activeEvent && (
                  <div
                    className="p-3.5 rounded-xs border space-y-2 transition-all duration-500"
                    style={{
                      borderColor: activeEvent.visualEffect.ambientColor + "66",
                      backgroundColor: "rgba(15, 5, 10, 0.7)",
                      boxShadow: `0 0 15px ${activeEvent.visualEffect.ambientColor}22`,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold uppercase flex items-center gap-1.5" style={{ color: activeEvent.visualEffect.ambientColor }}>
                        <Zap className="w-3.5 h-3.5 animate-pulse" />
                        ACTIVE SPECIAL CHALLENGE
                      </span>
                      <span className="font-orbitron font-extrabold" style={{ color: activeEvent.visualEffect.ambientColor }}>
                        {activeEvent.key.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-300 leading-snug">
                      {activeEvent.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-red-900/40">
                      <span className="text-slate-400">CHALLENGE EFFECT:</span>
                      <span className="font-bold uppercase" style={{ color: activeEvent.visualEffect.ambientColor }}>
                        {activeEvent.visualEffect.distortionStyle.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">HOW TO COMPLETE:</span>
                      <span className="text-white font-mono font-bold">
                        {activeEvent.progress} / {activeEvent.requiredProgress} MISSIONS COMPLETED
                      </span>
                    </div>
                  </div>
                )}

                {/* Signal Integrity Telemetry Intercept */}
                <div
                  className={`p-3.5 rounded-xs border space-y-2 transition-all duration-500 ${
                    focusSession
                      ? "bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      : "bg-red-950/40 border-red-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span
                      className={`font-bold uppercase flex items-center gap-1.5 ${
                        focusSession ? "text-cyan-400" : "text-amber-400"
                      }`}
                    >
                      <Radio
                        className={`w-3.5 h-3.5 ${
                          focusSession ? "text-cyan-400 animate-pulse" : "text-amber-500"
                        }`}
                      />
                      FOCUS SESSION STATUS
                    </span>
                    <span
                      className={`font-orbitron font-extrabold px-1.5 py-0.5 rounded-xs text-[10px] ${
                        focusSession
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                          : "bg-red-950 text-red-400 border border-red-800/40"
                      }`}
                    >
                      {focusSession ? "FOCUS ACTIVE" : "NO ACTIVE SESSION"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-red-900/30">
                    <span className="text-slate-400">FOCUS VERIFICATION:</span>
                    <span
                      className={`font-bold uppercase ${
                        focusSession ? "text-cyan-300" : "text-red-400/80"
                      }`}
                    >
                      {focusSession
                        ? `${focusSession.signalIntegrity}% VERIFIED`
                        : "START A FOCUS TIMER"}
                    </span>
                  </div>

                  {focusSession ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-cyan-200/80">
                        <span className="truncate max-w-[200px]">{focusSession.missionTitle}</span>
                        <span>
                          {Math.floor(focusSession.accumulatedActiveSeconds / 60)}m /{" "}
                          {Math.floor(focusSession.requiredDurationSeconds / 60)}m
                        </span>
                      </div>
                      <ProgressBar
                        value={focusSession.accumulatedActiveSeconds}
                        max={focusSession.requiredDurationSeconds}
                        variant="cyan"
                        label="FOCUS TIME COMPLETED"
                      />
                      <p className="text-[10px] font-mono text-cyan-300/70 italic pt-0.5">
                        Deep focus session in progress. Keep working on your task!
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-mono text-slate-400/70 italic pt-0.5">
                      Use Timed Focus Sessions or submit Written Proof to complete verified missions.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Drained Attributes Panel with Character Stats */}
            <Card variant="crimson" className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <CardTitle className="text-white text-base">
                      WEAKENED STATS
                    </CardTitle>
                  </div>
                  <Badge variant="crimson">ACTION NEEDED</Badge>
                </div>
                <CardDescription className="text-slate-400">
                  Stats affected while The Other Side is active for {character.name.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttributeBar corrupted character={character} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Active Threat Dossier & Corrupted Map Fragments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Active Threat Card */}
            {activeBoss ? (
              <Card variant="corrupted" glow className="space-y-5">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-sm border-2 border-red-600 bg-red-950/70 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                        <Skull className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-red-400 text-lg sm:text-xl tracking-widest font-cinzel">
                            {activeBoss.name}
                          </CardTitle>
                          <Badge variant="crimson">
                            {activeBoss.isDefeated ? "DEFEATED" : "ACTIVE BOSS"}
                          </Badge>
                        </div>
                        <CardDescription className="text-red-400/70">
                          {activeBoss.title} {"//"} BOSS TIER {activeBoss.order}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-xs bg-red-950/60 border border-red-700/80 text-left sm:text-right">
                      <div className="text-[10px] font-mono text-red-400 font-bold uppercase">
                        BOSS HEALTH
                      </div>
                      <div className="text-xs sm:text-sm font-orbitron font-extrabold text-red-200">
                        {activeBoss.currentHp} / {activeBoss.maxHp} HP ({activeBoss.hpPercent}%)
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Dynamic Boss HP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-red-300 font-bold">BOSS HP</span>
                      <span className="text-red-400 font-orbitron">{activeBoss.hpPercent}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-950 rounded-xs border border-red-900/80 p-0.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] rounded-[1px]"
                        initial={{ width: 0 }}
                        animate={{ width: `${activeBoss.hpPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Threat Traits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-black/60 border border-red-900/60 rounded-xs">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        SPECIAL TRAIT
                      </div>
                      <div className="font-orbitron text-sm font-bold text-red-400 mt-0.5">
                        {activeBoss.threatTrait}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {activeBoss.threatTraitDesc}
                      </p>
                    </div>

                    <div className="p-3 bg-black/60 border border-red-900/60 rounded-xs">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        CORRUPTION CAUSE
                      </div>
                      <div className="font-orbitron text-sm font-bold text-purple-400 mt-0.5">
                        {activeBoss.corruptionSource}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {activeBoss.corruptionSourceDesc}
                      </p>
                    </div>
                  </div>

                  {/* Combat Instruction Banner */}
                  <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>HOW TO DEFEAT THIS BOSS</span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 leading-relaxed">
                      Every completed mission in The Right Side deals direct damage to{" "}
                      <span className="text-white font-bold">{activeBoss.name}</span> (-10 to -80 HP).
                      When HP reaches 0, the boss is defeated and rewards are unlocked.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Corrupted World Fragments Card */}
            <Card variant="corrupted">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    <CardTitle className="text-red-300 text-base">
                      CORRUPTED AREAS
                    </CardTitle>
                  </div>
                  <Badge variant="crimson">{areas.length} AREAS</Badge>
                </div>
                <CardDescription className="text-red-400/80">
                  Areas affected by corruption
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {areas.map((area) => (
                    <div
                      key={area.areaKey}
                      className={`p-2.5 rounded-xs border text-left ${
                        !area.isUnlocked
                          ? "border-slate-900 bg-slate-950/60 text-slate-600"
                          : area.status === "RESTORED"
                          ? "border-emerald-900/50 bg-emerald-950/20 text-emerald-300"
                          : "border-red-950 bg-red-950/20 text-red-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-cinzel font-bold truncate">
                          {area.name}
                        </span>
                        {!area.isUnlocked ? (
                          <Lock className="w-3 h-3 text-slate-600" />
                        ) : area.status === "RESTORED" ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="text-[9px] font-mono text-red-400">
                            {100 - area.restorationPercent}% CORRUPTED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* World Status Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-red-950/60 bg-black/50 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE OTHER SIDE // Turn real-life goals into missions.</div>
          <div className="text-red-500/90">© 2026 THE OTHER SIDE</div>
        </div>
      </footer>
    </div>
  </SignalConsoleShell>
  );
}
