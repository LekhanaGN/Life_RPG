"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { soundscape } from "@/lib/audio/soundscape";
import { Badge } from "@/components/ui/Badge";
import { Volume2, VolumeX, Tv, Radio, Compass, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorldNavigationProps {
  currentRealm: "landing" | "right-side" | "other-side";
}

export function WorldNavigation({ currentRealm }: WorldNavigationProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);

  useEffect(() => {
    setIsMuted(soundscape.getMuted());
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = soundscape.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleToggleCrt = () => {
    setCrtEnabled(!crtEnabled);
    const crtOverlay = document.getElementById("crt-global-overlay");
    if (crtOverlay) {
      crtOverlay.style.display = crtEnabled ? "none" : "block";
    }
  };

  const realmConfig = {
    landing: {
      badge: "GATEWAY #00",
      label: "LIMINAL FOREST",
      variant: "slate" as const,
      pulse: false,
    },
    "right-side": {
      badge: "DIMENSION PRIME",
      label: "THE RIGHT SIDE",
      variant: "cyan" as const,
      pulse: true,
    },
    "other-side": {
      badge: "CORRUPTED SECTOR",
      label: "THE OTHER SIDE",
      variant: "crimson" as const,
      pulse: true,
    },
  };

  const current = realmConfig[currentRealm];

  return (
    <header className="relative z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Monogram & Realm Status */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xs"
            title="Return to Gateway"
          >
            <div className="w-8 h-8 rounded-xs border border-red-600/80 bg-red-950/30 flex items-center justify-center text-red-500 font-cinzel font-black text-sm group-hover:bg-red-600 group-hover:text-black transition-colors shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              Ω
            </div>
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-slate-100 group-hover:text-red-400 transition-colors hidden xs:inline">
              THE OTHER SIDE
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/15">
            <Badge variant={current.variant} pulse={current.pulse}>
              {current.badge}
            </Badge>
          </div>
        </div>

        {/* Center: Realm Status Info */}
        <div className="flex items-center gap-2">
          {currentRealm === "right-side" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-xs">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono text-cyan-300 tracking-wider">
                DIMENSIONAL STABILITY: 100% [HARMONIC]
              </span>
            </div>
          )}

          {currentRealm === "other-side" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-950/40 border border-red-600/40 rounded-xs animate-pulse">
              <Skull className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] font-mono text-red-400 tracking-wider">
                DIMENSIONAL STABILITY: 32% [CRITICAL BREACH]
              </span>
            </div>
          )}

          {currentRealm === "landing" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-700/50 rounded-xs">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-mono text-slate-300 tracking-wider">
                TRANSMISSION FREQUENCY: 84.1 MHz
              </span>
            </div>
          )}
        </div>

        {/* Right: Controls & Toggles */}
        <div className="flex items-center gap-2">
          {/* CRT Filter Toggle */}
          <button
            onClick={handleToggleCrt}
            className={cn(
              "p-2 rounded-xs border transition-all text-xs font-mono flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              crtEnabled
                ? "bg-slate-900/90 border-slate-600 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                : "bg-black/40 border-slate-800 text-slate-500"
            )}
            title={crtEnabled ? "Disable CRT scanline effect" : "Enable CRT scanline effect"}
            aria-label="Toggle CRT filter"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">CRT {crtEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Audio Synthesizer FX Toggle */}
          <button
            onClick={handleToggleAudio}
            className={cn(
              "p-2 rounded-xs border transition-all text-xs font-mono flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
              !isMuted
                ? "bg-slate-900/90 border-slate-600 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                : "bg-black/40 border-slate-800 text-slate-500"
            )}
            title={isMuted ? "Unmute atmospheric 80s synthesizer FX" : "Mute sound FX"}
            aria-label="Toggle soundscape audio"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">AUDIO MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">SYNTH FX</span>
              </>
            )}
          </button>

          {/* Quick realm shortcut pill */}
          {currentRealm !== "landing" && (
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-xs border border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:border-slate-600 text-[11px] font-mono tracking-wider transition-colors"
            >
              GATEWAY
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
