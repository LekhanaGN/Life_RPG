"use client";

import React from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { CharacterCard } from "@/components/character/CharacterCard";
import { AttributeBar } from "@/components/character/AttributeBar";
import { MissionCard } from "@/components/missions/MissionCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";
import { Skull, AlertTriangle, ShieldCheck, Activity } from "lucide-react";

export default function RightSidePage() {
  const { triggerTransition, isTransitioning } = useWorldTransition();

  const handleEnterOtherSide = () => {
    triggerTransition("/other-side", "right-to-other");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Cyan Cyber Grid & Dark Navy Ambience */}
      <WorldBackground mode="right-side" />

      {/* Top HUD Navigation Bar */}
      <WorldNavigation currentRealm="right-side" />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* World Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-500/20 pb-6 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan" pulse>
                STABLE REALM
              </Badge>
              <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                ZONE 01: SANCTUARY
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-cyan uppercase">
              THE RIGHT SIDE
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-cyan-200/90 italic tracking-wider mt-1">
              &ldquo;Build your world.&rdquo;
            </p>
          </div>

          {/* Prominent Dimensional Breach Action */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" />
              <span>DIMENSIONAL RIFT DETECTED</span>
            </div>
            <Button
              variant="corrupted"
              size="lg"
              glow
              disabled={isTransitioning}
              onClick={handleEnterOtherSide}
              className="border-red-600/90 text-red-300 hover:text-white bg-red-950/40 hover:bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              aria-label="Enter the Other Side dimension"
            >
              <Skull className="w-5 h-5 mr-2 text-red-500 group-hover:text-white" />
              ENTER THE OTHER SIDE
            </Button>
          </div>
        </motion.div>

        {/* Primary Game Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Character Dossier & Attributes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Character Profile Card */}
            <CharacterCard />

            {/* Core Attributes Panel */}
            <Card variant="cyan" className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-base">
                      CORE ATTRIBUTES
                    </CardTitle>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    5/5 CHANNELS ACTIVE
                  </span>
                </div>
                <CardDescription>
                  REAL-LIFE STATISTICAL RESONANCE
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttributeBar />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Today's Missions & World Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Mission Deck */}
            <MissionCard />

            {/* Dimensional Resonance Card */}
            <Card variant="default">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-white text-base">
                      REALM PURITY STATUS
                    </CardTitle>
                  </div>
                  <Badge variant="cyan">SURVIVAL RATIO: 68%</Badge>
                </div>
                <CardDescription>
                  BARRIER INTEGRITY AGAINST THE OTHER SIDE
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Every mission completed in the Right Side charges the dimensional barrier, starving the creatures of procrastination and inertia lurking across the threshold.
                </p>
                <div className="p-3 rounded-xs bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>WORLD RESONANCE: POSITIVE</span>
                  <span className="text-cyan-400 font-bold">100.0% STABLE</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* World Status Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-cyan-950/40 bg-black/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE RIGHT SIDE // ZONE 01 [SANCTUARY]</div>
          <div className="text-cyan-400/80">CROSS DIMENSIONS VIA PORTAL GATEWAY</div>
        </div>
      </footer>
    </div>
  );
}
