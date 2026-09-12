"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface WorldBackgroundProps {
  mode: "landing" | "right-side" | "other-side";
  className?: string;
}

export function WorldBackground({ mode, className }: WorldBackgroundProps) {
  // Generate stable random particles on mount
  const particles = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.7 + 5) % 95}%`,
      top: `${(i * 4.9 + 10) % 85}%`,
      size: `${(i % 3) + 2}px`,
      duration: `${12 + (i % 8)}s`,
      delay: `${(i * 0.4) % 5}s`,
    }));
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none overflow-hidden select-none z-0",
        className
      )}
      aria-hidden="true"
    >
      {/* ============================================================ */}
      {/* 1. LANDING PAGE: DARK FOREST & RED SUPERNATURAL GLOW          */}
      {/* ============================================================ */}
      {mode === "landing" && (
        <div className="absolute inset-0 bg-[#040609]">
          {/* Ominous red supernatural horizon gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(140,10,20,0.45)_0%,rgba(40,5,10,0.25)_40%,transparent_75%)]" />

          {/* Deep dark forest night sky */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020306] via-transparent to-[#020305]" />

          {/* Floating supernatural mist bank 1 (slow) */}
          <div className="absolute -bottom-24 -left-1/4 w-[150%] h-[60vh] opacity-35 animate-fog-slow bg-[radial-gradient(ellipse_at_center,rgba(80,10,20,0.4)_0%,rgba(20,25,35,0.2)_50%,transparent_70%)] blur-2xl pointer-events-none" />

          {/* Floating supernatural mist bank 2 (fast) */}
          <div className="absolute -bottom-12 -right-1/4 w-[140%] h-[45vh] opacity-25 animate-fog-fast bg-[radial-gradient(ellipse_at_center,rgba(30,40,55,0.4)_0%,rgba(100,15,25,0.2)_50%,transparent_70%)] blur-3xl pointer-events-none" />

          {/* Floating silver/red atmospheric dust spores */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-red-400/50 shadow-[0_0_6px_rgba(255,50,50,0.8)] animate-pulse"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}

          {/* Distant Tree Line Silhouettes Layer 1 (Background - Dark Grey/Indigo) */}
          <div className="absolute bottom-0 left-0 right-0 h-72 sm:h-96 opacity-40">
            <svg
              className="w-full h-full text-[#080d16]"
              viewBox="0 0 1200 400"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,400 L0,320 L25,270 L50,320 L75,260 L100,320 L130,240 L160,320 L190,270 L220,320 L250,230 L280,320 L320,250 L350,320 L390,220 L430,320 L470,260 L510,320 L550,210 L590,320 L640,240 L680,320 L720,200 L760,320 L800,250 L840,320 L880,220 L920,320 L960,260 L1000,320 L1040,230 L1080,320 L1120,270 L1160,320 L1200,280 L1200,400 Z" />
            </svg>
          </div>

          {/* Midground Tree Silhouettes Layer 2 (Pitch Black Pine Silhouettes) */}
          <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-72 opacity-90">
            <svg
              className="w-full h-full text-[#010204]"
              viewBox="0 0 1200 350"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,350 L0,220 L30,120 L60,220 L90,160 L120,240 L160,90 L200,240 L240,150 L280,250 L330,70 L380,250 L430,140 L480,260 L540,60 L600,250 L660,110 L720,260 L780,80 L840,250 L900,130 L950,260 L1010,75 L1070,250 L1120,140 L1170,240 L1200,160 L1200,350 Z" />
            </svg>
          </div>

          {/* Foreground Deep Silhouette Ground Fog */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#030407] via-[#030407]/80 to-transparent" />
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. THE RIGHT SIDE: DARK NAVY/CHARCOAL + CYAN NEON GRID       */}
      {/* ============================================================ */}
      {mode === "right-side" && (
        <div className="absolute inset-0 bg-[#070b16]">
          {/* Subtle Cyber Perspective Grid Receding to Horizon */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(6, 182, 212, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Deep Navy Radial Ambience */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(14,116,144,0.18)_0%,rgba(15,23,42,0.6)_50%,#050811_90%)]" />

          {/* Warm Amber Core Pulse in Top Right */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />

          {/* Electric Cyan Pulse in Bottom Left */}
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />

          {/* Floating Blue/Cyan Dust Motes */}
          {particles.slice(0, 18).map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-cyan-300/40 shadow-[0_0_8px_rgba(34,211,238,0.7)] animate-pulse"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. THE OTHER SIDE: VOID BLACK + DEEP CRIMSON + TOXIC SPORES */}
      {/* ============================================================ */}
      {mode === "other-side" && (
        <div className="absolute inset-0 bg-[#030004]">
          {/* Deep Crimson & Toxic Purple Vortex Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(185,28,28,0.35)_0%,rgba(88,28,135,0.25)_45%,rgba(15,3,10,0.85)_80%,#020003_100%)]" />

          {/* Inverted Corrupted Grid */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(239, 68, 68, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(147, 51, 234, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Upward Drifting Toxic Spores & Embers */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"
              style={{
                left: p.left,
                top: p.top,
                width: `${Math.max(2, parseInt(p.size) * 1.2)}px`,
                height: `${Math.max(2, parseInt(p.size) * 1.2)}px`,
                opacity: 0.65,
                animation: `sporeFloat ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}

          {/* Creeping Organic Vine Silhouette Vignette at Periphery */}
          <div className="absolute inset-0 pointer-events-none opacity-45 shadow-[inset_0_0_140px_rgba(153,27,27,0.7),inset_0_0_80px_rgba(88,28,135,0.6)]" />

          {/* Corrupted Dimensional Fissure in Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.3)_0%,rgba(147,51,234,0.15)_40%,transparent_70%)] blur-2xl" />
        </div>
      )}
    </div>
  );
}
