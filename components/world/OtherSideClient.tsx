"use client";

import React from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { AttributeBar } from "@/components/character/AttributeBar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DbCharacter, DbUser } from "@/lib/db/client";
import { motion } from "framer-motion";
import { Skull, AlertOctagon, RotateCcw, Flame, ShieldAlert, Sparkles } from "lucide-react";

export interface OtherSideClientProps {
  user: DbUser;
  character: DbCharacter;
}

export function OtherSideClient({ user, character }: OtherSideClientProps) {
  const { triggerTransition, isTransitioning } = useWorldTransition();

  const handleReturnToRightSide = () => {
    triggerTransition("/right-side", "other-to-right");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Corrupted Void, Deep Crimson, and Spore Particles */}
      <WorldBackground mode="other-side" />

      {/* Top HUD Navigation Bar */}
      <WorldNavigation currentRealm="other-side" user={user} character={character} />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* World Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-red-800/40 pb-6 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="crimson" pulse>
                CORRUPTED REALM
              </Badge>
              <span className="text-xs font-mono text-red-500 uppercase tracking-widest animate-pulse">
                ZONE 99: THE VOID MATRIX // TARGET: {character.name.toUpperCase()} [{character.archetype}]
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-red uppercase">
              THE OTHER SIDE
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-red-300/90 italic tracking-wider mt-1">
              &ldquo;Something is spreading.&rdquo;
            </p>
          </div>

          {/* Prominent Return Action */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>STABILITY ANCHOR DETECTED</span>
            </div>
            <Button
              id="return-right-side-btn"
              variant="portal-cyan"
              size="lg"
              glow
              disabled={isTransitioning}
              onClick={handleReturnToRightSide}
              className="border-cyan-500 text-cyan-200 hover:text-black bg-cyan-950/40 hover:bg-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)]"
              aria-label="Return to the Right Side dimension"
            >
              <RotateCcw className="w-5 h-5 mr-2 text-cyan-400 group-hover:text-black" />
              RETURN TO THE RIGHT SIDE
            </Button>
          </div>
        </motion.div>

        {/* Threat & Corruption Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: World Corruption Meter & Drained Attributes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* World Corruption Gauge Card */}
            <Card variant="corrupted" glow className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
                    <CardTitle className="text-red-300">
                      CORRUPTION DETECTED
                    </CardTitle>
                  </div>
                  <Badge variant="crimson" pulse>
                    LEVEL HIGH
                  </Badge>
                </div>
                <CardDescription className="text-red-400/80">
                  DIMENSIONAL CONTAMINATION COEFFICIENT
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <ProgressBar
                  value={32}
                  max={100}
                  variant="crimson"
                  segmented
                  label="WORLD CORRUPTION"
                  sublabel="GROWTH RATE: +0.4% / HR"
                />

                <div className="p-3 rounded-xs bg-red-950/40 border border-red-900/60 text-xs font-mono text-red-200/90 leading-relaxed">
                  The Other Side feeds on postponed decisions, broken promises, and unspent creative energy. If corruption exceeds 75%, reality distortion accelerates.
                </div>
              </CardContent>
            </Card>

            {/* Drained Attributes Panel with Character Stats */}
            <Card variant="crimson" className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <CardTitle className="text-white text-base">
                      DRAINED ATTRIBUTES
                    </CardTitle>
                  </div>
                  <Badge variant="crimson">DEBUFF ACTIVE</Badge>
                </div>
                <CardDescription className="text-slate-400">
                  CORRUPTION RESISTANCE PENALTIES FOR {character.name.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttributeBar corrupted character={character} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Current Threat Dossier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Current Threat Card: THE PROCRASTINATOR */}
            <Card variant="corrupted" glow className="space-y-5">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-sm border-2 border-red-600 bg-red-950/70 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                      <Skull className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-red-400 text-lg sm:text-xl tracking-widest font-cinzel">
                          THE PROCRASTINATOR
                        </CardTitle>
                        <Badge variant="crimson">BOSS ANOMALY</Badge>
                      </div>
                      <CardDescription className="text-red-400/70">
                        PRIMARY DIMENSIONAL PARASITE [PLACEHOLDER]
                      </CardDescription>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xs bg-red-950/60 border border-red-700/80 text-left sm:text-right">
                    <div className="text-[10px] font-mono text-red-400 font-bold uppercase">
                      STATUS
                    </div>
                    <div className="text-xs sm:text-sm font-orbitron font-extrabold text-red-200">
                      AWAITING YOUR CHALLENGE
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-black/60 border border-red-900/60 rounded-xs">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      THREAT TRAIT
                    </div>
                    <div className="font-orbitron text-sm font-bold text-red-400 mt-0.5">
                      TEMPORAL DISTORTION
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Convinces you that tomorrow has infinite hours.
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 border border-red-900/60 rounded-xs">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      CORRUPTION SOURCE
                    </div>
                    <div className="font-orbitron text-sm font-bold text-purple-400 mt-0.5">
                      INFINITE SCROLL VORTEX
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">
                      Siphons dopamine before real-world tasks begin.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span>BANISHMENT PROTOCOL (SLATED FOR FUTURE PHASES)</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    [NOTICE]: Boss battles, corruption purging, and combat progression are scheduled for upcoming phases. Currently observing dimension resonance for survivor <span className="text-white font-bold">{character.name}</span>.
                  </p>
                </div>

                <div className="pt-2 text-center text-xs font-mono text-red-400/80 tracking-widest">
                  [DIMENSIONAL GATEWAY STANDING BY — RETURN TO SANCTUARY TO COMMENCE MISSIONS]
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* World Status Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-red-950/60 bg-black/50 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE OTHER SIDE // CORRUPTED SECTOR 99 // TARGET: {character.name}</div>
          <div className="text-red-500/90">WARNING: HIGH CONCENTRATION OF RESISTANCE</div>
        </div>
      </footer>
    </div>
  );
}
