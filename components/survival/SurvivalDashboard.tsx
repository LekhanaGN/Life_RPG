"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Radio,
  Flame,
  Award,
  Calendar,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SignalStatus } from "@/lib/game/streaks";

export interface SurvivalDashboardProps {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  todayActive: boolean;
  signal: SignalStatus;
  nextMilestone: {
    name: string;
    days: number;
    remaining: number;
  } | null;
  comebackChallenge?: {
    id: string;
    missionsRequired: number;
    missionsCompleted: number;
    formattedTimeRemaining: string;
    completed: boolean;
    rewardCredits: number;
    corruptionReduction: number;
  } | null;
  streakBroken?: boolean;
}

export function SurvivalDashboard({
  currentStreak,
  longestStreak,
  totalActiveDays,
  todayActive,
  signal,
  nextMilestone,
  comebackChallenge,
  streakBroken,
}: SurvivalDashboardProps) {
  const milestoneTarget = nextMilestone ? nextMilestone.days : 100;
  const milestoneProgress = nextMilestone
    ? Math.min(100, Math.round((currentStreak / milestoneTarget) * 100))
    : 100;

  return (
    <div
      role="region"
      aria-label="Survival Protocol Telemetry"
      className="relative w-full rounded-xs bg-slate-950/80 border border-cyan-900/40 p-5 sm:p-6 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] overflow-hidden"
    >
      {/* Radio Frequency Grid Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* HUD Corner Tech Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xs bg-cyan-950/60 border border-cyan-500/60 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white text-base sm:text-lg font-cinzel font-bold tracking-widest uppercase">
                SURVIVAL PROTOCOL
              </h3>
              <span className="text-[10px] font-mono text-cyan-400/80 uppercase font-semibold hidden xs:inline">
                FREQ // 104.7 MHZ
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Dimensional signal beacon resonance tracker.
            </p>
          </div>
        </div>

        {/* Dynamic Survival Status Pill */}
        <div className="flex items-center gap-2">
          {todayActive ? (
            <Badge variant="cyan" pulse className="px-3 py-1 text-xs font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-300" />
              SIGNAL STABLE [SECURED]
            </Badge>
          ) : (
            <Badge variant="slate" className="px-3 py-1 text-xs font-mono border-amber-500/60 text-amber-300 bg-amber-950/40">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400 animate-pulse" />
              SIGNAL UNCONFIRMED
            </Badge>
          )}
        </div>
      </div>

      {/* Comeback Protocol Recovery Challenge Alert (if active) */}
      {comebackChallenge && !comebackChallenge.completed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mt-4 p-4 rounded-xs border border-amber-500/80 bg-gradient-to-r from-amber-950/50 via-slate-900/80 to-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="font-cinzel text-xs sm:text-sm font-bold tracking-wider text-amber-300 uppercase">
                  COMEBACK PROTOCOL ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-amber-900/60 border border-amber-500/40 text-[10px] font-mono text-amber-200">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {comebackChallenge.formattedTimeRemaining}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-1">
                &ldquo;The signal flickered, but the line can be restored.&rdquo; Complete {comebackChallenge.missionsRequired} missions to stabilize.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: comebackChallenge.missionsRequired }).map((_, i) => {
                  const isDone = i < comebackChallenge.missionsCompleted;
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        isDone
                          ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                          : "bg-slate-900 border-slate-700"
                      }`}
                      title={isDone ? "Completed" : "Pending"}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">
                {comebackChallenge.missionsCompleted}/{comebackChallenge.missionsRequired}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-950/40 px-2 py-0.5 rounded-xs border border-emerald-500/40">
                +{comebackChallenge.rewardCredits} CR // -{comebackChallenge.corruptionReduction}% VOID
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Broken Streak Warning (if signal was lost and no challenge currently active) */}
      {streakBroken && !comebackChallenge && !todayActive && (
        <div className="relative z-10 mt-3 p-3 rounded-xs border border-red-500/40 bg-red-950/20 flex items-center justify-between gap-3 text-xs font-mono text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>SIGNAL LOST // Streak disrupted. Complete a mission today or initiate Comeback Protocol to recover.</span>
          </div>
        </div>
      )}

      {/* Main Signal HUD Stats Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {/* Current Streak */}
        <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CURRENT STREAK</span>
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-orbitron text-2xl sm:text-3xl font-black tracking-wider text-orange-400">
              {currentStreak.toString().padStart(2, "0")}
            </span>
            <span className="text-xs font-cinzel text-slate-300 font-bold uppercase">
              {currentStreak === 1 ? "DAY" : "DAYS"}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>STATUS:</span>
            <span className="font-bold text-cyan-300">{todayActive ? "SECURED ✓" : "PENDING"}</span>
          </div>
        </div>

        {/* Longest Record */}
        <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>LONGEST STREAK</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-orbitron text-2xl sm:text-3xl font-black tracking-wider text-amber-400">
              {longestStreak.toString().padStart(2, "0")}
            </span>
            <span className="text-xs font-cinzel text-slate-300 font-bold uppercase">
              {longestStreak === 1 ? "DAY" : "DAYS"}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>RECORD:</span>
            <span className="text-slate-300 font-mono font-bold">ALL-TIME BEST</span>
          </div>
        </div>

        {/* Total Active Days */}
        <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>TOTAL ACTIVE</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-orbitron text-2xl sm:text-3xl font-black tracking-wider text-cyan-300">
              {totalActiveDays.toString().padStart(2, "0")}
            </span>
            <span className="text-xs font-cinzel text-slate-300 font-bold uppercase">DAYS</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>SURVIVED:</span>
            <span className="text-cyan-400 font-mono font-bold">RIGHT SIDE</span>
          </div>
        </div>
      </div>

      {/* Signal Resonance Gauge */}
      <div className="relative z-10 mt-4 p-4 rounded-xs bg-slate-900/40 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">SIGNAL STRENGTH:</span>
            <span className="font-bold text-white uppercase">{signal.status}</span>
          </div>
          <span className="font-orbitron font-bold text-cyan-400">
            {signal.strengthPercent}%
          </span>
        </div>

        {/* Segmented Signal Meter Bar */}
        <div className="flex items-center gap-1 w-full h-3">
          {Array.from({ length: 10 }).map((_, i) => {
            const segmentActive = (i + 1) * 10 <= signal.strengthPercent;
            return (
              <div
                key={i}
                className={`flex-1 h-full rounded-2xs transition-all duration-500 ${
                  segmentActive
                    ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    : "bg-slate-800/60"
                }`}
              />
            );
          })}
        </div>

        <p className="text-[11px] font-mono text-slate-300 italic pt-1">
          &ldquo;{signal.description}&rdquo;
        </p>
      </div>

      {/* Next Milestone Countdown Progress */}
      {nextMilestone && (
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">NEXT MILESTONE: </span>
              <span className="text-white font-cinzel font-bold">{nextMilestone.name}</span>
              <span className="text-cyan-400 ml-1">({nextMilestone.days} DAYS)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-36">
              <ProgressBar value={milestoneProgress} max={100} variant="cyan" />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 shrink-0">
              {nextMilestone.remaining} {nextMilestone.remaining === 1 ? "DAY" : "DAYS"} LEFT
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
