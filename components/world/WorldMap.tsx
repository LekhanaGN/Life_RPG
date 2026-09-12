"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Crosshair,
  Dumbbell,
  Sparkles,
  Users,
  Compass,
  Lock,
  CheckCircle2,
  AlertOctagon,
  Flame,
} from "lucide-react";
import { WorldAreaKey } from "@/lib/game/world";
import { MissionCategory } from "@/lib/db/client";

export interface AreaProgressView {
  id: string;
  areaKey: string;
  name: string;
  subtitle: string;
  description: string;
  requiredCorruption: number;
  accentColor: string;
  category: MissionCategory | null;
  isUnlocked: boolean;
  restorationPercent: number;
  status: "LOCKED" | "CORRUPTED" | "RECLAIMING" | "RESTORED";
}

export interface WorldMapProps {
  areas: AreaProgressView[];
  corruption: number;
  highlightedArea?: string | null;
  className?: string;
}

export function WorldMap({
  areas,
  corruption,
  highlightedArea,
  className = "",
}: WorldMapProps) {
  const getCategoryIcon = (cat: MissionCategory | null, key: string) => {
    if (key === "THE_GATE") {
      return <Compass className="w-4 h-4 text-cyan-400" />;
    }
    switch (cat) {
      case "MIND":
        return <Brain className="w-4 h-4 text-blue-400" />;
      case "FOCUS":
        return <Crosshair className="w-4 h-4 text-amber-400" />;
      case "BODY":
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case "SPIRIT":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case "CONNECTION":
        return <Users className="w-4 h-4 text-rose-400" />;
      default:
        return <Compass className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div
      className={`relative rounded-xs bg-slate-950/70 border border-slate-800 p-5 sm:p-6 backdrop-blur-md ${className}`}
      role="region"
      aria-label="World Area Exploration Map"
    >
      {/* Corner HUD accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xs bg-slate-900 border border-slate-700 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-cinzel font-bold tracking-widest uppercase">
                YOUR WORLDS
              </h3>
              <span className="px-2 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold">
                {areas.filter((a) => a.isUnlocked).length} / {areas.length} UNLOCKED
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Complete more missions to unlock new areas.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 self-start sm:self-center">
          <span>WORLD CORRUPTION: </span>
          <span className="text-red-400 font-bold font-orbitron">{corruption}%</span>
        </div>
      </div>

      {/* Grid of Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
        {areas.map((area, idx) => {
          const isHighlighted = highlightedArea === area.areaKey;
          const isUnlocked = area.isUnlocked;
          const isRestored = area.status === "RESTORED";
          const isReclaiming = area.status === "RECLAIMING";

          let statusBadgeText = "NEEDS MISSIONS";
          let statusBadgeClass = "border-red-900/60 bg-red-950/40 text-red-400";

          if (!isUnlocked) {
            statusBadgeText = `LOCKED (REDUCE CORRUPTION TO ${area.requiredCorruption}%)`;
            statusBadgeClass = "border-slate-800 bg-slate-900/60 text-slate-500";
          } else if (isRestored) {
            statusBadgeText = "RESTORED (100%)";
            statusBadgeClass = "border-emerald-500/50 bg-emerald-950/50 text-emerald-300";
          } else if (isReclaiming) {
            statusBadgeText = `IN PROGRESS (${area.restorationPercent}%)`;
            statusBadgeClass = "border-cyan-500/50 bg-cyan-950/50 text-cyan-300";
          }

          return (
            <motion.div
              key={area.areaKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isHighlighted ? 1.03 : 1,
              }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`relative rounded-xs border p-4 transition-all duration-300 flex flex-col justify-between ${
                isHighlighted
                  ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400"
                  : !isUnlocked
                  ? "border-slate-800/80 bg-slate-950/40 opacity-70"
                  : isRestored
                  ? "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-xs border ${
                        !isUnlocked
                          ? "border-slate-800 bg-slate-900 text-slate-600"
                          : isRestored
                          ? "border-emerald-500/50 bg-emerald-950/60"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {getCategoryIcon(area.category, area.areaKey)}
                    </div>
                    <div>
                      <h4
                        className={`font-cinzel text-sm font-bold tracking-wider ${
                          !isUnlocked
                            ? "text-slate-400"
                            : isRestored
                            ? "text-emerald-300"
                            : "text-white"
                        }`}
                      >
                        {area.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {area.subtitle}
                      </p>
                    </div>
                  </div>

                  {!isUnlocked ? (
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : isRestored ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isReclaiming ? (
                    <Flame className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                  ) : (
                    <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] font-mono text-slate-400 line-clamp-2 leading-relaxed mt-2">
                  {area.description}
                </p>
              </div>

              {/* Card Bottom / Restoration Bar */}
              <div className="pt-4 mt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded-[2px] font-bold border uppercase ${statusBadgeClass}`}
                  >
                    {statusBadgeText}
                  </span>
                  {area.category && (
                    <span className="text-slate-400 font-semibold">
                      +{area.category}
                    </span>
                  )}
                </div>

                {isUnlocked && (
                  <div className="w-full bg-slate-900 h-2 rounded-xs overflow-hidden border border-slate-800">
                    <motion.div
                      className={`h-full ${
                        isRestored
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                          : "bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${area.restorationPercent}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
