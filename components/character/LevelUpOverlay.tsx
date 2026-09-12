"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles, Trophy, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { soundscape } from "@/lib/audio/soundscape";

export interface LevelUpData {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  characterName?: string;
  archetype?: string;
}

export interface LevelUpOverlayProps {
  data: LevelUpData | null;
  onDismiss: () => void;
}

export function LevelUpOverlay({ data, onDismiss }: LevelUpOverlayProps) {
  useEffect(() => {
    if (data) {
      soundscape.playRestoration();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Enter") {
          onDismiss();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      >
        {/* Particle Glow Radial Aura */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.8 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-96 h-96 rounded-full bg-radial from-cyan-500/30 via-red-500/20 to-transparent blur-3xl pointer-events-none"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-lg p-6 sm:p-8 rounded-xs border-2 border-cyan-400 bg-slate-950/95 text-center space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.4)]"
        >
          {/* Decorative Corner Brackets */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

          {/* Icon Header */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-xs border-2 border-cyan-400 bg-cyan-950/70 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.7)] animate-pulse">
                <Trophy className="w-8 h-8 text-cyan-300" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-spin" />
            </div>
          </div>

          {/* Title & Announcement */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-cyan-500/50 bg-cyan-950/40 text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
              <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              <span>LEVEL UP REWARD</span>
            </div>

            <h2
              id="level-up-title"
              className="font-cinzel text-3xl sm:text-5xl font-black tracking-[0.16em] uppercase text-white neon-glow-cyan"
            >
              LEVEL UP!
            </h2>
            <p className="font-mono text-xs text-slate-300 tracking-wider">
              {data.characterName ? `${data.characterName} has ` : "You have "}
              reached a new level. Keep completing missions to unlock more rewards.
            </p>
          </div>

          {/* Level Transition Graphic */}
          <div className="p-4 rounded-xs bg-slate-900/80 border border-slate-700/80 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase text-slate-400">PREVIOUS</div>
              <div className="font-orbitron text-2xl sm:text-3xl font-bold text-slate-400">
                LVL {String(data.previousLevel).padStart(2, "0")}
              </div>
            </div>

            <div className="p-2 rounded-full bg-cyan-950/60 border border-cyan-500/60 text-cyan-400">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>

            <div className="text-center">
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                NEW LEVEL
              </div>
              <div className="font-orbitron text-3xl sm:text-4xl font-extrabold text-cyan-200 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                LVL {String(data.newLevel).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Rewards Highlights */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xs text-xs font-mono text-cyan-200/90 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>BONUS CREDITS EARNED • REWARDS UNLOCKED</span>
          </div>

          {/* Dismiss Action */}
          <div className="pt-2">
            <Button
              id="level-up-dismiss-btn"
              variant="portal-cyan"
              size="lg"
              glow
              onClick={onDismiss}
              className="w-full tracking-[0.2em] font-extrabold text-white uppercase border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.9)]"
            >
              CONTINUE
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
