// THE OTHER SIDE - Mission Types & Metadata
// Pure domain types separate from game engine progression (Phase 3)

import {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  MissionStatus,
  DbMission,
  VerificationType,
} from "@/lib/db/client";

export type {
  MissionCategory,
  MissionDifficulty,
  MissionFrequency,
  MissionStatus,
  DbMission,
  VerificationType,
};

export type CategoryFilter = "ALL" | MissionCategory;
export type StatusFilter = "ACTIVE" | "ARCHIVED" | "ALL";

export interface CategoryMeta {
  key: MissionCategory;
  label: string;
  attribute: string;
  tagline: string;
  examples: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  glowClass: string;
}

export const MISSION_CATEGORIES: Record<MissionCategory, CategoryMeta> = {
  MIND: {
    key: "MIND",
    label: "Mind",
    attribute: "Intellect & Learning",
    tagline: "Cognitive Fortification",
    examples: "Study, Reading, Learning, Research",
    accentColor: "#22d3ee", // cyan-400
    borderColor: "border-cyan-500/50",
    bgColor: "bg-cyan-950/40",
    textColor: "text-cyan-300",
    glowClass: "shadow-[0_0_15px_rgba(34,211,238,0.25)]",
  },
  BODY: {
    key: "BODY",
    label: "Body",
    attribute: "Strength & Vitality",
    tagline: "Physical Resilience",
    examples: "Gym, Running, Exercise, Sleep routine",
    accentColor: "#34d399", // emerald-400
    borderColor: "border-emerald-500/50",
    bgColor: "bg-emerald-950/40",
    textColor: "text-emerald-300",
    glowClass: "shadow-[0_0_15px_rgba(52,211,153,0.25)]",
  },
  FOCUS: {
    key: "FOCUS",
    label: "Focus",
    attribute: "Discipline & Willpower",
    tagline: "Deep Work Bastion",
    examples: "Deep work, Coding, Project work, Meditation",
    accentColor: "#fbbf24", // amber-400
    borderColor: "border-amber-500/50",
    bgColor: "bg-amber-950/40",
    textColor: "text-amber-300",
    glowClass: "shadow-[0_0_15px_rgba(251,191,36,0.25)]",
  },
  SPIRIT: {
    key: "SPIRIT",
    label: "Spirit",
    attribute: "Insight & Creativity",
    tagline: "Inner Sanctuary",
    examples: "Journaling, Creative work, Reflection, Personal development",
    accentColor: "#c084fc", // purple-400
    borderColor: "border-purple-500/50",
    bgColor: "bg-purple-950/40",
    textColor: "text-purple-300",
    glowClass: "shadow-[0_0_15px_rgba(192,132,252,0.25)]",
  },
  CONNECTION: {
    key: "CONNECTION",
    label: "Connection",
    attribute: "Charisma & Empathy",
    tagline: "Survivor Network",
    examples: "Family, Friends, Networking, Social activities",
    accentColor: "#f472b6", // pink-400
    borderColor: "border-pink-500/50",
    bgColor: "bg-pink-950/40",
    textColor: "text-pink-300",
    glowClass: "shadow-[0_0_15px_rgba(244,114,182,0.25)]",
  },
};

export interface DifficultyMeta {
  key: MissionDifficulty;
  label: string;
  badgeClass: string;
  borderColor: string;
  threatLevel: string;
}

export const MISSION_DIFFICULTIES: Record<MissionDifficulty, DifficultyMeta> = {
  EASY: {
    key: "EASY",
    label: "Easy",
    badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-600/60",
    borderColor: "border-emerald-500/40",
    threatLevel: "Low Threat // Routine Task",
  },
  MEDIUM: {
    key: "MEDIUM",
    label: "Medium",
    badgeClass: "bg-amber-950/80 text-amber-300 border-amber-600/60",
    borderColor: "border-amber-500/40",
    threatLevel: "Standard // Focused Effort",
  },
  HARD: {
    key: "HARD",
    label: "Hard",
    badgeClass: "bg-orange-950/80 text-orange-300 border-orange-600/60",
    borderColor: "border-orange-500/40",
    threatLevel: "Elevated // Significant Resolve",
  },
  EPIC: {
    key: "EPIC",
    label: "Epic",
    badgeClass: "bg-red-950/90 text-red-300 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    borderColor: "border-red-500/60",
    threatLevel: "Critical // Dimensional Milestone",
  },
};

export interface FrequencyMeta {
  key: MissionFrequency;
  label: string;
  description: string;
}

export const MISSION_FREQUENCIES: Record<MissionFrequency, FrequencyMeta> = {
  ONCE: {
    key: "ONCE",
    label: "Once",
    description: "One-off objective to be accomplished once",
  },
  DAILY: {
    key: "DAILY",
    label: "Daily",
    description: "Recurring daily real-world discipline",
  },
  WEEKLY: {
    key: "WEEKLY",
    label: "Weekly",
    description: "Recurring weekly milestone or ritual",
  },
};
