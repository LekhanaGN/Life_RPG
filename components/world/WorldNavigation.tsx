"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { soundscape } from "@/lib/audio/soundscape";
import { logoutAction } from "@/lib/auth/actions";
import { DbCharacter, DbUser } from "@/lib/db/client";
import { Badge } from "@/components/ui/Badge";
import {
  Volume2,
  VolumeX,
  Tv,
  Radio,
  Compass,
  Skull,
  LogOut,
  User,
  Shield,
  Gamepad2,
  Package,
  Coins,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorldNavigationProps {
  currentRealm: "landing" | "right-side" | "other-side";
  user?: DbUser | null;
  character?: DbCharacter | null;
}

export function WorldNavigation({
  currentRealm,
  user,
  character,
}: WorldNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState(() => soundscape.getMuted());
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    soundscape.playGlitch();
    try {
      const res = await logoutAction();
      router.push(res.redirectUrl || "/auth/login");
      router.refresh();
    } catch {
      router.push("/auth/login");
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
    <header className="relative z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top Row / Left: Brand Monogram & Primary World Links */}
        <div className="flex items-center justify-between gap-3">
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

          {/* Mobile Right Controls */}
          {character && (
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/arcade"
                className="px-2 py-1 rounded-xs bg-amber-950/60 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>◈ {character.credits}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Center: In-Game Nav Navigation Links (when authenticated) */}
        {character && (
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <Link
              href="/right-side"
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                pathname === "/right-side"
                  ? "bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>MISSIONS</span>
            </Link>

            <Link
              href="/arcade"
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                pathname === "/arcade"
                  ? "bg-amber-950 border-amber-400 text-amber-200 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span>SHOP</span>
            </Link>

            <Link
              href="/inventory"
              className={cn(
                "px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border",
                pathname === "/inventory"
                  ? "bg-purple-950 border-purple-400 text-purple-200 font-bold shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                  : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              <Package className="w-3.5 h-3.5 text-purple-400" />
              <span>INVENTORY</span>
            </Link>
          </nav>
        )}

        {/* Right: Credits, Survivor Profile, Audio & CRT Controls */}
        <div className="flex items-center gap-2 self-end md:self-center">
          {/* Authenticated Survivor & Clickable Credits Counter */}
          {character ? (
            <div className="flex items-center gap-2">
              <Link
                href="/arcade"
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xs bg-slate-900/90 hover:bg-amber-950/60 border border-amber-500/50 hover:border-amber-400 text-xs font-mono text-amber-300 font-bold transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer"
                title="Visit Shop to spend Credits"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>◈ {character.credits.toLocaleString()} CREDITS</span>
              </Link>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xs bg-slate-900/90 border border-slate-700 text-xs font-mono">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white font-bold tracking-wider hidden sm:inline">
                  {character.name}
                </span>
                <span className="px-1.5 py-0.2 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-[10px] uppercase font-bold">
                  {character.archetype}
                </span>
              </div>

              {/* Logout Button */}
              <button
                id="logout-btn"
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xs border border-red-900/60 bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors text-xs font-mono flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {loggingOut ? "LOGGING OUT..." : "LOG OUT"}
                </span>
              </button>
            </div>
          ) : (
            currentRealm === "landing" && (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-2.5 py-1 rounded-xs border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono tracking-wider transition-colors"
                >
                  LOG IN
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-2.5 py-1 rounded-xs border border-red-500/50 bg-red-950/40 hover:bg-red-500/20 text-red-300 text-xs font-mono tracking-wider transition-colors hidden xs:inline-block"
                >
                  SIGN UP
                </Link>
              </div>
            )
          )}

          {/* CRT Filter Toggle */}
          <button
            onClick={handleToggleCrt}
            className={cn(
              "p-2 rounded-xs border transition-all text-xs font-mono flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer",
              crtEnabled
                ? "bg-slate-900/90 border-slate-600 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                : "bg-black/40 border-slate-800 text-slate-500"
            )}
            title={crtEnabled ? "Disable CRT scanline effect" : "Enable CRT scanline effect"}
            aria-label="Toggle CRT filter"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">CRT {crtEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Audio Synthesizer FX Toggle */}
          <button
            onClick={handleToggleAudio}
            className={cn(
              "p-2 rounded-xs border transition-all text-xs font-mono flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer",
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
                <span className="hidden xl:inline">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">SYNTH FX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
