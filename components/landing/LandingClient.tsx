"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Radio,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Shield,
  Zap,
  Target,
  Brain,
  Dumbbell,
  Flame,
  Users,
  BookOpen,
  CheckCircle2,
  Skull,
  Coins,
  Gamepad2,
  Compass,
  FileCheck,
  Timer,
  AlertTriangle,
  Award,
} from "lucide-react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { Particles } from "@/components/ui/Particles";
import { soundscape } from "@/lib/audio/soundscape";
import { DbUser, DbCharacter } from "@/lib/db/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LandingClientProps {
  user: DbUser | null;
  character: DbCharacter | null;
  isAuthenticated: boolean;
}

export function LandingClient({
  user,
  character,
  isAuthenticated,
}: LandingClientProps) {
  const router = useRouter();
  const { triggerTransition, isTransitioning } = useWorldTransition();
  const [demoProgressActive, setDemoProgressActive] = useState(false);

  // Inversion CTA routing handler
  const handleInvertClick = () => {
    soundscape.playGlitch();
    if (isAuthenticated) {
      if (character) {
        triggerTransition("/right-side", "landing-to-right");
      } else {
        router.push("/onboarding");
      }
    } else {
      triggerTransition("/auth/login", "landing-to-right");
    }
  };

  // Primary action routing handler
  const handlePrimaryCtaClick = () => {
    soundscape.playGlitch();
    if (isAuthenticated) {
      if (character) {
        router.push("/right-side");
      } else {
        router.push("/onboarding");
      }
    } else {
      router.push("/auth/signup");
    }
  };

  // Secondary explore scroll handler
  const handleExploreScroll = () => {
    soundscape.playHover();
    const target = document.getElementById("protocol-problem");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030104] text-slate-100 overflow-x-hidden selection:bg-red-900 selection:text-white">
      {/* Background Ambience & Atmospheric Particles */}
      <WorldBackground mode="landing" />

      {/* Full-Viewport Living Dimensional Dust & Signal Synapses WebGL Canvas */}
      <Particles
        particleColors={["#19D9FF", "#8BEAFF", "#FF2424", "#FFFFFF"]}
        altColors={["#FF1A24", "#DC2626", "#FF4D4D", "#FFFFFF"]}
        particleSpread={11}
        speed={0.09}
        particleBaseSize={135}
        moveParticlesOnHover={true}
        particleHoverFactor={0.85}
        enableConnections={true}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Persistent Top Navigation Bar */}
      <WorldNavigation
        currentRealm="landing"
        user={user}
        character={character}
      />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (85–100vh) — PRESERVED IDENTITY & ATMOSPHERE             */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative z-20 min-h-[92vh] flex flex-col items-center justify-center px-4 py-16 text-center max-w-5xl mx-auto"
      >
        {/* Subtle 80s Broadcast Frequency Tag */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full border border-red-900/60 bg-red-950/40 text-red-400 text-xs font-mono tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] backdrop-blur-xs"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
          <span>REAL-LIFE RPG // TWO WORLDS</span>
        </motion.div>

        {/* Cinematic Main Title with Hollow Stroke Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative mb-6"
        >
          <h1 className="font-cinzel text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.14em] uppercase neon-glow-red select-none">
            THE OTHER SIDE
          </h1>
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

        {/* Cinematic Tagline */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7 }}
          className="font-cinzel text-lg sm:text-2xl md:text-3xl text-red-200/95 italic tracking-widest mb-6 drop-shadow-[0_0_14px_rgba(255,100,100,0.4)]"
        >
          &ldquo;Your real life has two worlds.&rdquo;
        </motion.blockquote>

        {/* Clear, Immediate Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 }}
          className="max-w-2xl mx-auto space-y-4 font-body text-base sm:text-lg md:text-xl text-slate-300 font-medium tracking-wide mb-10"
        >
          <p className="text-white font-semibold leading-relaxed">
            Turn your real-life goals into missions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-mono text-cyan-300">
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Study</span>
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Work Out</span>
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Read</span>
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Build</span>
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Practice</span>
            <span className="px-2.5 py-1 rounded-xs bg-slate-900 border border-slate-700">Focus</span>
          </div>
          <p className="text-sm sm:text-base text-slate-300 font-mono pt-1">
            Complete missions → earn XP → level up → unlock rewards.
          </p>
        </motion.div>

        {/* Main CTA: INVERT THE WORLDS / ENTER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 1.1 }}
          className="relative group mb-8"
        >
          <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 opacity-60 blur-md group-hover:opacity-100 transition duration-500 group-hover:blur-lg animate-pulse" />

          <Button
            variant="portal-red"
            size="xl"
            glow
            disabled={isTransitioning}
            onClick={handleInvertClick}
            className="relative px-8 sm:px-12 py-4 text-base sm:text-lg tracking-[0.25em] font-extrabold text-white border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] hover:shadow-[0_0_50px_rgba(239,68,68,1)] cursor-pointer"
            aria-label="Invert the worlds and explore"
          >
            <Sparkles className="w-5 h-5 mr-2 text-red-300 group-hover:rotate-45 transition-transform" />
            INVERT THE WORLDS
          </Button>
        </motion.div>

        {/* Action to Scroll Down */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          onClick={handleExploreScroll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xs border border-slate-800 bg-slate-950/60 hover:bg-slate-900/80 text-slate-400 hover:text-cyan-300 text-xs font-mono tracking-widest transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Scroll down to see how it works"
        >
          <span>HOW IT WORKS</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
        </motion.button>

        <p className="mt-4 text-[11px] font-mono tracking-widest text-slate-500 uppercase">
          [SCROLL DOWN TO LEARN MORE]
        </p>
      </section>

      {/* Subtle Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 2. SECTION 1 — THE PROBLEM & SOLUTION                                     */}
      {/* ========================================================================= */}
      <section
        id="protocol-problem"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>01 // WHY WE BUILT THIS</span>
          </div>

          <h2 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-bold tracking-wider text-white uppercase max-w-3xl mx-auto leading-tight">
            REAL-LIFE PROGRESS FEELS SLOW. GAMES MAKE IT FAST.
          </h2>

          <div className="max-w-2xl mx-auto space-y-4 text-base sm:text-xl font-body text-slate-300 font-medium leading-relaxed">
            <p className="text-slate-400 italic">
              Real-world progress takes time to see:
            </p>
            <p>
              You study for weeks before you feel smarter.
              <br />
              You work out for months before you see results.
              <br />
              You work for hours before anything shows.
            </p>
            <p className="text-cyan-300 font-semibold tracking-wide pt-2">
              Games solved this with instant feedback, levels, and stats.
            </p>
          </div>

          {/* Game Solutions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto pt-6">
            {[
              { label: "INSTANT REWARDS", sub: "See progress right away" },
              { label: "XP & LEVELS", sub: "Watch your character grow" },
              { label: "REAL REWARDS", sub: "Spend credits on items" },
              { label: "CONSEQUENCES", sub: "Slacking feeds The Other Side" },
              { label: "DAILY STREAKS", sub: "Reasons to return every day" },
            ].map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => soundscape.playHover()}
                className="p-3.5 rounded-xs border border-slate-800 bg-slate-900/60 hover:border-cyan-500/60 hover:bg-cyan-950/20 transition-all text-left group"
              >
                <div className="text-xs font-orbitron font-bold text-white group-hover:text-cyan-300 tracking-wider">
                  {item.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <div className="inline-block px-6 py-3 rounded-xs border border-red-500/40 bg-gradient-to-r from-red-950/40 via-purple-950/30 to-cyan-950/40 text-sm sm:text-base font-orbitron tracking-widest text-slate-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              &ldquo;THE OTHER SIDE TURNS YOUR DAILY GOALS INTO A GAME.&rdquo;
            </div>
          </div>
        </motion.div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-600/30 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 3. SECTION 2 — TWO WORLDS (SPLIT SCREEN COMPARISON)                       */}
      {/* ========================================================================= */}
      <section
        id="two-worlds"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>02 // TWO WORLDS</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            YOUR REAL LIFE HAS TWO WORLDS.
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            WHERE PROGRESS HAPPENS VS WHERE PROCRASTINATION GROWS.
          </p>
        </motion.div>

        {/* Dual Split Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT: THE RIGHT SIDE (Cyan / Cool Sanctuary) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative p-6 sm:p-8 rounded-xs border-2 border-cyan-500/50 bg-gradient-to-b from-[#07111e]/90 to-[#040913]/90 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4 mb-6">
                <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-black text-lg tracking-widest">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <span>THE RIGHT SIDE</span>
                </div>
                <span className="px-2 py-0.5 rounded-xs bg-cyan-950 border border-cyan-500 text-cyan-300 text-[10px] font-mono tracking-widest uppercase">
                  PROGRESS
                </span>
              </div>

              <blockquote className="font-cinzel text-lg sm:text-xl text-cyan-200 italic mb-6">
                &ldquo;Where progress happens.&rdquo;
              </blockquote>

              <p className="text-slate-300 text-sm sm:text-base font-body leading-relaxed mb-6">
                Complete real-life missions and build your character.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { label: "+ EARN XP", val: "Get rewarded for finishing real tasks" },
                  { label: "+ LEVEL UP", val: "Unlock new perks and higher ranks" },
                  { label: "+ BUILD YOUR STATS", val: "Mind, Body, Focus, Spirit, Connection" },
                  { label: "+ KEEP YOUR STREAK", val: "Stay consistent every day" },
                  { label: "+ EARN CREDITS", val: "Spend in the reward shop" },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xs bg-cyan-950/30 border border-cyan-900/50 text-cyan-100"
                  >
                    <span className="font-bold text-cyan-400">{row.label}</span>
                    <span className="text-slate-300 text-[11px]">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-cyan-900/50 flex items-center justify-between text-xs font-mono text-cyan-400/80">
              <span>WORLD STATUS: SAFE</span>
              <span>THE RIGHT SIDE</span>
            </div>
          </motion.div>

          {/* RIGHT: THE OTHER SIDE (Red / Dark Corrupted Sector) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative p-6 sm:p-8 rounded-xs border-2 border-red-600/60 bg-gradient-to-b from-[#180407]/90 to-[#0c0204]/90 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-red-500/30 pb-4 mb-6">
                <div className="flex items-center gap-2 text-red-500 font-orbitron font-black text-lg tracking-widest">
                  <Skull className="w-5 h-5 text-red-500 animate-pulse" />
                  <span>THE OTHER SIDE</span>
                </div>
                <span className="px-2 py-0.5 rounded-xs bg-red-950 border border-red-500 text-red-300 text-[10px] font-mono tracking-widest uppercase">
                  PROCRASTINATION
                </span>
              </div>

              <blockquote className="font-cinzel text-lg sm:text-xl text-red-200 italic mb-6">
                &ldquo;Where procrastination grows.&rdquo;
              </blockquote>

              <p className="text-slate-300 text-sm sm:text-base font-body leading-relaxed mb-6">
                Ignore your goals and The Other Side gets stronger.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { label: "WORLD CORRUPTION", val: "Grows when you put things off" },
                  { label: "SPECIAL BOSSES", val: "Challenges created by procrastination" },
                  { label: "SPECIAL CHALLENGES", val: "Limited-time events with bonus XP" },
                  { label: "NEW AREAS", val: "Complete missions to unlock them" },
                  { label: "LOST STREAKS", val: "Keep going to stay ahead" },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xs bg-red-950/30 border border-red-900/50 text-red-100"
                  >
                    <span className="font-bold text-red-400">{row.label}</span>
                    <span className="text-slate-300 text-[11px]">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-red-900/50 flex items-center justify-between text-xs font-mono text-red-400/80">
              <span>ALERT: THE OTHER SIDE IS GROWING</span>
              <span>PARALLEL WORLD</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 4. SECTION 3 — HOW IT WORKS (4-STEP SEQUENCE)                             */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>03 // HOW IT WORKS</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            HOW IT WORKS
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            FOUR SIMPLE STEPS TO LEVEL UP IN REAL LIFE.
          </p>
        </motion.div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {[
            {
              step: "01",
              title: "CREATE A MISSION",
              desc: "Add something you want to get done.",
              sub: "Study, workout, reading, coding, or focus.",
              icon: Target,
              accent: "border-cyan-500/50 text-cyan-400",
            },
            {
              step: "02",
              title: "COMPLETE IT",
              desc: "Finish the task in real life.",
              sub: "Check it off or use the focus timer.",
              icon: CheckCircle2,
              accent: "border-amber-500/50 text-amber-400",
            },
            {
              step: "03",
              title: "EARN XP",
              desc: "Get XP, credits, and stat progress.",
              sub: "Watch your survivor level up.",
              icon: Zap,
              accent: "border-purple-500/50 text-purple-400",
            },
            {
              step: "04",
              title: "LEVEL UP",
              desc: "Build your character & unlock rewards.",
              sub: "Push back corruption and defeat bosses.",
              icon: Skull,
              accent: "border-red-500/50 text-red-400",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                onMouseEnter={() => soundscape.playHover()}
                className={cn(
                  "p-6 rounded-xs bg-slate-900/60 border hover:bg-slate-900/90 transition-all flex flex-col justify-between",
                  item.accent
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-orbitron text-2xl font-black text-slate-500">
                      {item.step}
                    </span>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-orbitron font-bold text-sm tracking-wider text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="font-body text-base text-slate-200 font-semibold mb-2 leading-snug">
                    {item.desc}
                  </p>
                  <p className="text-xs font-mono text-slate-400 leading-normal">
                    {item.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Visual Flow Banner */}
        <div className="mt-8 p-4 rounded-xs border border-slate-800 bg-black/60 flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm text-slate-300">
          <span className="text-cyan-400 font-bold">01 CREATE MISSION</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="text-amber-400 font-bold">02 COMPLETE IT</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="text-purple-400 font-bold">03 EARN XP &amp; STATS</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <span className="text-emerald-400 font-bold">04 LEVEL UP &amp; UNLOCK REWARDS</span>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 5. SECTION 4 — YOUR STATS (RPG STAT CARDS)                                */}
      {/* ========================================================================= */}
      <section
        id="stats"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-6xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>04 // YOUR STATS</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            YOUR STATS
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            HOW YOUR REAL-LIFE ACTIVITIES ARE IMPROVING YOU.
          </p>
        </motion.div>

        {/* 5 Attribute Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              category: "MIND",
              icon: Brain,
              action: "STUDY 60 MIN",
              example: "LEARNING, STUDYING, READING",
              rewards: ["+70 XP", "+3 MIND", "+15 CREDITS"],
              color: "border-blue-500/60 bg-blue-950/20 text-blue-300",
              badge: "LEARNING",
            },
            {
              category: "BODY",
              icon: Dumbbell,
              action: "GYM WORKOUT",
              example: "EXERCISE & PHYSICAL HEALTH",
              rewards: ["+85 XP", "+4 BODY", "+20 CREDITS"],
              color: "border-emerald-500/60 bg-emerald-950/20 text-emerald-300",
              badge: "HEALTH",
            },
            {
              category: "FOCUS",
              icon: Flame,
              action: "DEEP WORK SPRINT",
              example: "DEEP WORK & CONCENTRATION",
              rewards: ["+60 XP", "+3 FOCUS", "+15 CREDITS"],
              color: "border-amber-500/60 bg-amber-950/20 text-amber-300",
              badge: "FOCUS",
            },
            {
              category: "SPIRIT",
              icon: BookOpen,
              action: "READ 30 PAGES",
              example: "MINDFULNESS & PERSONAL GROWTH",
              rewards: ["+40 XP", "+2 SPIRIT", "+10 CREDITS"],
              color: "border-purple-500/60 bg-purple-950/20 text-purple-300",
              badge: "GROWTH",
            },
            {
              category: "CONNECTION",
              icon: Users,
              action: "CALL A FRIEND",
              example: "FRIENDS, FAMILY & RELATIONSHIPS",
              rewards: ["+50 XP", "+3 CONNECTION", "+12 CREDITS"],
              color: "border-rose-500/60 bg-rose-950/20 text-rose-300",
              badge: "COMMUNITY",
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onMouseEnter={() => soundscape.playHover()}
                className={cn(
                  "p-5 rounded-xs border flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 group shadow-lg",
                  card.color
                )}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-1.5 font-orbitron font-bold text-xs">
                      <Icon className="w-4 h-4" />
                      <span>{card.category}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-black/40 border border-white/10">
                      {card.badge}
                    </span>
                  </div>

                  <div className="text-sm font-orbitron font-bold text-white mb-1 group-hover:text-cyan-200 transition-colors">
                    {card.action}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mb-4">
                    {card.example}
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10 font-mono text-xs">
                  {card.rewards.map((r, rIdx) => (
                    <div
                      key={rIdx}
                      className="flex items-center justify-between text-slate-200"
                    >
                      <span className="font-bold text-cyan-300">{r}</span>
                      <span className="text-[10px] text-slate-400">REWARD</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 6. SECTION 5 — WORLD CHANGES (LIVE DEMO PROGRESS BARS)                    */}
      {/* ========================================================================= */}
      <section
        id="world-reacts"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>05 // WORLD CHANGES</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            YOUR PROGRESS CHANGES THE WORLD.
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            EVERY MISSION YOU FINISH WEAKENS THE OTHER SIDE.
          </p>
        </motion.div>

        {/* Live Simulation Card */}
        <div className="p-6 sm:p-8 rounded-xs border-2 border-red-900/60 bg-gradient-to-b from-black/90 to-[#120306]/90 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-950 pb-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE PROGRESS PREVIEW</span>
            </div>
            <button
              onClick={() => {
                soundscape.playGlitch();
                setDemoProgressActive(!demoProgressActive);
              }}
              className="px-3 py-1 rounded-xs border border-cyan-500/60 bg-cyan-950/40 hover:bg-cyan-950 text-cyan-300 text-xs font-mono tracking-wider transition-all cursor-pointer"
            >
              {demoProgressActive ? "RESET PREVIEW" : "SIMULATE MISSION COMPLETION"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Global Corruption */}
            <div className="p-4 rounded-xs border border-red-950 bg-black/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">WORLD CORRUPTION</span>
                <span className="text-xs font-orbitron font-bold text-red-400">
                  {demoProgressActive ? "58% (-6%)" : "64%"}
                </span>
              </div>
              <div className="h-4 bg-slate-950 rounded-xs overflow-hidden border border-red-900/50 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-xs"
                  initial={{ width: "64%" }}
                  animate={{ width: demoProgressActive ? "58%" : "64%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-400">
                {demoProgressActive ? "Corruption pushed back by your progress!" : "Pushed back as you complete tasks"}
              </div>
            </div>

            {/* 2. Active Boss Vitality */}
            <div className="p-4 rounded-xs border border-red-950 bg-black/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">BOSS: THE PROCRASTINATOR</span>
                <span className="text-xs font-orbitron font-bold text-amber-400">
                  {demoProgressActive ? "260 / 500 HP" : "305 / 500 HP"}
                </span>
              </div>
              <div className="h-4 bg-slate-950 rounded-xs overflow-hidden border border-amber-900/50 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-xs"
                  initial={{ width: "61%" }}
                  animate={{ width: demoProgressActive ? "52%" : "61%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-400">
                {demoProgressActive ? "Dealt -45 Damage to the boss!" : "Damaged whenever you complete tasks"}
              </div>
            </div>

            {/* 3. Area Restoration */}
            <div className="p-4 rounded-xs border border-cyan-950 bg-black/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">KNOWLEDGE FOREST</span>
                <span className="text-xs font-orbitron font-bold text-cyan-400">
                  {demoProgressActive ? "48% (+6%)" : "42%"}
                </span>
              </div>
              <div className="h-4 bg-slate-950 rounded-xs overflow-hidden border border-cyan-900/50 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-600 to-teal-400 rounded-xs"
                  initial={{ width: "42%" }}
                  animate={{ width: demoProgressActive ? "48%" : "42%" }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-400">
                {demoProgressActive ? "Area unlocked and restored!" : "Unlocked by improving Mind"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 7. SECTION 6 — PROOF & FOCUS TIMERS                                       */}
      {/* ========================================================================= */}
      <section
        id="signal-integrity"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>06 // PROOF &amp; FOCUS</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            A CHECKBOX IS EASY TO CHEAT.
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-cyan-300 tracking-widest">
            MORE WAYS TO PROVE YOUR PROGRESS.
          </p>
        </motion.div>

        {/* 2 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Evidence Submission */}
          <div
            onMouseEnter={() => soundscape.playHover()}
            className="p-6 sm:p-8 rounded-xs border border-cyan-800/60 bg-slate-950/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-cyan-400 font-bold">OPTION 01 // WRITTEN PROOF</span>
                <FileCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-orbitron font-bold text-lg text-white mb-2">
                WRITTEN PROOF OR NOTES
              </h3>
              <p className="text-sm font-body text-slate-300 mb-6 leading-relaxed">
                Add a quick note, photo, or link to verify big tasks and earn bonus XP.
              </p>
            </div>

            <div className="p-4 rounded-xs border border-cyan-900/40 bg-cyan-950/20 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-cyan-200">
                <span>PROOF ATTACHED</span>
                <span className="text-cyan-400 font-bold">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>BONUS REWARDS</span>
                <span className="text-white font-bold">+20% BONUS XP</span>
              </div>
            </div>
          </div>

          {/* Card 2: Focus Protocol */}
          <div
            onMouseEnter={() => soundscape.playHover()}
            className="p-6 sm:p-8 rounded-xs border border-purple-800/60 bg-slate-950/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-purple-400 font-bold">OPTION 02 // FOCUS TIMER</span>
                <Timer className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-orbitron font-bold text-lg text-white mb-2">
                TIMED FOCUS SESSIONS
              </h3>
              <p className="text-sm font-body text-slate-300 mb-6 leading-relaxed">
                Use a distraction-free countdown timer to stay focused on deep work and earn maximum XP.
              </p>
            </div>

            <div className="p-4 rounded-xs border border-purple-900/40 bg-purple-950/20 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-purple-200">
                <span>TIMER ACTIVE</span>
                <span className="text-purple-400 font-bold">25:00</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>VERIFICATION</span>
                <span className="text-white font-bold">MAXIMUM REWARDS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Statement */}
        <div className="p-6 rounded-xs border border-slate-800 bg-slate-900/40 text-center max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>100% PRIVATE GUARANTEE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-slate-300">
            <div className="p-2 rounded-xs bg-black/40">NO CAMERA</div>
            <div className="p-2 rounded-xs bg-black/40">NO MICROPHONE</div>
            <div className="p-2 rounded-xs bg-black/40">NO SCREEN RECORDER</div>
            <div className="p-2 rounded-xs bg-black/40">NO KEYLOGGER</div>
          </div>
          <p className="text-xs font-mono text-slate-400">
            We only track your session timer. Your work and data are completely private.
          </p>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 8. SECTION 7 — STREAKS & DAILY PROGRESS                                   */}
      {/* ========================================================================= */}
      <section
        id="survival"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>07 // YOUR STREAK</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            KEEP YOUR STREAK GOING.
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            COMPLETE A MISSION EVERY DAY TO KEEP YOUR STREAK.
          </p>
        </motion.div>

        {/* Streak Milestone Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-10">
          {[
            { day: "DAY 01", label: "FIRST MISSION", status: "COMPLETE" },
            { day: "DAY 03", label: "BUILDING HABIT", status: "COMPLETE" },
            { day: "DAY 07", label: "ONE WEEK STREAK", status: "ACTIVE" },
            { day: "DAY 14", label: "TWO WEEKS", status: "UPCOMING" },
            { day: "DAY 30", label: "ONE MONTH MASTER", status: "LOCKED" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-xs border flex flex-col justify-between text-left",
                item.status === "ACTIVE"
                  ? "border-amber-400 bg-amber-950/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  : item.status === "COMPLETE"
                  ? "border-cyan-800 bg-cyan-950/20 text-cyan-200"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 opacity-60"
              )}
            >
              <div className="font-orbitron font-bold text-sm">{item.day}</div>
              <div className="font-cinzel text-xs font-bold my-2">{item.label}</div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
                {item.status}
              </div>
            </div>
          ))}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <div className="px-4 py-2 rounded-xs border border-amber-500/50 bg-amber-950/40 text-amber-300 font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>CURRENT STREAK: 07 DAYS</span>
          </div>
          <div className="px-4 py-2 rounded-xs border border-slate-700 bg-slate-900/60 text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>NEXT REWARD: 14 DAYS (◈ +100 CREDITS)</span>
          </div>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 9. SECTION 8 — SPECIAL CHALLENGES & BOSSES                                */}
      {/* ========================================================================= */}
      <section
        id="events"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-red-950/80 border border-red-700 text-red-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>08 // SPECIAL CHALLENGES</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-red-400 uppercase">
            SPECIAL CHALLENGES &amp; BOSSES.
          </h2>
          <p className="mt-3 font-mono text-xs sm:text-sm text-slate-400 tracking-widest max-w-xl mx-auto">
            BIGGER CHALLENGES WITH EXTRA XP AND CREDIT REWARDS.
          </p>
        </motion.div>

        {/* Anomaly Live Card */}
        <div className="p-6 sm:p-8 rounded-xs border-2 border-red-600/70 bg-gradient-to-b from-[#180307]/90 to-black/90 shadow-[0_0_35px_rgba(239,68,68,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-red-400">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span>SPECIAL CHALLENGE DETECTED</span>
            </div>
            <h3 className="font-orbitron font-black text-xl sm:text-2xl text-white tracking-wider">
              HIGH FOCUS SPRINT // BONUS REWARD
            </h3>
            <p className="text-sm font-body text-slate-300 max-w-lg">
              Complete 3 high-focus missions before time expires to earn bonus credits and extra XP.
            </p>
          </div>

          <div className="space-y-2 text-right font-mono text-xs">
            <div className="p-2.5 rounded-xs bg-black/60 border border-red-900 text-red-300">
              GOAL: <span className="font-bold text-white">2 / 3 MISSIONS DONE</span>
            </div>
            <div className="p-2.5 rounded-xs bg-black/60 border border-red-900 text-amber-300">
              TIME LEFT: <span className="font-bold text-white">02:41:18</span>
            </div>
          </div>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 10. SECTION 9 — THE REWARD SHOP                                           */}
      {/* ========================================================================= */}
      <section
        id="arcade"
        className="relative z-20 py-24 px-4 sm:px-8 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/80 border border-slate-700 text-slate-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>09 // REWARD SHOP</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider text-white uppercase">
            REWARD SHOP
          </h2>
          <p className="mt-2 font-mono text-xs sm:text-sm text-slate-400 tracking-widest">
            SPEND YOUR EARNED CREDITS ON REWARDS AND BOOSTS.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-xs bg-amber-950/60 border border-amber-500/60 text-amber-300 font-mono text-sm font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>◈ 420 CREDITS AVAILABLE</span>
          </div>
        </motion.div>

        {/* Fictional Shop Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              name: "FOCUS TONIC",
              cost: "50 CREDITS",
              rarity: "COMMON",
              type: "CONSUMABLE",
              desc: "+2 FOCUS FOR YOUR NEXT SESSION",
              border: "border-slate-700 bg-slate-900/60",
            },
            {
              name: "NIGHT COMPASS",
              cost: "150 CREDITS",
              rarity: "RARE",
              type: "RELIC",
              desc: "+4 SPIRIT GEAR LOADOUT",
              border: "border-cyan-600/60 bg-cyan-950/30",
            },
            {
              name: "MEMORY SHARD",
              cost: "200 CREDITS",
              rarity: "EPIC",
              type: "MIND GEAR",
              desc: "+6 MIND GEAR LOADOUT",
              border: "border-purple-600/60 bg-purple-950/30",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onMouseEnter={() => soundscape.playHover()}
              className={cn(
                "p-5 rounded-xs border flex flex-col justify-between hover:scale-[1.02] transition-all",
                item.border
              )}
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {item.rarity} // {item.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    ◈ {item.cost}
                  </span>
                </div>
                <h3 className="font-orbitron font-bold text-base text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-xs font-mono text-cyan-300">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>SHOP PREVIEW</span>
                <Gamepad2 className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href={isAuthenticated ? "/arcade" : "/auth/login"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xs border-2 border-amber-500 bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 font-orbitron font-bold text-sm tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
          >
            <span>OPEN THE REWARD SHOP</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </section>

      {/* Glowing Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent relative z-20" />

      {/* ========================================================================= */}
      {/* 11. SECTION 10 — FINAL CALL TO ACTION                                     */}
      {/* ========================================================================= */}
      <section
        id="enter"
        className="relative z-20 py-28 px-4 sm:px-8 max-w-4xl mx-auto text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="relative z-10 space-y-8"
        >
          <h2 className="font-cinzel text-4xl sm:text-6xl md:text-7xl font-black tracking-wider text-red-500 neon-glow-red uppercase leading-tight">
            THE OTHER SIDE IS WAITING.
          </h2>

          <p className="font-cinzel text-lg sm:text-2xl text-slate-200 italic max-w-2xl mx-auto">
            &ldquo;Your real life has two worlds. Which one are you building?&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              variant="portal-red"
              size="xl"
              glow
              onClick={handlePrimaryCtaClick}
              className="w-full sm:w-auto px-8 py-4 font-orbitron font-extrabold text-sm sm:text-base tracking-[0.2em] uppercase border-2 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.7)] hover:shadow-[0_0_50px_rgba(239,68,68,1)] cursor-pointer"
            >
              {isAuthenticated ? "ENTER THE RIGHT SIDE" : "START YOUR ADVENTURE"}
            </Button>

            <Button
              variant="corrupted"
              size="xl"
              onClick={handleInvertClick}
              disabled={isTransitioning}
              className="w-full sm:w-auto px-8 py-4 font-orbitron font-bold text-sm sm:text-base tracking-[0.2em] uppercase border-2 border-slate-700 hover:border-red-500 text-slate-200 hover:text-white cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-2 text-red-400" />
              INVERT THE WORLDS
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 12. MINIMAL ATMOSPHERIC FOOTER                                            */}
      {/* ========================================================================= */}
      <footer className="relative z-20 py-10 px-6 border-t border-red-950/60 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-slate-400">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-cinzel font-bold text-slate-200 tracking-wider">
              THE OTHER SIDE
            </div>
            <div className="text-slate-400">
              Turn real-life goals into missions.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href={isAuthenticated ? "/right-side" : "/auth/login"}
              className="hover:text-cyan-300 transition-colors"
            >
              {isAuthenticated ? "SANCTUARY" : "LOGIN"}
            </Link>
            <Link
              href={isAuthenticated ? "/arcade" : "/auth/signup"}
              className="hover:text-amber-300 transition-colors"
            >
              {isAuthenticated ? "REWARD SHOP" : "SIGN UP"}
            </Link>
            <Link
              href="/leaderboard"
              className="hover:text-amber-300 transition-colors"
            >
              LEADERBOARD
            </Link>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-red-400 transition-colors cursor-pointer"
            >
              RETURN TO TOP ↑
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center md:text-right">
            <span>&copy; {new Date().getFullYear()} THE OTHER SIDE. ALL WORLDS PRESERVED.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
