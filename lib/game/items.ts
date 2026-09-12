// THE OTHER SIDE - Centralized Items & Equipment Engine (Phase 6)
// Authoritative item definitions, rarity parameters, and equipment slot rules.

export type ItemCategory = "CONSUMABLE" | "EQUIPMENT" | "RELIC" | "COSMETIC";
export type ItemRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type EquipmentSlot =
  | "MIND"
  | "BODY"
  | "FOCUS"
  | "SPIRIT"
  | "CONNECTION"
  | "RELIC";

export interface ItemDefinition {
  key: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  price: number;
  icon: string;
  effectType: string;
  effectValue: number;
  slot: EquipmentSlot | null;
  requiredCorruption: number; // Item unlocks in shop when corruption <= requiredCorruption
  isActive: boolean;
}

export const STARTER_CATALOG: ItemDefinition[] = [
  {
    key: "FOCUS_TONIC",
    name: "FOCUS TONIC",
    description: "A temporary energetic charge for intense focus sessions.",
    category: "CONSUMABLE",
    rarity: "COMMON",
    price: 50,
    icon: "Zap",
    effectType: "FOCUS_BOOST",
    effectValue: 2,
    slot: null,
    requiredCorruption: 100, // Always available
    isActive: true,
  },
  {
    key: "STABLE_CIRCUIT",
    name: "STABLE CIRCUIT",
    description: "Solid-state cybernetic stabilizer that protects mental focus from cognitive drift.",
    category: "EQUIPMENT",
    rarity: "COMMON",
    price: 75,
    icon: "Cpu",
    effectType: "STABILITY_BOOST",
    effectValue: 3,
    slot: "FOCUS",
    requiredCorruption: 100,
    isActive: true,
  },
  {
    key: "NIGHT_COMPASS",
    name: "NIGHT COMPASS",
    description: "Points directly toward the critical tasks you keep instinctively avoiding.",
    category: "RELIC",
    rarity: "RARE",
    price: 150,
    icon: "Compass",
    effectType: "FOCUS_BOOST",
    effectValue: 5,
    slot: "RELIC",
    requiredCorruption: 70, // Unlocks when corruption <= 70%
    isActive: true,
  },
  {
    key: "MEMORY_SHARD",
    name: "MEMORY SHARD",
    description: "A crystallized data fragment recovered from the restored Knowledge Forest.",
    category: "EQUIPMENT",
    rarity: "RARE",
    price: 200,
    icon: "Brain",
    effectType: "MIND_BOOST",
    effectValue: 5,
    slot: "MIND",
    requiredCorruption: 70,
    isActive: true,
  },
  {
    key: "IRON_CORE",
    name: "IRON CORE",
    description: "Forged from pure somatic resistance atop the Iron Peak.",
    category: "EQUIPMENT",
    rarity: "EPIC",
    price: 400,
    icon: "Shield",
    effectType: "BODY_BOOST",
    effectValue: 8,
    slot: "BODY",
    requiredCorruption: 40, // Unlocks when corruption <= 40%
    isActive: true,
  },
  {
    key: "STILLWATER_RELIC",
    name: "STILLWATER RELIC",
    description: "Recovered from the depths of Stillwater where internal mental chatter goes silent.",
    category: "RELIC",
    rarity: "EPIC",
    price: 500,
    icon: "Sparkles",
    effectType: "SPIRIT_BOOST",
    effectValue: 8,
    slot: "SPIRIT",
    requiredCorruption: 40,
    isActive: true,
  },
  {
    key: "GATE_KEY",
    name: "GATE KEY",
    description: "An ancient obsidian master key that radiates an ethereal aura across both dimensions.",
    category: "COSMETIC",
    rarity: "LEGENDARY",
    price: 1000,
    icon: "Key",
    effectType: "COSMETIC_AURA",
    effectValue: 10,
    slot: "RELIC",
    requiredCorruption: 15, // Unlocks when corruption <= 15%
    isActive: true,
  },
];

export const RARITY_CONFIG: Record<
  ItemRarity,
  {
    label: string;
    border: string;
    bg: string;
    text: string;
    glow: string;
    order: number;
  }
> = {
  COMMON: {
    label: "COMMON",
    border: "border-slate-500/50",
    bg: "bg-slate-900/40",
    text: "text-slate-300",
    glow: "shadow-[0_0_10px_rgba(148,163,184,0.2)]",
    order: 1,
  },
  RARE: {
    label: "RARE",
    border: "border-cyan-500/60",
    bg: "bg-cyan-950/40",
    text: "text-cyan-300",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    order: 2,
  },
  EPIC: {
    label: "EPIC",
    border: "border-purple-500/60",
    bg: "bg-purple-950/40",
    text: "text-purple-300",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    order: 3,
  },
  LEGENDARY: {
    label: "LEGENDARY",
    border: "border-amber-500/80",
    bg: "bg-amber-950/40",
    text: "text-amber-300",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
    order: 4,
  },
};

export const EQUIPMENT_SLOTS: {
  slot: EquipmentSlot;
  label: string;
  description: string;
}[] = [
  { slot: "MIND", label: "MIND MATRIX", description: "Neural and cognitive focus gear" },
  { slot: "BODY", label: "BODY REINFORCEMENT", description: "Somatic stamina and athletic equipment" },
  { slot: "FOCUS", label: "FOCUS APPARATUS", description: "Attention and concentration modules" },
  { slot: "SPIRIT", label: "SPIRIT SANCTUARY", description: "Reflective and tranquility artifacts" },
  { slot: "CONNECTION", label: "CONNECTION BEACON", description: "Social resonance and empathy modules" },
  { slot: "RELIC", label: "DIMENSIONAL RELIC", description: "Mysterious artifacts and keys" },
];

/**
 * Checks whether an item is equippable
 */
export function isEquippable(item: { category: string; slot: string | null }): boolean {
  return (
    item.category === "EQUIPMENT" ||
    item.category === "RELIC" ||
    item.category === "COSMETIC"
  ) && !!item.slot;
}

/**
 * Get item definition by key
 */
export function getItemDefinition(key: string): ItemDefinition | undefined {
  return STARTER_CATALOG.find((item) => item.key === key);
}
