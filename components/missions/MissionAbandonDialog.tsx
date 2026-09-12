"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { DbMission } from "@/lib/missions/types";

interface MissionAbandonDialogProps {
  mission: DbMission | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mission: DbMission) => void;
}

export function MissionAbandonDialog({
  mission,
  isOpen,
  onClose,
  onConfirm,
}: MissionAbandonDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mission) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="abandon-dialog-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-black/95 border-2 border-red-700/80 rounded-xs shadow-[0_0_40px_rgba(239,68,68,0.3)] p-6 z-10"
          >
            {/* Red Cyber Notches */}
            <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500" />
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500" />

            <div className="flex items-start justify-between pb-3 border-b border-red-900/40 mb-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  DELETE CONFIRMATION
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-xs text-slate-400 hover:text-white"
                aria-label="Cancel delete"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <h3
                id="abandon-dialog-title"
                className="font-cinzel text-xl font-bold text-white tracking-wider text-red-100"
              >
                DELETE MISSION?
              </h3>

              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xs text-xs font-mono text-red-200">
                &ldquo;{mission.title}&rdquo;
              </div>

              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                This mission will be permanently removed from your active mission list.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-red-950">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xs border border-slate-700 hover:border-slate-500 bg-transparent text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={() => onConfirm(mission)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-xs bg-red-950/80 hover:bg-red-600 border-2 border-red-600 hover:border-red-400 text-red-200 hover:text-white font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.5)] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>DELETE</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
