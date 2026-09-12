"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Dumbbell,
  Crosshair,
  Sparkles,
  Users,
  Calendar,
  Repeat,
  Eye,
  Edit3,
  Trash2,
  Archive,
} from "lucide-react";
import {
  DbMission,
  MissionCategory,
  MISSION_CATEGORIES,
  MISSION_DIFFICULTIES,
} from "@/lib/missions/types";

interface MissionCardItemProps {
  mission: DbMission;
  onView: (mission: DbMission) => void;
  onEdit: (mission: DbMission) => void;
  onAbandon: (mission: DbMission) => void;
}

export function MissionCardItem({
  mission,
  onView,
  onEdit,
  onAbandon,
}: MissionCardItemProps) {
  const categoryMeta = MISSION_CATEGORIES[mission.category];
  const difficultyMeta = MISSION_DIFFICULTIES[mission.difficulty];

  const getCategoryIcon = (category: MissionCategory) => {
    switch (category) {
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

  // Format due date in relative or readable format
  const formatDueDate = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const dueDateText = formatDueDate(mission.dueDate);
  const isArchived = mission.status === "ARCHIVED";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25 }}
      className={`group relative p-4 rounded-xs border transition-all duration-300 backdrop-blur-md ${
        isArchived
          ? "bg-slate-950/40 border-slate-800/60 opacity-70"
          : "bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]"
      }`}
    >
      {/* Corner notch decorative accents */}
      <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Category Icon, Title, Description, Metadata */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Category Icon Emblem */}
          <div
            className={`p-2.5 rounded-xs border mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${categoryMeta.bgColor} ${categoryMeta.borderColor} ${categoryMeta.textColor}`}
            title={`Category: ${categoryMeta.label} (${categoryMeta.attribute})`}
          >
            {getCategoryIcon(mission.category)}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Header badges: Category, Difficulty, Frequency, Due Date */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-widest font-semibold border ${categoryMeta.borderColor} ${categoryMeta.bgColor} ${categoryMeta.textColor}`}
              >
                {categoryMeta.label}
              </span>

              <span
                className={`px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-widest font-semibold border ${difficultyMeta.badgeClass}`}
              >
                {difficultyMeta.label}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono text-slate-300 uppercase tracking-widest">
                <Repeat className="w-2.5 h-2.5 text-cyan-400" />
                {mission.frequency}
              </span>

              {dueDateText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-cyan-950/40 border border-cyan-800/50 text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
                  <Calendar className="w-2.5 h-2.5 text-cyan-400" />
                  {dueDateText}
                </span>
              )}

              {isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-800/80 border border-slate-600/60 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <Archive className="w-2.5 h-2.5" />
                  ARCHIVED
                </span>
              )}
            </div>

            {/* Mission Title */}
            <h4 className="text-base font-orbitron font-semibold tracking-wide text-slate-100 group-hover:text-cyan-200 transition-colors truncate">
              {mission.title}
            </h4>

            {/* Mission Description excerpt */}
            {mission.description && (
              <p className="text-xs font-mono text-slate-400 line-clamp-2 leading-relaxed">
                {mission.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60 w-full md:w-auto justify-end">
          <button
            onClick={() => onView(mission)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label={`View dossier for ${mission.title}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VIEW</span>
          </button>

          <button
            onClick={() => onEdit(mission)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
            aria-label={`Edit ${mission.title}`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EDIT</span>
          </button>

          <button
            onClick={() => onAbandon(mission)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-red-950/30 hover:bg-red-950/80 border border-red-800/50 hover:border-red-600 text-xs font-mono uppercase tracking-wider text-red-300 hover:text-red-100 transition-colors cursor-pointer"
            aria-label={`Abandon ${mission.title}`}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">ABANDON</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
