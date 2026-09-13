"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Dumbbell,
  Crosshair,
  Sparkles,
  Users,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Zap,
  Repeat,
  FileText,
} from "lucide-react";
import {
  DbMission,
  MissionCategory,
  MISSION_CATEGORIES,
  MISSION_DIFFICULTIES,
  MISSION_FREQUENCIES,
} from "@/lib/missions/types";
import { VerificationBadge } from "./VerificationBadge";

interface MissionDetailsModalProps {
  mission: DbMission | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (mission: DbMission) => void;
  onAbandon: (mission: DbMission) => void;
}

export function MissionDetailsModal({
  mission,
  isOpen,
  onClose,
  onEdit,
  onAbandon,
}: MissionDetailsModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll and reset scroll container on open
  useEffect(() => {
    if (isOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!mission) return null;

  const categoryMeta = MISSION_CATEGORIES[mission.category];
  const difficultyMeta = MISSION_DIFFICULTIES[mission.difficulty];
  const frequencyMeta = MISSION_FREQUENCIES[mission.frequency];

  const getCategoryIcon = (cat: MissionCategory) => {
    switch (cat) {
      case "MIND":
        return <Brain className="w-5 h-5" />;
      case "BODY":
        return <Dumbbell className="w-5 h-5" />;
      case "FOCUS":
        return <Crosshair className="w-5 h-5" />;
      case "SPIRIT":
        return <Sparkles className="w-5 h-5" />;
      case "CONNECTION":
        return <Users className="w-5 h-5" />;
    }
  };

  const createdFormatted = new Date(mission.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const dueFormatted = mission.dueDate
    ? new Date(mission.dueDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No temporal deadline specified";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-details-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-slate-950/98 border-2 border-cyan-500/60 rounded-xs shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3.5rem)] overflow-hidden z-10 my-auto"
          >
            {/* Corner cyber notches */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 z-30 pointer-events-none" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 z-30 pointer-events-none" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 z-30 pointer-events-none" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 z-30 pointer-events-none" />

            {/* FIXED HEADER: Never scrolls away */}
            <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-cyan-500/25 bg-slate-950/95 shrink-0 z-20">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xs border ${categoryMeta.bgColor} ${categoryMeta.borderColor} ${categoryMeta.textColor}`}
                >
                  {getCategoryIcon(mission.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
                      MISSION DETAILS // {mission.category}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-xs text-[9px] font-mono uppercase tracking-widest font-semibold border ${
                        mission.status === "ACTIVE"
                          ? "bg-cyan-950/80 text-cyan-300 border-cyan-600"
                          : "bg-slate-800 text-slate-400 border-slate-600"
                      }`}
                    >
                      {mission.status}
                    </span>
                  </div>
                  <h3
                    id="mission-details-title"
                    className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wider mt-0.5"
                  >
                    {mission.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain"
            >
              {/* Directive Description */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  MISSION DESCRIPTION
                </span>
                <div className="p-4 rounded-xs bg-slate-900/70 border border-slate-800 text-sm font-sans text-slate-200 leading-relaxed">
                  {mission.description || (
                    <span className="italic text-slate-500">
                      No additional details provided.
                    </span>
                  )}
                </div>
              </div>

            {/* Attributes Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Category */}
              <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  STAT CATEGORY
                </div>
                <div className="text-sm font-orbitron font-bold text-white flex items-center gap-1.5">
                  <span className={categoryMeta.textColor}>{categoryMeta.label}</span>
                  <span className="text-slate-500 text-xs font-normal">
                    • {categoryMeta.attribute}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {categoryMeta.examples}
                </div>
              </div>

              {/* Difficulty */}
              <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  DIFFICULTY
                </div>
                <div className="text-sm font-orbitron font-bold text-white">
                  {difficultyMeta.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {difficultyMeta.threatLevel}
                </div>
              </div>

              {/* Frequency */}
              <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Repeat className="w-3 h-3 text-cyan-400" />
                  FREQUENCY
                </div>
                <div className="text-sm font-orbitron font-bold text-white">
                  {frequencyMeta.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {frequencyMeta.description}
                </div>
              </div>

              {/* Due Date */}
              <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  DUE DATE
                </div>
                <div className="text-sm font-orbitron font-bold text-cyan-300">
                  {dueFormatted}
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created: {createdFormatted}
                </div>
              </div>

              {/* Verification Protocol */}
              <div className="p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 space-y-1.5 sm:col-span-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  VERIFICATION METHOD
                </div>
                <div className="flex items-center gap-3">
                  <VerificationBadge type={mission.verificationType || "SELF_REPORT"} size="md" />
                  {mission.verificationType === "FOCUS_SESSION" && (
                    <span className="text-xs font-mono text-amber-300">
                      Duration: {mission.focusDurationMinutes || 25} Minutes
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {mission.verificationType === "FOCUS_SESSION"
                    ? "Requires completing a timed focus session to verify."
                    : mission.verificationType === "EVIDENCE"
                    ? "Requires attaching a photo or written note to verify."
                    : "Self-confirmed completion."}
                </div>
              </div>
            </div>

            {/* Thematic Lore Quote */}
            <div className="p-3 rounded-xs bg-cyan-950/20 border border-cyan-800/30 text-center mb-6">
              <p className="text-xs font-cinzel italic text-cyan-200/80">
                &ldquo;Every discipline upheld in reality strengthens the barrier against the Other Side.&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={() => onAbandon(mission)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xs bg-red-950/30 hover:bg-red-950/80 border border-red-800/50 hover:border-red-600 text-xs font-mono uppercase tracking-wider text-red-300 hover:text-red-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE MISSION</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2 rounded-xs border border-slate-700 hover:border-slate-500 bg-transparent text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  CLOSE
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(mission)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2 rounded-xs bg-amber-950/60 hover:bg-amber-500 border-2 border-amber-500 hover:border-amber-300 text-amber-200 hover:text-black font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>EDIT MISSION</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
}
