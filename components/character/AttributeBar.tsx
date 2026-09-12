"use client";

import React from "react";
import { Brain, Dumbbell, Target, Sparkles, HeartHandshake } from "lucide-react";
import { DbCharacter } from "@/lib/db/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface AttributeStats {
  mind: number;
  body: number;
  focus: number;
  spirit: number;
  connection: number;
}

export interface AttributeBarProps {
  corrupted?: boolean;
  stats?: AttributeStats;
  character?: DbCharacter | null;
  highlightedAttribute?: string | null;
}

export function AttributeBar({
  corrupted = false,
  stats,
  character,
  highlightedAttribute,
}: AttributeBarProps) {
  const resolvedStats: AttributeStats = {
    mind: character?.mind ?? stats?.mind ?? 10,
    body: character?.body ?? stats?.body ?? 10,
    focus: character?.focus ?? stats?.focus ?? 10,
    spirit: character?.spirit ?? stats?.spirit ?? 10,
    connection: character?.connection ?? stats?.connection ?? 10,
  };

  const attributesList = [
    {
      id: "mind",
      name: "MIND",
      description: "Knowledge, clarity & study",
      value: resolvedStats.mind,
      maxValue: 25,
      icon: Brain,
      color: "text-blue-400 border-blue-500/50 bg-blue-500",
      glow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    },
    {
      id: "body",
      name: "BODY",
      description: "Physical stamina & vitality",
      value: resolvedStats.body,
      maxValue: 25,
      icon: Dumbbell,
      color: "text-emerald-400 border-emerald-500/50 bg-emerald-500",
      glow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    },
    {
      id: "focus",
      name: "FOCUS",
      description: "Deep work & cognitive flow",
      value: resolvedStats.focus,
      maxValue: 25,
      icon: Target,
      color: "text-cyan-400 border-cyan-500/50 bg-cyan-500",
      glow: "shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    },
    {
      id: "spirit",
      name: "SPIRIT",
      description: "Inner resilience & purpose",
      value: resolvedStats.spirit,
      maxValue: 25,
      icon: Sparkles,
      color: "text-amber-400 border-amber-500/50 bg-amber-500",
      glow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    },
    {
      id: "connection",
      name: "CONNECTION",
      description: "Relationships & bonds",
      value: resolvedStats.connection,
      maxValue: 25,
      icon: HeartHandshake,
      color: "text-purple-400 border-purple-500/50 bg-purple-500",
      glow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    },
  ];

  return (
    <div className="space-y-3">
      {attributesList.map((attr) => {
        const Icon = attr.icon;
        const isHighlighted =
          highlightedAttribute?.toLowerCase() === attr.id.toLowerCase();
        // Segment scale (visual representation across 10 segment blocks)
        const segmentCount = 10;
        const activeSegments = Math.min(
          segmentCount,
          Math.max(1, Math.round((attr.value / attr.maxValue) * segmentCount))
        );

        return (
          <motion.div
            key={attr.id}
            animate={
              isHighlighted
                ? {
                    scale: [1, 1.03, 1],
                    borderColor: ["#06b6d4", "#22d3ee", "#334155"],
                  }
                : {}
            }
            transition={{ duration: 0.8 }}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xs border transition-all",
              corrupted
                ? "bg-red-950/20 border-red-900/30 hover:border-red-600/40"
                : isHighlighted
                ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
            )}
          >
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <div
                className={cn(
                  "p-1.5 rounded-xs border transition-colors",
                  corrupted
                    ? "border-red-800/60 bg-red-950/40 text-red-400"
                    : isHighlighted
                    ? "border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    : "border-slate-700/60 bg-slate-900/60 text-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-xs font-bold tracking-wider text-slate-200">
                    {attr.name}
                  </span>
                  {isHighlighted && (
                    <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-widest animate-pulse">
                      [BOOSTED]
                    </span>
                  )}
                  {corrupted && (
                    <span className="text-[10px] font-mono text-red-500 font-semibold tracking-tighter">
                      [DRAINED]
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  {attr.description}
                </p>
              </div>
            </div>

            {/* Segmented LED stat meters */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {Array.from({ length: segmentCount }).map((_, idx) => {
                const filled = idx < activeSegments;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-2.5 h-4 rounded-xs border transition-all duration-300",
                      filled
                        ? corrupted
                          ? "bg-red-600 border-red-400 shadow-[0_0_6px_#ef4444]"
                          : isHighlighted
                          ? "bg-cyan-400 border-cyan-200 shadow-[0_0_8px_#22d3ee]"
                          : `${attr.color} ${attr.glow}`
                        : "bg-black/50 border-slate-800"
                    )}
                  />
                );
              })}
              <span className="ml-2 font-mono text-xs font-bold text-slate-200 min-w-[32px] text-right font-orbitron">
                {attr.value}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
