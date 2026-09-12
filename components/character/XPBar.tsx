"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { getLevelFromXP } from "@/lib/game/leveling";

export interface XPBarProps {
  currentXp?: number;
  maxXp?: number;
  level?: number;
  totalXp?: number;
}

export function XPBar({
  currentXp = 0,
  maxXp = 100,
  level = 1,
  totalXp,
}: XPBarProps) {
  // If totalXp is provided or currentXp is totalXP, derive mathematically
  const progression = useMemo(() => {
    const rawXP = totalXp !== undefined ? totalXp : currentXp;
    return getLevelFromXP(rawXP);
  }, [totalXp, currentXp]);

  const displayLevel = progression.level || level;
  const currentInLevel = progression.currentLevelXP;
  const spanMax = progression.nextLevelXP || maxXp || 100;
  const percentage = progression.progressPercent;

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-xs space-y-2.5 backdrop-blur-xs">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20 animate-pulse" />
          <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
            EXPERIENCE PROGRESSION
          </span>
        </div>
        <div className="text-xs text-cyan-300 font-bold font-orbitron tracking-widest">
          LVL {String(displayLevel).padStart(2, "0")}
        </div>
      </div>

      {/* Animated Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative w-full h-3.5 bg-black/70 border border-slate-800 rounded-xs overflow-hidden">
          {/* Animated Fill Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
          />

          {/* Segment Tick Overlays */}
          <div className="absolute inset-0 grid grid-cols-10 pointer-events-none divide-x divide-black/40">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-full" />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="text-cyan-300 font-bold">
            {currentInLevel} / {spanMax} XP
          </span>
          <span className="text-slate-400">
            {percentage}% TO LEVEL {String(displayLevel + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
