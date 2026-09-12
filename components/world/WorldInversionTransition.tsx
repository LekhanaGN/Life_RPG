"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { soundscape } from "@/lib/audio/soundscape";

export type TransitionType =
  | "landing-to-right"
  | "right-to-other"
  | "other-to-right";

interface WorldTransitionContextType {
  isTransitioning: boolean;
  transitionType: TransitionType | null;
  triggerTransition: (targetUrl: string, type: TransitionType) => void;
}

const WorldTransitionContext = createContext<WorldTransitionContextType>({
  isTransitioning: false,
  transitionType: null,
  triggerTransition: () => {},
});

export const useWorldTransition = () => useContext(WorldTransitionContext);

export function WorldTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType | null>(null);
  const [stage, setStage] = useState<number>(0);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  const triggerTransition = useCallback(
    (targetUrl: string, type: TransitionType) => {
      if (isTransitioning) return;

      setIsTransitioning(true);
      setTransitionType(type);

      // Play matching procedural 80s audio sting
      if (type === "other-to-right") {
        soundscape.playRestoration();
      } else {
        soundscape.playInversion();
      }

      // If user prefers reduced motion, navigate gracefully with minimal delay
      if (prefersReducedMotion) {
        setTimeout(() => {
          router.push(targetUrl);
          setTimeout(() => {
            setIsTransitioning(false);
            setTransitionType(null);
          }, 300);
        }, 300);
        return;
      }

      // 8-stage cinematic sequence lasting ~1.6 seconds
      // Stage 1: Strong button response / energy flare (0ms)
      setStage(1);

      // Stage 2: Glow spreading across screen (200ms)
      setTimeout(() => setStage(2), 200);

      // Stage 3: Screen gradually darkens / CRT collapse (450ms)
      setTimeout(() => setStage(3), 450);

      // Stage 4: Distortion & glitch tear lines (750ms)
      setTimeout(() => setStage(4), 750);

      // Stage 5: Background warping / vortex stretch (1000ms)
      setTimeout(() => setStage(5), 1000);

      // Stage 6 & 7: Portal fissure & inversion flash (1250ms)
      setTimeout(() => setStage(6), 1250);

      // Stage 8: Route transition & fade into new world (1500ms)
      setTimeout(() => {
        router.push(targetUrl);
        setTimeout(() => {
          setIsTransitioning(false);
          setTransitionType(null);
          setStage(0);
        }, 500);
      }, 1500);
    },
    [isTransitioning, prefersReducedMotion, router]
  );

  const isRestoration = transitionType === "other-to-right";

  return (
    <WorldTransitionContext.Provider
      value={{ isTransitioning, transitionType, triggerTransition }}
    >
      {children}

      {/* Cinematic Fullscreen World Inversion Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="status"
            aria-live="assertive"
          >
            {/* Stage 1 & 2: Radial Energy Spread */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{
                scale: stage >= 2 ? 2.5 : 1,
                opacity: stage >= 2 ? 0.9 : 0.4,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: isRestoration
                  ? "radial-gradient(circle, rgba(34,211,238,0.75) 0%, rgba(14,165,233,0.3) 40%, transparent 75%)"
                  : "radial-gradient(circle, rgba(255,26,36,0.85) 0%, rgba(185,28,28,0.4) 45%, transparent 75%)",
              }}
            />

            {/* Stage 3: Ambient Darkening & CRT Vignette Pinch */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 3 ? (stage >= 6 ? 0.98 : 0.75) : 0 }}
              transition={{ duration: 0.4 }}
            />

            {/* Stage 4: CRT Glitch Scanlines & Horizontal Tear Displacements */}
            {stage >= 4 && (
              <div className="absolute inset-0 pointer-events-none animate-glitch-tear opacity-85 mix-blend-screen">
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: isRestoration
                      ? "repeating-linear-gradient(0deg, rgba(34,211,238,0.3) 0px, transparent 2px, transparent 5px)"
                      : "repeating-linear-gradient(0deg, rgba(255,26,36,0.4) 0px, transparent 2px, transparent 4px)",
                  }}
                />
              </div>
            )}

            {/* Stage 5: Vortex Space Warp */}
            {stage >= 5 && (
              <motion.div
                className="absolute w-[200vw] h-[200vh] pointer-events-none rounded-full"
                initial={{ rotate: 0, scale: 0.8 }}
                animate={{ rotate: isRestoration ? -180 : 180, scale: 1.4 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{
                  background: isRestoration
                    ? "conic-gradient(from 0deg, transparent, rgba(34,211,238,0.4), transparent, rgba(251,191,36,0.3), transparent)"
                    : "conic-gradient(from 0deg, transparent, rgba(255,26,36,0.6), transparent, rgba(147,51,234,0.4), transparent)",
                }}
              />
            )}

            {/* Stage 6 & 7: Dimensional Rift Portal Fissure */}
            {stage >= 6 && (
              <motion.div
                className="relative z-20 flex flex-col items-center justify-center p-8 text-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Vertical Dimensional Crack */}
                <div
                  className="w-1.5 h-64 md:h-96 rounded-full blur-[1px] animate-pulse"
                  style={{
                    backgroundColor: isRestoration ? "#38bdf8" : "#ff1a24",
                    boxShadow: isRestoration
                      ? "0 0 50px #38bdf8, 0 0 100px #22d3ee"
                      : "0 0 50px #ff1a24, 0 0 100px #dc2626",
                  }}
                />

                <div className="mt-8 font-orbitron font-black text-lg sm:text-2xl tracking-[0.3em] uppercase">
                  {isRestoration ? (
                    <span className="text-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]">
                      RESTORING REALM STABILITY
                    </span>
                  ) : (
                    <span className="text-red-500 drop-shadow-[0_0_25px_rgba(255,26,36,0.9)]">
                      BREACHING DIMENSIONAL THRESHOLD
                    </span>
                  )}
                </div>

                <div className="mt-2 font-mono text-xs tracking-widest text-slate-400">
                  {isRestoration
                    ? "PEELING AWAY CORRUPTION..."
                    : "ENTERING THE OTHER SIDE..."}
                </div>
              </motion.div>
            )}

            {/* Screen Flash Inversion at Peak */}
            {stage === 6 && (
              <motion.div
                className="absolute inset-0 bg-white mix-blend-difference"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.15 }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </WorldTransitionContext.Provider>
  );
}
