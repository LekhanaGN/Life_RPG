"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Radio, Award, Shield, Flame, Zap, Compass, Activity, X } from "lucide-react";
import { soundscape } from "@/lib/audio/soundscape";
import { MilestoneDefinition } from "@/lib/game/streakRewards";

export interface MilestoneUnlockOverlayProps {
  milestone: MilestoneDefinition | null;
  onDismiss: () => void;
}

export function MilestoneUnlockOverlay({
  milestone,
  onDismiss,
}: MilestoneUnlockOverlayProps) {
  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Play audio sound cue on appearance
  useEffect(() => {
    if (milestone) {
      soundscape.playRestoration();
    }
  }, [milestone]);

  const getMilestoneIcon = (iconName: string) => {
    switch (iconName) {
      case "Radio":
        return <Radio className="w-10 h-10 text-cyan-400" />;
      case "Sparkles":
        return <Sparkles className="w-10 h-10 text-cyan-300" />;
      case "ShieldAlert":
        return <Shield className="w-10 h-10 text-blue-400" />;
      case "Flame":
        return <Flame className="w-10 h-10 text-orange-400" />;
      case "Zap":
        return <Zap className="w-10 h-10 text-yellow-400" />;
      case "Activity":
        return <Activity className="w-10 h-10 text-emerald-400" />;
      case "Compass":
        return <Compass className="w-10 h-10 text-purple-400" />;
      default:
        return <Award className="w-10 h-10 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      {milestone && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="milestone-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop with dimensional blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.4 }}
            onClick={onDismiss}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.85, y: 20 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.9, y: 15 }
            }
            transition={{ duration: prefersReducedMotion ? 0.3 : 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-md w-full rounded-xs bg-slate-950 border-2 border-cyan-400/80 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.5)] overflow-hidden text-center"
          >
            {/* Cyan Scanning Ray Ambient Glow */}
            {!prefersReducedMotion && (
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{ repeat: Infinity, duration: 2.2 }}
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
              />
            )}

            {/* Corner Tech Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

            {/* Close button */}
            <button
              onClick={onDismiss}
              aria-label="Dismiss discovery notification"
              className="absolute top-3 right-3 p-1 rounded-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sub-header Banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>NEW DISCOVERY UNLOCKED</span>
            </div>

            {/* Milestone Icon Emblem */}
            <div className="mx-auto my-3 w-20 h-20 rounded-xs bg-cyan-950/40 border-2 border-cyan-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              {getMilestoneIcon(milestone.icon)}
            </div>

            {/* Milestone Name */}
            <h2
              id="milestone-title"
              className="font-cinzel text-2xl sm:text-3xl font-black tracking-widest text-white neon-glow-cyan uppercase mt-2"
            >
              {milestone.name}
            </h2>

            {/* Requirement / Milestone Type */}
            <div className="font-mono text-xs font-bold text-cyan-400/90 uppercase tracking-widest mt-1">
              {milestone.requirementType === "STREAK"
                ? `${milestone.requirementValue} DAY SURVIVAL STREAK`
                : `${milestone.requirementValue} ACTIVE SURVIVAL DAY`}
            </div>

            {/* Lore Quote */}
            {milestone.loreQuote && (
              <p className="font-cinzel text-sm sm:text-base text-cyan-100/90 italic tracking-wide mt-4 px-2">
                &ldquo;{milestone.loreQuote}&rdquo;
              </p>
            )}

            {/* Rewards Callout */}
            <div className="mt-6 pt-4 border-t border-cyan-900/60 flex items-center justify-center gap-4">
              {milestone.rewardCredits > 0 && (
                <div className="px-3 py-1.5 rounded-xs bg-amber-950/50 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <span>◈</span>
                  <span>+{milestone.rewardCredits} CREDITS</span>
                </div>
              )}
              {milestone.rewardXP > 0 && (
                <div className="px-3 py-1.5 rounded-xs bg-cyan-950/50 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>+{milestone.rewardXP} XP</span>
                </div>
              )}
            </div>

            {/* Confirm / Continue Button */}
            <button
              onClick={onDismiss}
              className="mt-6 w-full py-2.5 rounded-xs bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-cinzel font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              ACKNOWLEDGE SIGNAL
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
