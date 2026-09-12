"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Radio } from "lucide-react";

export interface WorldIntegrityMeterProps {
  corruption: number; // 0 (fully restored) to 100 (fully corrupted)
  className?: string;
}

export function WorldIntegrityMeter({
  corruption,
  className = "",
}: WorldIntegrityMeterProps) {
  const safeCorruption = Math.min(100, Math.max(0, Math.round(corruption)));
  const integrityPercent = Math.min(100, Math.max(0, 100 - safeCorruption));

  // Determine threat severity level
  let statusText = "SECURE";
  let statusColor = "text-emerald-400";
  let badgeBorder = "border-emerald-500/50 bg-emerald-950/40 text-emerald-300";

  if (safeCorruption > 75) {
    statusText = "CRITICAL CORRUPTION";
    statusColor = "text-red-400";
    badgeBorder = "border-red-500/50 bg-red-950/40 text-red-300";
  } else if (safeCorruption > 45) {
    statusText = "DIMENSIONAL INSTABILITY";
    statusColor = "text-amber-400";
    badgeBorder = "border-amber-500/50 bg-amber-950/40 text-amber-300";
  } else if (safeCorruption > 20) {
    statusText = "RESTORATION IN PROGRESS";
    statusColor = "text-cyan-400";
    badgeBorder = "border-cyan-500/50 bg-cyan-950/40 text-cyan-300";
  }

  // 20 segments for the HUD bar
  const totalSegments = 20;
  const filledSegments = Math.round((integrityPercent / 100) * totalSegments);

  return (
    <div
      className={`relative rounded-xs bg-slate-950/80 border border-slate-800 p-4 backdrop-blur-md ${className}`}
      role="region"
      aria-label="World Stability and Corruption Telemetry"
    >
      {/* Corner HUD accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/60 pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xs bg-slate-900 border border-slate-700 text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs font-bold tracking-widest text-white uppercase">
                DIMENSIONAL INTEGRITY
              </span>
              <span
                className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase border ${badgeBorder}`}
              >
                {statusText}
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Sanctuary barrier resonance holding back The Other Side.
            </p>
          </div>
        </div>

        {/* Telemetry Metric Values */}
        <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-center">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">SANCTUARY PURITY</div>
            <div className="text-sm font-orbitron font-extrabold text-cyan-300">
              {integrityPercent}%
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-red-400/80 uppercase">CORRUPTION</div>
            <div className="text-sm font-orbitron font-extrabold text-red-400">
              {safeCorruption}%
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Sci-Fi Progress Bar */}
      <div className="pt-3 space-y-2">
        <div
          className="relative h-4 rounded-xs bg-slate-900/90 border border-slate-800 p-0.5 flex gap-1 items-center overflow-hidden"
          role="progressbar"
          aria-valuenow={integrityPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`World integrity is ${integrityPercent} percent, corruption is ${safeCorruption} percent`}
        >
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const isFilled = idx < filledSegments;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scaleY: 0.5 }}
                animate={{
                  opacity: 1,
                  scaleY: 1,
                }}
                transition={{ duration: 0.3, delay: idx * 0.015 }}
                className={`flex-1 h-full rounded-[1px] transition-colors duration-500 ${
                  isFilled
                    ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    : "bg-red-950/40 border-t border-red-900/30"
                }`}
              />
            );
          })}
        </div>

        {/* Sub-label bar description */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>0% (TOTAL CORRUPTION)</span>
          </span>
          <span className="text-cyan-300 font-semibold">
            {safeCorruption === 0
              ? "WORLD FULLY RESTORED"
              : `CLEAR MISSIONS TO WEAKEN THE OTHER SIDE (-2% TO -10%)`}
          </span>
          <span className="flex items-center gap-1">
            <span>100% (FULL SANCTUARY)</span>
            <AlertTriangle className="w-3 h-3 text-red-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
