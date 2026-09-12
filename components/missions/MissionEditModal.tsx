"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Brain,
  Dumbbell,
  Crosshair,
  Sparkles,
  Users,
  AlertCircle,
  Loader2,
  Archive,
  CheckCircle2,
} from "lucide-react";
import {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  MissionStatus,
  DbMission,
  MISSION_CATEGORIES,
  MISSION_DIFFICULTIES,
  MISSION_FREQUENCIES,
} from "@/lib/missions/types";
import { validateUpdateMission } from "@/lib/missions/validation";

interface MissionEditModalProps {
  mission: DbMission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (mission: DbMission) => void;
}

export function MissionEditModal({
  mission,
  isOpen,
  onClose,
  onUpdated,
}: MissionEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MissionCategory>("MIND");
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("MEDIUM");
  const [frequency, setFrequency] = useState<MissionFrequency>("DAILY");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<MissionStatus>("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Synchronize form values when mission prop changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (mission && isOpen) {
      setTitle(mission.title);
      setDescription(mission.description || "");
      setCategory(mission.category);
      setDifficulty(mission.difficulty);
      setFrequency(mission.frequency);
      setStatus(mission.status || "ACTIVE");

      if (mission.dueDate) {
        const d = new Date(mission.dueDate);
        if (!isNaN(d.getTime())) {
          // Format for datetime-local: YYYY-MM-DDTHH:mm
          const offset = d.getTimezoneOffset() * 60000;
          const localIso = new Date(d.getTime() - offset).toISOString().slice(0, 16);
          setDueDate(localIso);
        } else {
          setDueDate("");
        }
      } else {
        setDueDate("");
      }

      setErrors({});
      setGeneralError(null);
    }
  }, [mission, isOpen]);

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

  if (!mission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const validation = validateUpdateMission({
      title,
      description: description || null,
      category,
      difficulty,
      frequency,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          category,
          difficulty,
          frequency,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setGeneralError(data.error || "The Other Side rejected the update.");
        }
        setIsSubmitting(false);
        return;
      }

      onUpdated(data.mission);
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
            aria-labelledby="edit-mission-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-slate-950/95 border border-amber-500/50 rounded-xs shadow-[0_0_40px_rgba(245,158,11,0.2)] p-6 sm:p-8 z-10 my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Corner cyber notches */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-amber-500/20 mb-6">
              <div>
                <span className="text-[10px] font-mono text-amber-400 tracking-widest uppercase">
                  MODIFICATION // SANCTUARY MATRIX
                </span>
                <h3
                  id="edit-mission-title"
                  className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wider flex items-center gap-2 mt-0.5"
                >
                  <Save className="w-5 h-5 text-amber-400" />
                  RECONFIGURE MISSION
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Adjust mission parameters and active status.
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
                    htmlFor="edit-mission-title-input"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    MISSION CALLSIGN / NAME <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {title.length}/100
                  </span>
                </div>
                <input
                  id="edit-mission-title-input"
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-900/90 border rounded-xs text-sm font-sans text-white focus:outline-none transition-colors ${
                    errors.title
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-700 focus:border-amber-400 focus:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
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
                    htmlFor="edit-mission-desc"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    MISSION DIRECTIVE / DESCRIPTION
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  id="edit-mission-desc"
                  rows={3}
                  maxLength={1000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-900/90 border rounded-xs text-sm font-sans text-white focus:outline-none transition-colors resize-none ${
                    errors.description
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-700 focus:border-amber-400 focus:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] font-mono text-red-400">{errors.description}</p>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  RESONANCE CATEGORY <span className="text-amber-400">*</span>
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
                            ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} ${cat.glowClass} ring-1 ring-amber-400/60`
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

              {/* Difficulty & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    DIFFICULTY RATING <span className="text-amber-400">*</span>
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
                              ? `${diff.badgeClass} ring-1 ring-amber-400/40`
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
                    RECURRENCE CADENCE <span className="text-amber-400">*</span>
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
                              ? "bg-amber-950/80 border-amber-500/80 text-amber-300 ring-1 ring-amber-400/40 font-bold"
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

              {/* Due Date & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-mission-due-date"
                    className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold"
                  >
                    TARGET DUE DATE{" "}
                    <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                  </label>
                  <input
                    id="edit-mission-due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xs text-sm font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                  {errors.dueDate && (
                    <p className="text-[11px] font-mono text-red-400">{errors.dueDate}</p>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    STATUS STATE
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("ACTIVE")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs border text-xs font-mono uppercase tracking-wider cursor-pointer ${
                        status === "ACTIVE"
                          ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-1 ring-cyan-400/40 font-bold"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      ACTIVE
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("ARCHIVED")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xs border text-xs font-mono uppercase tracking-wider cursor-pointer ${
                        status === "ARCHIVED"
                          ? "bg-slate-800 border-slate-500 text-slate-200 ring-1 ring-slate-400/40 font-bold"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      ARCHIVED
                    </button>
                  </div>
                  {errors.status && (
                    <p className="text-[11px] font-mono text-red-400">{errors.status}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xs bg-amber-950/60 hover:bg-amber-500 border-2 border-amber-500 hover:border-amber-300 text-amber-200 hover:text-black font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>SAVE CHANGES</span>
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
