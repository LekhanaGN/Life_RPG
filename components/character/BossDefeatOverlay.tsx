"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Sparkles, AlertTriangle, ShieldCheck, Flame } from "lucide-react";
import { soundscape } from "@/lib/audio/soundscape";

export interface BossDefeatData {
  bossName: string;
  bossTitle: string;
  nextBossName?: string | null;
  corruptionDrop?: number;
  bonusXp?: number;
}

export interface BossDefeatOverlayProps {
  data: BossDefeatData | null;
  onDismiss: () => void;
}

export function BossDefeatOverlay({ data, onDismiss }: BossDefeatOverlayProps) {
  useEffect(() => {
    if (!data) return;

    // Play triumphant synth fanfare
    soundscape.playRestoration();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="boss-defeat-title"
        aria-describedby="boss-defeat-desc"
      >
        {/* Screen Reader Announcement */}
        <div className="sr-only" aria-live="assertive">
          Dimensional Threat Neutralized! {data.bossName} has been banished from The Other Side.
          {data.nextBossName && ` New entity detected: ${data.nextBossName}.`}
        </div>

        {/* Ambient CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Main Modal Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative max-w-lg w-full rounded-xs bg-slate-950 border-2 border-emerald-500/80 p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.5)] overflow-hidden"
        >
          {/* Top Corner HUD Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

          {/* Icon Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.8)]"
          >
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
          </motion.div>

          {/* Titles */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>DIMENSIONAL THREAT BANISHED</span>
            </div>

            <h2
              id="boss-defeat-title"
              className="text-2xl sm:text-4xl font-cinzel font-black text-white tracking-widest uppercase neon-glow-emerald"
            >
              {data.bossName}
            </h2>

            <p id="boss-defeat-desc" className="text-xs font-mono text-emerald-300/80 italic">
              {data.bossTitle} has been purged from the parallel reality.
            </p>
          </div>

          {/* Reward Breakdown Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xs bg-slate-900/80 border border-emerald-500/40 text-left">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                CORRUPTION COLLAPSE
              </div>
              <div className="text-base sm:text-lg font-orbitron font-extrabold text-emerald-400 mt-0.5">
                -{data.corruptionDrop || 10}% CORRUPTION
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Dimensional pressure relieved.
              </p>
            </div>

            <div className="p-3 rounded-xs bg-slate-900/80 border border-cyan-500/40 text-left">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                BANISHMENT ENERGY
              </div>
              <div className="text-base sm:text-lg font-orbitron font-extrabold text-cyan-300 mt-0.5">
                +{data.bonusXp || 200} BONUS XP
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Transmuted from dark void essence.
              </p>
            </div>
          </div>

          {/* Next Boss Notification */}
          {data.nextBossName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 rounded-xs bg-red-950/40 border border-red-600/50 text-left flex items-start gap-2.5"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <div className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  NEW ENTITY AWAKENED IN THE OTHER SIDE
                </div>
                <div className="text-sm font-cinzel font-bold text-red-200 mt-0.5">
                  {data.nextBossName}
                </div>
                <p className="text-[11px] font-mono text-red-300/80 mt-0.5">
                  A stronger anomaly has filled the dimensional vacuum. Execute missions to challenge it.
                </p>
              </div>
            </motion.div>
          )}

          {/* Dismiss CTA */}
          <div className="pt-2">
            <button
              onClick={onDismiss}
              className="w-full py-3 rounded-xs bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-cinzel font-black text-sm tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] cursor-pointer"
            >
              CONTINUE WORLD RESTORATION [ENTER / ESC]
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
