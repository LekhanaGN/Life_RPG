"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, X, Zap } from "lucide-react";
import { soundscape } from "@/lib/audio/soundscape";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "event";
  message: string;
}

interface MissionToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function MissionToast({ toasts, onDismiss }: MissionToastProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    // Play subtle audio cue
    if (toast.type === "error") {
      soundscape.playGlitch();
    } else {
      soundscape.playHover();
    }

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isError = toast.type === "error";
  const isEvent = toast.type === "event";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xs backdrop-blur-md border text-xs font-mono tracking-wider shadow-lg ${
        isError
          ? "bg-red-950/90 border-red-500/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          : isEvent
          ? "bg-purple-950/95 border-purple-500/80 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          : "bg-cyan-950/90 border-cyan-500/80 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isError ? (
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        ) : isEvent ? (
          <Zap className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
        )}
        <span className="font-semibold uppercase">{toast.message}</span>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-3 p-1 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss transmission alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
