"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Award, Sparkles, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DbUserLoreUnlock } from "@/lib/db/client";

export interface AnomalyContainedData {
  title: string;
  key: string;
  rewardCredits: number;
  rewardXp: number;
  corruptionReduced?: number;
  bossDamageDealt?: number;
  loreUnlocked?: DbUserLoreUnlock | null;
}

interface AnomalyContainedOverlayProps {
  data: AnomalyContainedData | null;
  onDismiss: () => void;
}

export function AnomalyContainedOverlay({
  data,
  onDismiss,
}: AnomalyContainedOverlayProps) {
  // Synthesize short retro audio chime
  useEffect(() => {
    if (!data) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio playback might be restricted without prior user interaction
    }
  }, [data]);

  if (!data) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Anomaly Contained Notification"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-xs bg-slate-950 border-2 border-purple-500/80 p-6 sm:p-7 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center overflow-hidden"
        >
          {/* CRT Scanline and Tech Corners */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400 pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative z-10 mx-auto mb-4 w-14 h-14 rounded-full bg-purple-950/80 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.6)]">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>

          <div className="relative z-10 text-[11px] font-mono tracking-widest text-purple-400 font-bold uppercase mb-1">
            ANOMALY CONTAINED
          </div>

          <h2 className="relative z-10 text-2xl font-cinzel font-black tracking-widest text-white uppercase mb-2">
            {data.title}
          </h2>

          <p className="relative z-10 text-xs font-mono text-slate-300 mb-5 italic">
            &ldquo;The boundary has stabilized. The Other Side retreats.&rdquo;
          </p>

          {/* Reward Grants */}
          <div className="relative z-10 grid grid-cols-2 gap-2.5 p-3 rounded-xs bg-slate-900/80 border border-purple-900/50 mb-4 text-xs font-mono">
            <div className="flex flex-col items-center justify-center p-2 rounded-xs bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400">CREDITS</span>
              <span className="font-bold text-amber-400 text-sm">+{data.rewardCredits}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xs bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400">XP</span>
              <span className="font-bold text-cyan-400 text-sm">+{data.rewardXp}</span>
            </div>
            {(data.corruptionReduced || 0) > 0 && (
              <div className="col-span-2 flex items-center justify-center gap-2 p-1.5 rounded-xs bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span>VOID PURGED: -{data.corruptionReduced}%</span>
              </div>
            )}
            {(data.bossDamageDealt || 0) > 0 && (
              <div className="col-span-2 flex items-center justify-center gap-2 p-1.5 rounded-xs bg-red-950/30 border border-red-500/30 text-red-400 text-[11px] font-bold">
                <span>DIRECT BOSS STRIKE: +{data.bossDamageDealt} DMG</span>
              </div>
            )}
          </div>

          {/* Unlocked Lore Log (if discovered) */}
          {data.loreUnlocked && (
            <div className="relative z-10 mb-5 p-3 rounded-xs bg-slate-900/90 border border-cyan-500/40 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>LORE DISCOVERED // {data.loreUnlocked.title}</span>
              </div>
              <p className="text-xs font-serif italic text-slate-300 leading-relaxed">
                &ldquo;{data.loreUnlocked.content}&rdquo;
              </p>
            </div>
          )}

          {/* Confirm Button */}
          <div className="relative z-10">
            <Button
              variant="arcade"
              size="lg"
              onClick={onDismiss}
              className="w-full font-cinzel tracking-widest uppercase font-bold text-purple-200 border-purple-500 bg-purple-950/80 hover:bg-purple-900 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            >
              <Check className="w-4 h-4 mr-2" />
              CONFIRM CONTAINMENT
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
