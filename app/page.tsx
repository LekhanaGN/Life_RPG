"use client";

import React from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Sparkles, Radio } from "lucide-react";

export default function LandingPage() {
  const { triggerTransition, isTransitioning } = useWorldTransition();

  const handleInvertClick = () => {
    triggerTransition("/right-side", "landing-to-right");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Dynamic Multi-layered Dark Forest Environment */}
      <WorldBackground mode="landing" />

      {/* Top HUD Navigation Bar */}
      <WorldNavigation currentRealm="landing" />

      {/* Main Atmospheric Hero Section */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-4xl mx-auto">
        {/* Subtle 80s Broadcast Frequency Tag */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-red-900/60 bg-red-950/30 text-red-400 text-xs font-mono tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
          <span>DIMENSIONAL ANOMALY DETECTED</span>
        </motion.div>

        {/* Cinematic Main Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative mb-6"
        >
          <h1 className="font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.14em] uppercase neon-glow-red select-none">
            THE OTHER SIDE
          </h1>
          {/* Subtle hollow red outline overlay for 80s typography depth */}
          <div
            aria-hidden="true"
            className="absolute inset-0 font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.14em] uppercase select-none opacity-40 pointer-events-none"
            style={{
              WebkitTextStroke: "2px #ff3344",
              color: "transparent",
            }}
          >
            THE OTHER SIDE
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7 }}
          className="font-cinzel text-lg sm:text-2xl md:text-3xl text-red-200/95 italic tracking-widest mb-8 drop-shadow-[0_0_12px_rgba(255,100,100,0.4)]"
        >
          &ldquo;Your real life has two worlds.&rdquo;
        </motion.blockquote>

        {/* Narrative Description Blocks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="max-w-xl mx-auto space-y-3 font-body text-base sm:text-lg md:text-xl text-slate-300 font-medium tracking-wide mb-12"
        >
          <p className="leading-relaxed">
            <span className="text-cyan-400 font-semibold tracking-wider">
              The Right Side
            </span>{" "}
            is where you grow.
          </p>
          <p className="leading-relaxed">
            <span className="text-red-500 font-semibold tracking-wider">
              The Other Side
            </span>{" "}
            is where everything holding you back comes alive.
          </p>
        </motion.div>

        {/* Main CTA: INVERT THE WORLDS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 1.1 }}
          className="relative group"
        >
          {/* Subtle pulsing background glow ring */}
          <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 opacity-60 blur-md group-hover:opacity-100 transition duration-500 group-hover:blur-lg animate-pulse" />

          <Button
            variant="portal-red"
            size="xl"
            glow
            disabled={isTransitioning}
            onClick={handleInvertClick}
            className="relative px-8 sm:px-12 py-4 text-base sm:text-lg tracking-[0.25em] font-extrabold text-white border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] hover:shadow-[0_0_50px_rgba(239,68,68,1)]"
            aria-label="Invert the worlds and enter the Right Side"
          >
            <Sparkles className="w-5 h-5 mr-2 text-red-300 group-hover:rotate-45 transition-transform" />
            INVERT THE WORLDS
          </Button>
        </motion.div>

        {/* Accessibility & Interaction Hint */}
        <p className="mt-4 text-[11px] font-mono tracking-widest text-slate-400 uppercase">
          [PRESS ENTER OR CLICK TO INITIATE DIMENSIONAL INVERSION]
        </p>
      </main>

      {/* Atmospheric Footer / Silhouettes Anchor */}
      <footer className="relative z-20 py-4 px-6 text-center border-t border-red-950/40 bg-black/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE OTHER SIDE // EXPERIMENTAL LIFE RPG PROTOCOL</div>
          <div className="text-red-500/80">PHASE 1: VISUAL FOUNDATION &amp; WORLD TRANSITIONS</div>
        </div>
      </footer>
    </div>
  );
}
