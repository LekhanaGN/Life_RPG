// Core TypeScript interfaces for THE OTHER SIDE Life RPG
// Prepared for future phases (XP, Quests, Stats, Bosses)

export type WorldRealm = "landing" | "right-side" | "other-side";

export interface CharacterStats {
  mind: number;        // Mental clarity, study, knowledge
  body: number;        // Physical endurance, health, workouts
  focus: number;       // Deep work, single-tasking, flow
  spirit: number;      // Inner resilience, meditation, purpose
  connection: number;  // Empathy, friends, family, community
}

export interface CharacterProfile {
  id: string;
  name: string;
  archetype: string;
  level: number;
  currentXp: number;
  maxXp: number;
  survivalStreakDays: number;
  credits: number;
  stats: CharacterStats;
}

export type MissionCategory = "mind" | "body" | "focus" | "spirit" | "connection";
export type MissionDifficulty = "minor" | "standard" | "major" | "epic";

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  xpReward: number;
  creditReward: number;
  completed: boolean;
}

export interface DimensionalThreat {
  id: string;
  name: string;
  alias: string;
  corruptionLevelPercent: number;
  description: string;
  status: "dormant" | "stalking" | "awaiting_challenge" | "banished";
  afflictions: string[];
}
