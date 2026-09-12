"use client";

import React, { useState, useEffect } from "react";
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

  // Reset form when modal opens
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Dialog Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-mission-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/50 rounded-xs shadow-[0_0_40px_rgba(6,182,212,0.2)] p-6 sm:p-8 z-10 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Corner cyber notches */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-cyan-500/20 mb-6">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
                  DIRECTIVE // SANCTUARY MATRIX
                </span>
                <h3
                  id="create-mission-title"
                  className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wider flex items-center gap-2 mt-0.5"
                >
                  <Plus className="w-5 h-5 text-cyan-400" />
                  ACCEPT NEW MISSION
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Establish a real-world objective to anchor your reality and resist the spread.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Error Alert */}
            {generalError && (
              <div className="mb-6 p-3 bg-red-950/60 border border-red-500/80 rounded-xs text-xs font-mono text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mission Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="mission-title"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    MISSION CALLSIGN / NAME <span className="text-cyan-400">*</span>
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
                  placeholder="e.g. Study Operating Systems for 1 hour"
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
                    MISSION DIRECTIVE / DESCRIPTION{" "}
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
                  placeholder="e.g. Finish the process scheduling chapter and solve 10 practice questions."
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
                  RESONANCE CATEGORY <span className="text-cyan-400">*</span>
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
                    DIFFICULTY RATING <span className="text-cyan-400">*</span>
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
                    RECURRENCE CADENCE <span className="text-cyan-400">*</span>
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
                  SIGNAL INTEGRITY // VERIFICATION METHOD
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
                      <span className="text-xs font-orbitron font-bold">SELF REPORT</span>
                      <span className="text-xs text-amber-400 font-mono">★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Direct clearance. 50% baseline signal.
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
                      <span className="text-xs font-orbitron font-bold">EVIDENCE</span>
                      <span className="text-xs text-amber-400 font-mono">★★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Photo or note. 70% integrity signal.
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
                      <span className="text-xs font-orbitron font-bold">FOCUS PROTOCOL</span>
                      <span className="text-xs text-amber-400 font-mono">★★★</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Timed session. 91% integrity signal.
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
                  TARGET DUE DATE{" "}
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
                      <span>ENCODING MISSION...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>ACCEPT MISSION</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
