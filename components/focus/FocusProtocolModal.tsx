"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Clock,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Loader2,
  Lock,
} from "lucide-react";
import { DbMission } from "@/lib/missions/types";
import { DbFocusSession } from "@/lib/db/client";
import {
  FOCUS_PRIVACY_DISCLOSURE,
  formatSignalIntegrityDisplay,
} from "@/lib/game/verification";
import { soundscape } from "@/lib/audio/soundscape";
import { VerificationBadge } from "../missions/VerificationBadge";

interface FocusProtocolModalProps {
  mission: DbMission | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionVerified: (mission: DbMission) => void;
  onProceedToComplete?: (mission: DbMission) => void;
}

export function FocusProtocolModal({
  mission,
  isOpen,
  onClose,
  onSessionVerified,
  onProceedToComplete,
}: FocusProtocolModalProps) {
  const [session, setSession] = useState<DbFocusSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAborting, setIsAborting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedActive, setElapsedActive] = useState(0);
  const [requiredSeconds, setRequiredSeconds] = useState(25 * 60);
  const [signalIntegrity, setSignalIntegrity] = useState(88);
  const [isVerified, setIsVerified] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [accessibleAnnouncement, setAccessibleAnnouncement] = useState("");

  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localTickRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimestamp = useRef<number>(0);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Activity detection
  useEffect(() => {
    lastActivityTimestamp.current = Date.now();
    const handleActivity = () => {
      lastActivityTimestamp.current = Date.now();
    };
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Check and restore active session if modal opened
  useEffect(() => {
    if (!isOpen || !mission) {
      setSession(null);
      setIsVerified(false);
      setError(null);
      return;
    }

    const durationMins = mission.focusDurationMinutes || 25;
    setRequiredSeconds(durationMins * 60);
    setElapsedActive(0);
    setIsVerified(false);
    setError(null);
  }, [isOpen, mission]);

  // Finish session
  const handleFinishSession = useCallback(async (sessionId: string) => {
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/focus/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true);
        setSession(data.session);
        if (data.signalIntegrity) {
          setSignalIntegrity(data.signalIntegrity);
        }
        soundscape.playRestoration();
        setAccessibleAnnouncement(
          `Focus protocol verified. Signal integrity: ${data.signalIntegrity}%. Mission ready to complete.`
        );
        if (mission) onSessionVerified(mission);
      } else {
        setError(data.error || "Required focus duration not reached.");
      }
    } catch (err) {
      console.error("[Focus Finish Error]:", err);
    } finally {
      setIsFinishing(false);
    }
  }, [mission, onSessionVerified]);

  // Periodic heartbeat sender
  const sendHeartbeat = useCallback(async (sessionId: string) => {
    try {
      // Determine client state based on activity and visibility
      const secondsSinceActivity = (Date.now() - lastActivityTimestamp.current) / 1000;
      const isIdle = document.hidden || secondsSinceActivity > 120;
      const clientState = isIdle ? "IDLE" : "ACTIVE";

      const res = await fetch(`/api/focus/${sessionId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: clientState }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          setElapsedActive(data.session.accumulatedActiveSeconds);
          if (data.signalIntegrity) {
            setSignalIntegrity(data.signalIntegrity);
          }
        }
      }
    } catch (err) {
      // Network tolerance: missed heartbeat will not immediately kill session
      console.warn("[Focus Heartbeat Soft Failure]:", err);
    }
  }, []);

  // Local ticker for UI responsiveness
  useEffect(() => {
    if (!session || session.status !== "ACTIVE" || isPaused || isVerified) {
      if (localTickRef.current) clearInterval(localTickRef.current);
      return;
    }

    localTickRef.current = setInterval(() => {
      setElapsedActive((prev) => {
        const next = prev + 1;
        if (next >= requiredSeconds) {
          // Time fulfilled locally -> trigger verification
          handleFinishSession(session.id);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (localTickRef.current) clearInterval(localTickRef.current);
    };
  }, [session, isPaused, isVerified, requiredSeconds, handleFinishSession]);

  // Heartbeat loop every 20 seconds
  useEffect(() => {
    if (!session || session.status !== "ACTIVE" || isPaused || isVerified) {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      return;
    }

    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat(session.id);
    }, 20000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [session, isPaused, isVerified, sendHeartbeat]);

  // Start protocol
  const handleStartSession = async () => {
    if (!mission) return;
    setIsInitializing(true);
    setError(null);
    soundscape.playHover();

    try {
      const res = await fetch("/api/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: mission.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to initialize Focus Protocol.");
        soundscape.playGlitch();
        return;
      }

      setSession(data.session);
      setRequiredSeconds(data.session.requiredDurationSeconds);
      setElapsedActive(data.session.accumulatedActiveSeconds);
      setIsPaused(data.session.status === "PAUSED");
      setAccessibleAnnouncement("Focus protocol active. Session timer running.");
      soundscape.playRestoration();
    } catch (err) {
      console.error("[Focus Start Error]:", err);
      setError("Network anomaly: Could not establish session anchor.");
      soundscape.playGlitch();
    } finally {
      setIsInitializing(false);
    }
  };

  // Pause / Resume session
  const handleTogglePause = async () => {
    if (!session) return;
    const nextAction = isPaused ? "RESUME" : "PAUSE";
    soundscape.playHover();

    try {
      const res = await fetch(`/api/focus/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextAction }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsPaused(nextAction === "PAUSE");
        setSession(data.session);
        setAccessibleAnnouncement(
          nextAction === "PAUSE"
            ? "Focus protocol paused."
            : "Focus protocol resumed. Timer continuing."
        );
      }
    } catch (err) {
      console.warn("[Focus Pause/Resume Error]:", err);
    }
  };

  // Abort session
  const handleAbort = async () => {
    if (!session) {
      onClose();
      return;
    }
    setIsAborting(true);
    soundscape.playGlitch();

    try {
      await fetch(`/api/focus/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      setSession(null);
      setAccessibleAnnouncement("Focus protocol aborted.");
      onClose();
    } catch (err) {
      console.error("[Focus Abort Error]:", err);
      onClose();
    } finally {
      setIsAborting(false);
    }
  };

  if (!isOpen || !mission) return null;

  const remainingSeconds = Math.max(0, requiredSeconds - elapsedActive);
  const progressRatio = Math.min(1, Math.max(0, elapsedActive / requiredSeconds));
  const integrityDisplay = formatSignalIntegrityDisplay(signalIntegrity);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Screen Reader ARIA Live Region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {accessibleAnnouncement}
        </div>

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!session ? onClose : undefined}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* CRT Focus Terminal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg bg-slate-950 border-2 border-amber-500/60 rounded-xs shadow-[0_0_35px_rgba(251,191,36,0.25)] p-6 z-10 space-y-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-protocol-title"
        >
          {/* Decorative Corner Accents */}
          <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <VerificationBadge type="FOCUS_SESSION" size="sm" />
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                  AUTHORITATIVE TELEMETRY
                </span>
              </div>
              <h3
                id="focus-protocol-title"
                className="text-lg font-orbitron font-bold text-amber-300 uppercase tracking-wide flex items-center gap-2"
              >
                <Crosshair className="w-5 h-5 text-amber-400" />
                <span>FOCUS PROTOCOL</span>
              </h3>
              <p className="text-xs font-mono text-slate-300 truncate max-w-sm mt-0.5">
                Objective: <span className="text-amber-200">{mission.title}</span>
              </p>
            </div>
            {!session && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body Content */}
          {!session && !isVerified ? (
            /* Pre-session Setup & Privacy Statement */
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Protocol Duration: {mission.focusDurationMinutes || 25} Minutes</span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  This mission requires a monitored focus session. The server will track timing
                  continuity and active signal integrity.
                </p>
              </div>

              {/* Privacy Guarantee Disclosure */}
              <div className="p-3.5 bg-slate-900/80 border border-slate-700/80 rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>{FOCUS_PRIVACY_DISCLOSURE.title}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                  {FOCUS_PRIVACY_DISCLOSURE.statement}
                </p>
                <ul className="text-[10px] font-mono text-slate-400 space-y-1 list-disc list-inside">
                  {FOCUS_PRIVACY_DISCLOSURE.prohibitions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xs text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xs bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-slate-300 hover:text-slate-100"
                >
                  RETURN
                </button>
                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={isInitializing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-pointer disabled:opacity-50"
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black" />
                      <span>BEGIN FOCUS SESSION</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : !isVerified ? (
            /* Active Session Running State */
            <div className="space-y-5 text-center">
              {/* Status Header */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-slate-900/90 border border-amber-500/40 text-xs font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPaused
                      ? "bg-amber-400 animate-pulse"
                      : isTabHidden
                      ? "bg-yellow-400"
                      : "bg-emerald-400 animate-ping"
                  }`}
                />
                <span className="uppercase text-slate-200 font-semibold tracking-wider">
                  {isPaused
                    ? "PROTOCOL PAUSED"
                    : isTabHidden
                    ? "SIGNAL WAITING (TAB BACKGROUNDED)"
                    : "SESSION ACTIVE // SIGNAL STABLE"}
                </span>
              </div>

              {/* Big Prominent Countdown Timer */}
              <div className="py-2">
                <div
                  className="text-5xl sm:text-6xl font-orbitron font-extrabold text-amber-300 tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
                >
                  {formatTime(remainingSeconds)}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                  Elapsed Active: {formatTime(elapsedActive)} / {formatTime(requiredSeconds)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 max-w-md mx-auto">
                <div className="h-2 w-full bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
              </div>

              {/* Signal Integrity Telemetry */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-wider">SIGNAL INTEGRITY</span>
                  <span className="text-amber-400 font-bold font-mono">
                    {integrityDisplay.percentageText}
                  </span>
                </div>
                <div
                  className="text-sm font-mono text-amber-400 tracking-widest"
                  aria-hidden="true"
                >
                  {integrityDisplay.blocks}
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Authoritative server heartbeat running. Client cannot forge elapsed duration.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xs text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* In-Session Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAbort}
                  disabled={isAborting}
                  className="px-3.5 py-1.5 rounded-xs bg-red-950/40 hover:bg-red-950/80 border border-red-800/60 text-xs font-mono uppercase text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                >
                  {isAborting ? "ABORTING..." : "ABORT SESSION"}
                </button>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 border border-amber-500/60 text-xs font-mono uppercase tracking-wider text-amber-300 transition-colors cursor-pointer"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-amber-300" />
                      <span>RESUME</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-amber-300" />
                      <span>PAUSE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Session Verified Confirmation */
            <div className="space-y-4 py-2 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-950/80 border-2 border-amber-400 text-amber-300 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-orbitron font-bold text-amber-300 uppercase tracking-wide">
                  SESSION VERIFIED
                </h4>
                <p className="text-xs font-mono text-slate-300">
                  The signal remained stable across the dimensional barrier.
                </p>
              </div>

              {/* Final Signal Integrity Score */}
              <div className="p-3.5 bg-slate-900/90 border border-amber-500/60 rounded-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 uppercase">SIGNAL INTEGRITY</span>
                  <span className="text-amber-300 font-bold">{signalIntegrity}%</span>
                </div>
                <div className="text-sm font-mono text-amber-400 tracking-widest" aria-hidden="true">
                  {integrityDisplay.blocks}
                </div>
                <p className="text-[10px] font-mono text-slate-400">
                  Verification verified by server protocol. Mission is authorized for completion.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xs bg-slate-900 border border-slate-700 text-xs font-mono uppercase text-slate-300 hover:text-slate-100"
                >
                  CLOSE
                </button>
                {onProceedToComplete && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onProceedToComplete(mission);
                    }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xs bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>COMPLETE MISSION</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
