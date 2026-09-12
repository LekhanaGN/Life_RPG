"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Radio,
  Clock,
  Award,
  Zap,
  Archive,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EventRarity } from "@/lib/game/worldEvents";

export interface ActiveAnomalyData {
  id: string;
  key: string;
  title: string;
  description: string;
  loreSnippet: string;
  targetAttribute: string;
  targetArea?: string | null;
  progress: number;
  requiredProgress: number;
  completed: boolean;
  rewardClaimed: boolean;
  status: string;
  startsAt: string | Date;
  expiresAt: string | Date;
  timeRemainingMs?: number;
  formattedTimeRemaining?: string;
  rewards: {
    credits: number;
    xp: number;
    corruptionReduction: number;
    bossDamage: number;
    rarity: EventRarity;
  };
  visualEffect: {
    ambientColor: string;
    hudBadgeClass: string;
    description: string;
    distortionStyle: string;
  };
}

interface ActiveAnomalyHUDProps {
  event: ActiveAnomalyData | null;
  onOpenArchive?: () => void;
}

export function ActiveAnomalyHUD({ event, onOpenArchive }: ActiveAnomalyHUDProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    if (!event) return "00:00:00";
    return event.formattedTimeRemaining || "00:00:00";
  });

  // Client-side timer computation from server expiresAt
  useEffect(() => {
    if (!event || event.completed) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(event.expiresAt).getTime();
      const diff = Math.max(0, expires - now);

      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setTimeRemaining(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  if (!event || event.status !== "ACTIVE" || event.completed) {
    return (
      <div
        role="region"
        aria-label="Active Anomaly Status"
        className="w-full rounded-xs bg-slate-950/60 border border-slate-800/80 p-4 backdrop-blur-xs flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xs bg-slate-900 border border-slate-800 text-slate-500">
            <Radio className="w-4 h-4 opacity-50" />
          </div>
          <div>
            <div className="text-xs font-cinzel font-bold tracking-wider text-slate-300">
              ATMOSPHERIC SCANNER
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              No active anomalies detected in this frequency band.
            </div>
          </div>
        </div>

        {onOpenArchive && (
          <button
            type="button"
            onClick={onOpenArchive}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium rounded-xs border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-cyan-400" />
            <span>ARCHIVE</span>
          </button>
        )}
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((event.progress / event.requiredProgress) * 100)
  );

  return (
    <div
      role="region"
      aria-label={`Active World Event: ${event.title}`}
      className="relative w-full rounded-xs bg-slate-950/85 border border-purple-900/50 p-4 sm:p-5 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden"
    >
      {/* Background Frequency Grid & Tech Corner Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-purple-400 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-purple-400 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-purple-400 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-purple-400 pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-purple-950/60 border border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">
                ANOMALY DETECTED
              </span>
              {event.rewards.rarity !== "COMMON" && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs border border-amber-500/60 text-amber-300 bg-amber-950/40 uppercase">
                  {event.rewards.rarity}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-cinzel font-black tracking-widest text-white uppercase">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Live Expiration Countdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="tabular-nums font-bold tracking-wider">{timeRemaining}</span>
          </div>

          {onOpenArchive && (
            <button
              type="button"
              onClick={onOpenArchive}
              title="View past contained and faded anomalies"
              className="p-1.5 rounded-xs bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Atmospheric Lore Snippet */}
      <div className="relative z-10 my-3 text-xs italic font-serif text-slate-300/90 bg-purple-950/20 border-l-2 border-purple-500/60 px-3 py-1.5 rounded-r-xs">
        &ldquo;{event.loreSnippet}&rdquo;
      </div>

      {/* Mission Requirement & Progression Metric */}
      <div className="relative z-10 space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">TARGET:</span>
            <Badge
              variant={event.targetAttribute === "ANY" ? "amber" : "purple"}
              className="text-[10px] font-bold"
            >
              {event.targetAttribute === "ANY"
                ? "ANY DISCIPLINE"
                : `${event.targetAttribute} MISSIONS`}
            </Badge>
          </div>
          <div className="font-bold tabular-nums text-purple-300">
            {event.progress} / {event.requiredProgress} REQUIRED
          </div>
        </div>

        {/* Progress Bar with glowing neon tint */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          />
        </div>
      </div>

      {/* Reward Preview Bar */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <span className="text-slate-400">CONTAINMENT YIELD:</span>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded-xs border border-amber-500/30">
            +{event.rewards.credits} CREDITS
          </span>
          <span className="text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded-xs border border-cyan-500/30">
            +{event.rewards.xp} XP
          </span>
          {event.rewards.corruptionReduction > 0 && (
            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-xs border border-emerald-500/30">
              -{event.rewards.corruptionReduction}% VOID
            </span>
          )}
          {event.rewards.bossDamage > 0 && (
            <span className="text-red-400 font-bold bg-red-950/40 px-2 py-0.5 rounded-xs border border-red-500/30">
              +{event.rewards.bossDamage} BOSS DMG
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
