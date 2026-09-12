"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Crosshair,
  Activity,
  Globe,
  Gamepad2,
  Flame,
  Archive,
  Tv,
  Volume2,
  VolumeX,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DbCharacter, DbUser } from "@/lib/db/client";
import { soundscape } from "@/lib/audio/soundscape";
import { logoutAction } from "@/lib/auth/actions";
import { getLevelFromXP } from "@/lib/game/leveling";
import { SignalStatus } from "@/lib/game/streaks";
import { ActiveAnomalyData } from "@/components/events/ActiveAnomalyHUD";
import { SignalArchiveModal } from "@/components/events/SignalArchiveModal";

export interface SignalConsoleShellProps {
  children: React.ReactNode;
  user: DbUser;
  character: DbCharacter;
  corruption?: number;
  signalStatus?: SignalStatus;
  activeAnomaly?: ActiveAnomalyData | null;
  activeComeback?: any;
  realm?: "right-side" | "other-side";
}

interface NavItemDef {
  id: string;
  label: string;
  shortLabel: string;
  subLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "amber" | "purple" | "crimson" | "orange";
  isModalTrigger?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: "right-side",
    label: "RIGHT SIDE",
    shortLabel: "SANCTUARY",
    subLabel: "Main Terminal",
    href: "/right-side",
    icon: Compass,
    accent: "cyan",
  },
  {
    id: "mission-deck",
    label: "MISSION DECK",
    shortLabel: "MISSIONS",
    subLabel: "Active Objectives",
    href: "/right-side#mission-deck",
    icon: Crosshair,
    accent: "cyan",
  },
  {
    id: "core-attributes",
    label: "CORE ATTRIBUTES",
    shortLabel: "STATS",
    subLabel: "Player Attributes",
    href: "/right-side#core-attributes",
    icon: Activity,
    accent: "cyan",
  },
  {
    id: "dimensional-atlas",
    label: "DIMENSIONAL ATLAS",
    shortLabel: "ATLAS",
    subLabel: "Territory Map",
    href: "/right-side#dimensional-atlas",
    icon: Globe,
    accent: "crimson",
  },
  {
    id: "arcade",
    label: "THE ARCADE",
    shortLabel: "SHOP",
    subLabel: "Black Market",
    href: "/arcade",
    icon: Gamepad2,
    accent: "amber",
  },
  {
    id: "survival-protocol",
    label: "SURVIVAL PROTOCOL",
    shortLabel: "STREAKS",
    subLabel: "Streaks & Signal",
    href: "/right-side#survival-protocol",
    icon: Flame,
    accent: "orange",
  },
  {
    id: "signal-archive",
    label: "SIGNAL ARCHIVE",
    shortLabel: "ARCHIVE",
    subLabel: "Lore & Anomalies",
    href: "#signal-archive",
    icon: Archive,
    accent: "purple",
    isModalTrigger: true,
  },
];

