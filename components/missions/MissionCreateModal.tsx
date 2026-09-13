"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Brain,
  Dumbbell,
  Crosshair,
  Sparkles,
  Users,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  DbMission,
  VerificationType,
  MISSION_CATEGORIES,
  MISSION_DIFFICULTIES,
  MISSION_FREQUENCIES,
} from "@/lib/missions/types";
import { validateCreateMission } from "@/lib/missions/validation";

interface MissionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (mission: DbMission) => void;
}

export function MissionCreateModal({
  isOpen,
  onClose,
  onCreated,
}: MissionCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MissionCategory>("MIND");
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("MEDIUM");
  const [frequency, setFrequency] = useState<MissionFrequency>("DAILY");
  const [dueDate, setDueDate] = useState("");
  const [verificationType, setVerificationType] = useState<VerificationType>("SELF_REPORT");
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset form, lock body scroll, and reset scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCategory("MIND");
      setDifficulty("MEDIUM");
      setFrequency("DAILY");
      setDueDate("");
      setVerificationType("SELF_REPORT");
      setFocusDurationMinutes(25);
      setErrors({});
      setGeneralError(null);

      // Reset scroll position immediately
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus title input safely without jumping the scroll container
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
        titleInputRef.current?.focus({ preventScroll: true });
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Client-side validation check
    const validation = validateCreateMission({
      title,
      description,
      category,
      difficulty,
      frequency,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      verificationType,
      focusDurationMinutes: verificationType === "FOCUS_SESSION" ? focusDurationMinutes : undefined,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: validation.data.title,
          description: validation.data.description,
          category: validation.data.category,
          difficulty: validation.data.difficulty,
          frequency: validation.data.frequency,
          dueDate: validation.data.dueDate?.toISOString(),
          verificationType: validation.data.verificationType,
          focusDurationMinutes: validation.data.focusDurationMinutes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setGeneralError(data.error || "The Other Side rejected the mission.");
        }
        setIsSubmitting(false);
        return;
      }

      onCreated(data.mission);
      onClose();
    } catch (err) {
      setGeneralError("Signal transmission interrupted. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: MissionCategory) => {
    switch (cat) {
      case "MIND":
        return <Brain className="w-4 h-4" />;
      case "BODY":
        return <Dumbbell className="w-4 h-4" />;
      case "FOCUS":
        return <Crosshair className="w-4 h-4" />;
      case "SPIRIT":
        return <Sparkles className="w-4 h-4" />;
      case "CONNECTION":
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-mission-title"
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

            {/* FIXED HEADER: Never scrolls away, always visible at top */}
            <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-cyan-500/25 bg-slate-950/95 shrink-0 z-20">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
                  MISSION PROTOCOL // NEW TASK
                </span>
                <h3
                  id="create-mission-title"
                  className="font-cinzel text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2 mt-0.5 neon-glow-cyan"
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                  CREATE MISSION
                </h3>
                <p className="text-xs font-mono text-slate-300 mt-1">
                  Turn your real-life goals into progress.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 sm:p-2 rounded-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY: Independent internal scrolling */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain"
            >
              {/* General Error Alert */}
              {generalError && (
                <div className="p-3 bg-red-950/60 border border-red-500/80 rounded-xs text-xs font-mono text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Form */}
              <form id="create-mission-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Mission Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="mission-title"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    WHAT DO YOU WANT TO DO? <span className="text-cyan-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {title.length}/100
                  </span>
                </div>
                <input
                  id="mission-title"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Study for 1 hour, Go to the gym, Read 20 pages"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-900/90 border rounded-xs text-sm font-sans text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                    errors.title
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-700 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] font-mono text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="mission-desc"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    DETAILS{" "}
                    <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  id="mission-desc"
                  rows={3}
                  maxLength={1000}
                  placeholder="e.g. Finish the chapter and solve 10 practice questions."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-900/90 border rounded-xs text-sm font-sans text-white placeholder:text-slate-500 focus:outline-none transition-colors resize-none ${
                    errors.description
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-700 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] font-mono text-red-400">{errors.description}</p>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  STAT CATEGORY <span className="text-cyan-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {(
                    Object.keys(MISSION_CATEGORIES) as MissionCategory[]
                  ).map((catKey) => {
                    const cat = MISSION_CATEGORIES[catKey];
                    const isSelected = category === catKey;

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xs border text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} ${cat.glowClass} ring-1 ring-cyan-400/60`
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="mb-1">{getCategoryIcon(catKey)}</div>
                        <span className="text-xs font-orbitron font-bold uppercase tracking-wider">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 mt-0.5 truncate max-w-full">
                          {cat.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="text-[11px] font-mono text-red-400">{errors.category}</p>
                )}
              </div>

              {/* Difficulty & Frequency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    DIFFICULTY <span className="text-cyan-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.keys(MISSION_DIFFICULTIES) as MissionDifficulty[]
                    ).map((diffKey) => {
                      const diff = MISSION_DIFFICULTIES[diffKey];
                      const isSelected = difficulty === diffKey;

                      return (
                        <button
                          key={diffKey}
                          type="button"
                          onClick={() => setDifficulty(diffKey)}
                          className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                            isSelected
                              ? `${diff.badgeClass} ring-1 ring-cyan-400/40`
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div className="text-xs font-orbitron font-bold uppercase tracking-wider">
                            {diff.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.difficulty && (
                    <p className="text-[11px] font-mono text-red-400">{errors.difficulty}</p>
                  )}
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    FREQUENCY <span className="text-cyan-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      Object.keys(MISSION_FREQUENCIES) as MissionFrequency[]
                    ).map((freqKey) => {
                      const freq = MISSION_FREQUENCIES[freqKey];
                      const isSelected = frequency === freqKey;

                      return (
                        <button
                          key={freqKey}
                          type="button"
                          onClick={() => setFrequency(freqKey)}
                          className={`p-2 rounded-xs border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-400/40 font-bold"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <div className="text-xs font-orbitron uppercase tracking-wider">
                            {freq.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.frequency && (
                    <p className="text-[11px] font-mono text-red-400">{errors.frequency}</p>
                  )}
                </div>
              </div>

              {/* Verification Protocol & Signal Integrity */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  HOW WILL YOU VERIFY IT?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationType("SELF_REPORT")}
                    className={`p-3 rounded-xs border text-left transition-all cursor-pointer ${
                      verificationType === "SELF_REPORT"
                        ? "bg-slate-900 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400/50"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-bold">SELF-REPORT</span>
                      <span className="text-xs text-amber-400 font-mono">★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Click complete when done.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationType("EVIDENCE")}
                    className={`p-3 rounded-xs border text-left transition-all cursor-pointer ${
                      verificationType === "EVIDENCE"
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-400/50"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-bold">PROOF (PHOTO / NOTE)</span>
                      <span className="text-xs text-amber-400 font-mono">★★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Attach photo or written note.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationType("FOCUS_SESSION")}
                    className={`p-3 rounded-xs border text-left transition-all cursor-pointer ${
                      verificationType === "FOCUS_SESSION"
                        ? "bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-400/50"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-bold">TIMED FOCUS</span>
                      <span className="text-xs text-amber-400 font-mono">★★★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Complete a focus timer.
                    </div>
                  </button>
                </div>

                {/* Duration selector for Focus Protocol */}
                {verificationType === "FOCUS_SESSION" && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xs space-y-2 mt-2">
                    <label className="block text-[11px] font-mono text-amber-300 uppercase tracking-wider">
                      Focus Duration: {focusDurationMinutes} Minutes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[15, 25, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setFocusDurationMinutes(mins)}
                          className={`px-3 py-1 rounded-xs text-xs font-mono transition-all cursor-pointer ${
                            focusDurationMinutes === mins
                              ? "bg-amber-500 text-black font-bold"
                              : "bg-slate-900 border border-slate-700 text-slate-300 hover:border-amber-400"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date (Optional) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="mission-due-date"
                  className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                >
                  DUE DATE{" "}
                  <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="mission-due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xs text-sm font-mono text-white focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-[11px] font-mono text-red-400">{errors.dueDate}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-cyan-500/20">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xs border border-slate-700 hover:border-slate-500 bg-transparent text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xs bg-cyan-950/60 hover:bg-cyan-500 border-2 border-cyan-500 hover:border-cyan-300 text-cyan-200 hover:text-black font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>CREATING MISSION...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>CREATE MISSION</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
}
