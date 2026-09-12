"use client";

import React from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Zap } from "lucide-react";

export interface XPBarProps {
  currentXp?: number;
  maxXp?: number;
  level?: number;
}

export function XPBar({ currentXp = 0, maxXp = 100, level = 1 }: XPBarProps) {
  return (
    <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-sm space-y-2.5">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
            EXPERIENCE PROGRESSION
          </span>
        </div>
        <div className="text-xs text-cyan-400 font-bold tracking-widest">
          LVL {String(level).padStart(2, "0")}
        </div>
      </div>

      <ProgressBar
        value={currentXp}
        max={maxXp}
        variant="cyan"
        segmented
        label={`XP ${currentXp} / ${maxXp}`}
        sublabel="NEXT RANK: AWAKENED"
      />
    </div>
  );
}
