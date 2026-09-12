"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: "cyan" | "crimson" | "amber" | "purple";
  showPercentage?: boolean;
  segmented?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  sublabel,
  variant = "cyan",
  showPercentage = true,
  segmented = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    cyan: {
      bar: "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]",
      track: "border-cyan-900/40 bg-cyan-950/20",
      text: "text-cyan-400",
    },
    crimson: {
      bar: "bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)]",
      track: "border-red-900/60 bg-red-950/30",
      text: "text-red-400",
    },
    amber: {
      bar: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
      track: "border-amber-900/40 bg-amber-950/20",
      text: "text-amber-400",
    },
    purple: {
      bar: "bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]",
      track: "border-purple-900/40 bg-purple-950/20",
      text: "text-purple-400",
    },
  };

  const style = variantColors[variant];

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showPercentage || sublabel) && (
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            {label && <span className="font-semibold text-slate-300">{label}</span>}
            {sublabel && <span className="text-slate-500 text-[10px]">{sublabel}</span>}
          </div>
          {showPercentage && (
            <span className={cn("font-bold", style.text)}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div
        className={cn(
          "relative h-3 w-full overflow-hidden border p-[2px]",
          style.track
        )}
      >
        <motion.div
          className={cn("h-full transition-all", style.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Optional Segmented Overlay */}
        {segmented && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 8px, #000 8px, #000 11px)",
            }}
          />
        )}
      </div>
    </div>
  );
}