export function SignalConsoleShell({
  children,
  user,
  character,
  corruption = 100,
  signalStatus,
  activeAnomaly,
  activeComeback,
  realm = "right-side",
}: SignalConsoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop sidebar collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCollapse = localStorage.getItem("signal_console_collapsed");
        if (savedCollapse !== null) {
          return savedCollapse === "true";
        }
      } catch {
        // Ignore localStorage restrictions
      }
    }
    return false;
  });

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Global Signal Archive modal state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Active in-page scroll section tracking on /right-side
  const [scrollSection, setScrollSection] = useState<string>("right-side");

  // System config state (CRT & Audio)
  const [isMuted, setIsMuted] = useState(() => (typeof window !== "undefined" ? soundscape.getMuted() : false));
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Derive active navigation item based on current pathname and scroll section
  const activeSection = useMemo(() => {
    if (pathname === "/arcade" || pathname === "/inventory") return "arcade";
    if (pathname === "/other-side") return "dimensional-atlas";
    if (pathname === "/right-side") return scrollSection;
    return "right-side";
  }, [pathname, scrollSection]);

  // Update localStorage when collapsed changes
  const toggleCollapse = useCallback(() => {
    soundscape.playHover();
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("signal_console_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Toggle audio
  const handleToggleAudio = () => {
    const nextMuted = soundscape.toggleMute();
    setIsMuted(nextMuted);
  };

  // Toggle CRT
  const handleToggleCrt = () => {
    const nextCrt = !crtEnabled;
    setCrtEnabled(nextCrt);
    const crtOverlay = document.getElementById("crt-global-overlay");
    if (crtOverlay) {
      crtOverlay.style.display = nextCrt ? "block" : "none";
    }
  };

  // Handle Logout
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

  // Scroll-spy observer on /right-side
  useEffect(() => {
    if (pathname !== "/right-side") return;

    const sectionIds = ["survival-protocol", "mission-deck", "core-attributes", "dimensional-atlas"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            setScrollSection(entry.target.id);
          }
        });
      },
      { threshold: [0.3], rootMargin: "-80px 0px -40% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobileOpen) setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  // Derive player level progression
  const progression = getLevelFromXP(character?.xp || 0);

  // Determine Signal Indicator telemetry status
  const signalTelemetry = useMemo(() => {
    if (realm === "other-side" || corruption > 60) {
      return {
        label: "SIGNAL DISTORTED",
        dotClass: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
        textClass: "text-red-400",
        pulse: true,
      };
    }
    if (activeAnomaly && !activeAnomaly.completed) {
      return {
        label: "ANOMALY DETECTED",
        dotClass: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
        textClass: "text-purple-300",
        pulse: true,
      };
    }
    if (activeComeback && !activeComeback.completed) {
      return {
        label: "SIGNAL RECOVERING",
        dotClass: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
        textClass: "text-amber-300",
        pulse: true,
      };
    }
    if (signalStatus) {
      return {
        label: signalStatus.status,
        dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
        textClass: "text-emerald-300",
        pulse: false,
      };
    }
    return {
      label: "SIGNAL STABLE",
      dotClass: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
      textClass: "text-cyan-300",
      pulse: false,
    };
  }, [realm, corruption, activeAnomaly, activeComeback, signalStatus]);

  // Handle navigation click (smooth scroll on /right-side or regular route change)
  const handleNavClick = (item: NavItemDef, e: React.MouseEvent) => {
    soundscape.playHover();
    if (isMobileOpen) setIsMobileOpen(false);

    if (item.isModalTrigger) {
      e.preventDefault();
      setIsArchiveOpen(true);
      return;
    }

    // If anchor on right-side
    if (item.href.startsWith("/right-side#")) {
      const targetId = item.href.split("#")[1];
      if (pathname === "/right-side") {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", `#${targetId}`);
          setScrollSection(targetId);

          // Subtle signal pulse highlight on the target container
          el.classList.add("ring-2", "ring-cyan-400/80", "transition-all", "duration-500");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-cyan-400/80");
          }, 1200);
        }
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-[#030104] text-slate-100 overflow-x-hidden">
      {/* ------------------------------------------------------------------- */}
      {/* MOBILE TOP HEADER (Visible on < lg screens) */}
      {/* ------------------------------------------------------------------- */}
      <header
        className="lg:hidden sticky top-0 z-40 w-full h-14 bg-[#030611]/90 backdrop-blur-md border-b border-cyan-950/80 px-4 flex items-center justify-between"
        aria-label="Mobile Navigation Bar"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xs border border-cyan-900/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
            aria-label="Open Signal Console Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/right-side" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-xs border border-red-600/80 bg-red-950/40 flex items-center justify-center text-red-500 font-cinzel font-black text-xs group-hover:bg-red-600 group-hover:text-black transition-colors shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              Ω
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-xs font-black tracking-widest text-white group-hover:text-cyan-300 transition-colors">
                THE OTHER SIDE
              </span>
              <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">
                SIGNAL CONSOLE
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile Right Badges: Level & Credits */}
        <div className="flex items-center gap-2">
          <Link
            href="/arcade"
            className="px-2 py-0.5 rounded-xs bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
          >
            <Coins className="w-3 h-3 text-amber-400" />
            <span>◈ {character.credits}</span>
          </Link>

          <span className="px-2 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            LVL {String(character.level).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* MOBILE DRAWER (Slide-in drawer with backdrop) */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-[280px] max-w-[85vw] h-full bg-[#030611] border-r border-cyan-950/90 shadow-2xl flex flex-col justify-between overflow-y-auto z-10"
              aria-label="Mobile Signal Console Drawer"
            >
              {/* Drawer Header */}
              <div>
                <div className="p-4 border-b border-cyan-950/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xs border border-red-600/80 bg-red-950/40 flex items-center justify-center text-red-500 font-cinzel font-black text-sm">
                      Ω
                    </div>
                    <div>
                      <h2 className="font-cinzel text-xs font-black tracking-widest text-white">
                        THE OTHER SIDE
                      </h2>
                      <span className="text-[10px] font-mono text-cyan-400 tracking-wider">
                        {user.username ? `${user.username.toUpperCase()} // CONSOLE` : "SIGNAL CONSOLE"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-xs border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                    aria-label="Close Signal Console Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Signal Telemetry */}
                <div className="px-4 py-2.5 bg-black/40 border-b border-cyan-950/60 flex items-center gap-2 font-mono text-[10px]">
                  <span className={cn("w-2 h-2 rounded-full", signalTelemetry.dotClass, signalTelemetry.pulse && "animate-ping")} />
                  <span className={cn("font-bold tracking-wider uppercase", signalTelemetry.textClass)}>
                    ● {signalTelemetry.label}
                  </span>
                </div>

                {/* Nav Links */}
                <nav className="p-3 space-y-1.5" aria-label="Mobile Links">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.isModalTrigger
                        ? isArchiveOpen
                        : item.id === activeSection ||
                          (item.id === "right-side" && activeSection === "right-side" && pathname === "/right-side");

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={(e) => handleNavClick(item, e)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xs border transition-all text-xs font-mono",
                          isActive
                            ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                            : "border-slate-900 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-800"
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-4 h-4", isActive ? "text-cyan-400" : "text-slate-400")} />
                          <div>
                            <div className="font-bold tracking-wider">{item.label}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{item.subLabel}</div>
                          </div>
                        </div>

                        {isActive && (
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                            ACTIVE
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom Status */}
              <div className="p-4 border-t border-cyan-950/80 bg-black/60 space-y-3">
                {/* Character Level & XP */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-300 font-bold font-orbitron">
                      LEVEL {String(character.level).padStart(2, "0")}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {progression.currentLevelXP} / {progression.nextLevelXP} XP
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black border border-slate-800 rounded-xs overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                      style={{ width: `${progression.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Credits & Corruption row */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xs bg-slate-950/80 border border-amber-500/30">
                    <div className="text-[9px] text-slate-400 uppercase">Credits</div>
                    <div className="text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>{character.credits.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xs bg-slate-950/80 border border-slate-800">
                    <div className="text-[9px] text-slate-400 uppercase">Corruption</div>
                    <div className={cn("font-bold mt-0.5", corruption > 60 ? "text-red-400" : "text-cyan-400")}>
                      {corruption}%
                    </div>
                  </div>
                </div>

                {/* Quick Controls */}
                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleToggleCrt}
                      className={cn(
                        "p-1.5 rounded-xs border text-[10px] flex items-center gap-1",
                        crtEnabled ? "bg-cyan-950/60 border-cyan-500 text-cyan-300" : "bg-black border-slate-800 text-slate-500"
                      )}
                      aria-label="Toggle CRT filter"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>CRT</span>
                    </button>
                    <button
                      onClick={handleToggleAudio}
                      className={cn(
                        "p-1.5 rounded-xs border text-[10px] flex items-center gap-1",
                        !isMuted ? "bg-amber-950/60 border-amber-500 text-amber-300" : "bg-black border-slate-800 text-slate-500"
                      )}
                      aria-label="Toggle audio synth FX"
                    >
                      {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="px-2 py-1 rounded-xs border border-red-900/60 bg-red-950/30 text-red-400 hover:text-red-200 text-xs font-mono flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>LOGOUT</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------- */}
      {/* DESKTOP PERSISTENT SIDEBAR (Visible on >= lg screens) */}
      {/* ------------------------------------------------------------------- */}
      <aside
        className={cn(
          "hidden lg:flex flex-col justify-between shrink-0 h-screen sticky top-0 bg-[#030611]/95 backdrop-blur-md border-r border-cyan-950/80 transition-all duration-300 z-30 select-none",
          isCollapsed ? "w-[72px]" : "w-[268px]"
        )}
        aria-label="Signal Console Main Navigation"
      >
        {/* Top Header & Navigation Links */}
        <div className="flex flex-col overflow-y-auto no-scrollbar">
          {/* Header Row */}
          <div className="p-4 border-b border-cyan-950/80 flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <Link href="/right-side" className="flex items-center gap-2.5 group overflow-hidden">
                <div className="w-8 h-8 rounded-xs border border-red-600/80 bg-red-950/40 flex items-center justify-center text-red-500 font-cinzel font-black text-sm group-hover:bg-red-600 group-hover:text-black transition-colors shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0">
                  Ω
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-cinzel text-xs font-black tracking-widest text-white group-hover:text-cyan-300 transition-colors truncate">
                    THE OTHER SIDE
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400/90 tracking-widest uppercase truncate">
                    {user.username ? `${user.username.toUpperCase()} // CONSOLE` : "SIGNAL CONSOLE"}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href="/right-side"
                className="w-8 h-8 rounded-xs border border-red-600/80 bg-red-950/40 flex items-center justify-center text-red-500 font-cinzel font-black text-sm hover:bg-red-600 hover:text-black transition-colors shadow-[0_0_10px_rgba(239,68,68,0.4)] mx-auto"
                title="Return to Sanctuary"
              >
                Ω
              </Link>
            )}

            {/* Desktop Collapse / Expand Button */}
            <button
              id="signal-console-toggle-btn"
              onClick={toggleCollapse}
              className={cn(
                "p-1.5 rounded-xs border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer",
                isCollapsed && "hidden"
              )}
              title={isCollapsed ? "Expand Signal Console" : "Collapse Signal Console"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* When collapsed, show expand button in header */}
          {isCollapsed && (
            <div className="py-2 flex justify-center border-b border-cyan-950/60">
              <button
                onClick={toggleCollapse}
                className="p-1 rounded-xs text-slate-500 hover:text-cyan-300 transition-colors"
                title="Expand Signal Console"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live Status Telemetry Indicator */}
          {!isCollapsed ? (
            <div className="px-4 py-2 bg-black/40 border-b border-cyan-950/60 flex items-center gap-2 font-mono text-[10px]">
              <span className={cn("w-2 h-2 rounded-full shrink-0", signalTelemetry.dotClass, signalTelemetry.pulse && "animate-ping")} />
              <span className={cn("font-bold tracking-wider uppercase truncate", signalTelemetry.textClass)}>
                ● {signalTelemetry.label}
              </span>
            </div>
          ) : (
            <div className="py-2 flex justify-center border-b border-cyan-950/60" title={signalTelemetry.label}>
              <span className={cn("w-2.5 h-2.5 rounded-full", signalTelemetry.dotClass, signalTelemetry.pulse && "animate-pulse")} />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5" aria-label="Signal Console Links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.isModalTrigger
                  ? isArchiveOpen
                  : item.id === activeSection ||
                    (item.id === "right-side" && activeSection === "right-side" && pathname === "/right-side");

              return (
                <div key={item.id} className="relative group">
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={cn(
                      "flex items-center rounded-xs border transition-all text-xs font-mono group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer",
                      isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                      isActive
                        ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-800"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />

                      {!isCollapsed && (
                        <div className="min-w-0 text-left">
                          <div className="font-bold tracking-wider truncate">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate">
                            {item.subLabel}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isCollapsed && isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)] shrink-0 animate-pulse" />
                    )}
                  </Link>

                  {/* Floating Retro Tooltip for Collapsed Sidebar */}
                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-950/95 border border-cyan-500/70 text-cyan-200 font-mono text-xs rounded-xs shadow-[0_0_15px_rgba(0,0,0,0.8)] opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                    >
                      <div className="font-bold text-white tracking-wider">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.subLabel}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Real Player Telemetry & System Config */}
        <div className="p-3 border-t border-cyan-950/80 bg-black/60 space-y-3">
          {!isCollapsed ? (
            <>
              {/* Character Level & XP Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold font-orbitron tracking-wider">
                    LEVEL {String(character.level).padStart(2, "0")}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {progression.currentLevelXP} / {progression.nextLevelXP} XP
                  </span>
                </div>

                <div className="w-full h-2 bg-black border border-slate-800 rounded-xs overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-500"
                    style={{ width: `${progression.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Real Credits & Corruption Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <Link
                  href="/arcade"
                  className="p-1.5 rounded-xs bg-slate-950/80 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 transition-colors block"
                  title="Arcade Credits"
                >
                  <div className="text-[9px] text-slate-400 uppercase">Credits</div>
                  <div className="text-amber-300 font-bold flex items-center gap-1 mt-0.5 truncate">
                    <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{character.credits.toLocaleString()}</span>
                  </div>
                </Link>

                <div
                  className="p-1.5 rounded-xs bg-slate-950/80 border border-slate-800 block"
                  title="World Corruption Level"
                >
                  <div className="text-[9px] text-slate-400 uppercase">Corruption</div>
                  <div
                    className={cn(
                      "font-bold mt-0.5 truncate",
                      corruption > 60 ? "text-red-400" : "text-cyan-400"
                    )}
                  >
                    {corruption}%
                  </div>
                </div>
              </div>

              {/* System Config (CRT & Synth Audio) + Logout */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono border-t border-slate-900">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleCrt}
                    className={cn(
                      "p-1.5 rounded-xs border text-[10px] flex items-center gap-1 transition-colors cursor-pointer",
                      crtEnabled
                        ? "bg-cyan-950/60 border-cyan-500 text-cyan-300"
                        : "bg-black border-slate-800 text-slate-500"
                    )}
                    title={crtEnabled ? "Disable CRT scanlines" : "Enable CRT scanlines"}
                    aria-label="Toggle CRT filter"
                  >
                    <Tv className="w-3 h-3" />
                    <span className="text-[9px]">CRT</span>
                  </button>

                  <button
                    onClick={handleToggleAudio}
                    className={cn(
                      "p-1.5 rounded-xs border text-[10px] flex items-center gap-1 transition-colors cursor-pointer",
                      !isMuted
                        ? "bg-amber-950/60 border-amber-500 text-amber-300"
                        : "bg-black border-slate-800 text-slate-500"
                    )}
                    title={isMuted ? "Unmute synth sound FX" : "Mute synth sound FX"}
                    aria-label="Toggle sound FX"
                  >
                    {!isMuted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-1.5 sm:px-2 sm:py-1 rounded-xs border border-red-900/60 bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Log out from session"
                  aria-label="Log out"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="text-[10px]">{loggingOut ? "..." : "LOGOUT"}</span>
                </button>
              </div>
            </>
          ) : (
            /* Collapsed Bottom HUD Icons */
            <div className="flex flex-col items-center space-y-2.5">
              <div
                className="w-8 h-8 rounded-xs bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center cursor-default"
                title={`Level ${character.level} (${progression.progressPercent}% XP)`}
              >
                L{character.level}
              </div>

              <button
                onClick={handleToggleAudio}
                className={cn(
                  "p-1.5 rounded-xs border transition-colors",
                  !isMuted ? "text-amber-300 border-amber-500/60" : "text-slate-600 border-slate-800"
                )}
                title={isMuted ? "Unmute sound" : "Mute sound"}
                aria-label="Toggle sound"
              >
                {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 rounded-xs border border-red-900/60 text-red-400 hover:bg-red-950/50 transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN CONTENT WORKSPACE (Adjusts smoothly as sidebar expands/collapses) */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        {children}
      </div>

      {/* Global Signal Archive Modal */}
      <SignalArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
      />
    </div>
  );
}
