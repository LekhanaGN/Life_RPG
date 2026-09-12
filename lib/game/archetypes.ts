// Archetype Definitions for THE OTHER SIDE (Phase 2)
// Defines the 4 foundational survivor archetypes and starting attributes.

export type ArchetypeId = "EXPLORER" | "SCHOLAR" | "WARRIOR" | "STRATEGIST";

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  title: string;
  tagline: string;
  description: string;
  attributes: {
    mind: number;
    body: number;
    focus: number;
    spirit: number;
    connection: number;
  };
  accentColor: string;
  badgeClass: string;
  icon: string;
  flavorQuote: string;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  EXPLORER: {
    id: "EXPLORER",
    name: "EXPLORER",
    title: "The Trailblazer",
    tagline: "Balanced starting attributes.",
    description:
      "Versatile, adaptable survivor who walks the boundary between the known and unknown. Maintains equilibrium across mental clarity, physical stamina, and sharp focus.",
    attributes: {
      mind: 10,
      body: 10,
      focus: 10,
      spirit: 10,
      connection: 10,
    },
    accentColor: "cyan",
    badgeClass: "border-cyan-500/60 bg-cyan-950/40 text-cyan-300",
    icon: "Compass",
    flavorQuote: "Every frontier holds a path forward.",
  },
  SCHOLAR: {
    id: "SCHOLAR",
    name: "SCHOLAR",
    title: "The Mind Seeker",
    tagline: "Higher MIND attribute.",
    description:
      "A master of knowledge, deep inquiry, and mental clarity. Excels in problem deconstruction, analytical thinking, and mental stamina.",
    attributes: {
      mind: 16,
      body: 8,
      focus: 12,
      spirit: 8,
      connection: 6,
    },
    accentColor: "blue",
    badgeClass: "border-blue-500/60 bg-blue-950/40 text-blue-300",
    icon: "Brain",
    flavorQuote: "Understanding the void is the first step to conquering it.",
  },
  WARRIOR: {
    id: "WARRIOR",
    name: "WARRIOR",
    title: "The Iron Vanguard",
    tagline: "Higher BODY attribute.",
    description:
      "A relentless force of physical stamina, discipline, and endurance. Built through consistent daily habits, vital movement, and unyielding grit.",
    attributes: {
      mind: 8,
      body: 16,
      focus: 10,
      spirit: 10,
      connection: 6,
    },
    accentColor: "emerald",
    badgeClass: "border-emerald-500/60 bg-emerald-950/40 text-emerald-300",
    icon: "Dumbbell",
    flavorQuote: "Strength is forged in the fire of daily discipline.",
  },
  STRATEGIST: {
    id: "STRATEGIST",
    name: "STRATEGIST",
    title: "The Flow Architect",
    tagline: "Higher FOCUS attribute.",
    description:
      "A practitioner of deep work, single-tasking, and cognitive flow. Cuts through mental noise and procrastination with surgical precision.",
    attributes: {
      mind: 12,
      body: 8,
      focus: 16,
      spirit: 8,
      connection: 6,
    },
    accentColor: "amber",
    badgeClass: "border-amber-500/60 bg-amber-950/40 text-amber-300",
    icon: "Target",
    flavorQuote: "Focus is the blade that cuts through distortion.",
  },
};

export function isValidArchetype(archetype: string): archetype is ArchetypeId {
  return archetype in ARCHETYPES;
}

export function getArchetypeAttributes(archetype: ArchetypeId) {
  return ARCHETYPES[archetype]?.attributes ?? ARCHETYPES.EXPLORER.attributes;
}
