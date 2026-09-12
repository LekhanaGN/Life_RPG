"use client";

import React from "react";
import { Brain, Dumbbell, Target, Sparkles, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttributeItem {
  id: string;
  name: string;
  description: string;
  value: number; // 0 to 10
  maxValue: number;
  icon: React.ElementType;
  color: string;
  glow: string;
}

const ATTRIBUTES: AttributeItem[] = [
  {
    id: "mind",
    name: "MIND",
    description: "Knowledge, clarity & study",
    value: 2,
    maxValue: 10,
    icon: Brain,
    color: "text-blue-400 border-blue-500/50 bg-blue-500",
    glow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
  },
  {
    id: "body",
    name: "BODY",
    description: "Physical stamina & vitality",
    value: 3,
    maxValue: 10,
    icon: Dumbbell,
    color: "text-emerald-400 border-emerald-500/50 bg-emerald-500",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
  {
    id: "focus",
    name: "FOCUS",
    description: "Deep work & cognitive flow",
    value: 1,
    maxValue: 10,
    icon: Target,
    color: "text-cyan-400 border-cyan-500/50 bg-cyan-500",
    glow: "shadow-[0_0_8px_rgba(6,182,212,0.6)]",
  },
  {
    id: "spirit",
    name: "SPIRIT",
    description: "Inner resilience & purpose",
    value: 2,
    maxValue: 10,
    icon: Sparkles,
    color: "text-amber-400 border-amber-500/50 bg-amber-500",
    glow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  {
    id: "connection",
    name: "CONNECTION",
    description: "Relationships & bonds",
    value: 2,
    maxValue: 10,
    icon: HeartHandshake,
    color: "text-purple-400 border-purple-500/50 bg-purple-500",
    glow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]",
  },
];

export function AttributeBar({ corrupted = false }: { corrupted?: boolean }) {
  return (
    <div className="space-y-3">
      {ATTRIBUTES.map((attr) => {
        const Icon = attr.icon;
        return (
          <div
            key={attr.id}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xs border transition-colors",
              corrupted
                ? "bg-red-950/20 border-red-900/30 hover:border-red-600/40"
                : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
            )}
          >
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              <div
                className={cn(
                  "p-1.5 rounded-xs border",
                  corrupted
                    ? "border-red-800/60 bg-red-950/40 text-red-400"
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
              {Array.from({ length: attr.maxValue }).map((_, idx) => {
                const filled = idx < attr.value;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "w-2.5 h-4 rounded-xs border transition-all duration-300",
                      filled
                        ? corrupted
                          ? "bg-red-600 border-red-400 shadow-[0_0_6px_#ef4444]"
                          : `${attr.color} ${attr.glow}`
                        : "bg-black/50 border-slate-800"
                    )}
                  />
                );
              })}
              <span className="ml-2 font-mono text-xs font-bold text-slate-400 min-w-[28px] text-right">
                {attr.value}/{attr.maxValue}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
