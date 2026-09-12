// THE OTHER SIDE - Database & Persistence Layer
// Prisma + PostgreSQL data engine with resilient local persistence fallback.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { processProgressionMath, validateMissionCompletionEligibility } from "@/lib/game/progression";
import {
  WORLD_AREAS,
  WorldAreaKey,
  getCorruptionReduction,
  getAreaRestorationGain,
  getAreaForCategory,
  clampCorruption,
  clampRestoration,
} from "@/lib/game/world";
import {
  BOSS_DEFINITIONS,
  BossKey,
  getBossDamage,
  getBossDefinition,
  getNextBossDefinition,
  processBossDamageCalculation,
} from "@/lib/game/bosses";
import {
  STARTER_CATALOG,
  ItemCategory,
  ItemRarity,
  EquipmentSlot,
  isEquippable,
  RARITY_CONFIG,
} from "@/lib/game/items";
import { validatePurchaseEligibility } from "@/lib/game/shop";
import {
  getLogicalDate,
  calculateStreakUpdate,
  isSameDay,
  isYesterday,
  getSignalStrength,
  StreakCalculationResult,
  SignalStatus,
} from "@/lib/game/streaks";
import {
  SURVIVAL_MILESTONES,
  checkMilestones,
  getNextMilestone,
  MilestoneDefinition,
} from "@/lib/game/streakRewards";
import {
  COMEBACK_CONFIG,
  isComebackExpired,
  getComebackTimeRemainingMs,
} from "@/lib/game/comeback";
import {
  CANONICAL_WORLD_EVENTS,
  WorldEventKey,
  WorldEventTemplate,
  WORLD_LORE_LOGS,
  getWorldEventDefinition,
  getLoreDefinition,
  LoreLogDefinition,
} from "@/lib/game/worldEvents";
import {
  selectEligibleEventTemplate,
  isEligibleForNewEvent,
  isEventExpired,
  EventGenerationContext,
} from "@/lib/game/eventGenerator";
import { calculateEventReward } from "@/lib/game/eventRewards";
import {
  VerificationType,
  EvidenceType,
  FocusSessionStatus,
  calculateSignalIntegrity,
} from "@/lib/game/verification";
import {
  evaluateHeartbeat,
  validateSessionCompletion,
  FOCUS_CONSTANTS,
} from "@/lib/game/focusSessions";

// Global Prisma instance to avoid multiple connections in Next.js hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isPostgresAvailable?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let isPostgresAvailable: boolean = globalForPrisma.isPostgresAvailable ?? true;

async function executePrisma<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!process.env.DATABASE_URL || isPostgresAvailable === false) return null;
  try {
    return await fn();
  } catch (err: any) {
    // If database server is unreachable, disable future calls to avoid timeout delays
    isPostgresAvailable = false;
    globalForPrisma.isPostgresAvailable = false;
    return null;
  }
}

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  character?: DbCharacter | null;
}

export interface DbCharacter {
  id: string;
  userId: string;
  name: string;
  archetype: string;
  level: number;
  xp: number;
  credits: number;
  mind: number;
  body: number;
  focus: number;
  spirit: number;
  connection: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MissionCategory = "MIND" | "BODY" | "FOCUS" | "SPIRIT" | "CONNECTION";
export type MissionDifficulty = "EASY" | "MEDIUM" | "HARD" | "EPIC";
export type MissionFrequency = "ONCE" | "DAILY" | "WEEKLY";
export type MissionStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";
export type { VerificationType, EvidenceType, FocusSessionStatus };

export interface DbMission {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  frequency: MissionFrequency;
  dueDate: Date | null;
  isActive: boolean;
  status: MissionStatus;
  verificationType?: VerificationType;
  focusDurationMinutes?: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastCompletedAt?: Date | null;
  isCompletedToday?: boolean;
}

export interface DbMissionEvidence {
  id: string;
  userId: string;
  missionId: string;
  type: EvidenceType;
  fileUrl: string | null;
  description: string | null;
  createdAt: Date;
}

export interface DbFocusSession {
  id: string;
  userId: string;
  missionId: string;
  startedAt: Date;
  lastHeartbeatAt: Date;
  requiredDurationSeconds: number;
  accumulatedActiveSeconds: number;
  idleSeconds: number;
  status: FocusSessionStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbMissionCompletion {
  id: string;
  missionId: string;
  userId: string;
  completedAt: Date;
  xpEarned: number;
  creditsEarned: number;
}

export interface DbWorldProgress {
  id: string;
  userId: string;
  corruption: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbWorldAreaProgress {
  id: string;
  userId: string;
  areaKey: string;
  isUnlocked: boolean;
  restorationPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbBossProgress {
  id: string;
  userId: string;
  bossKey: string;
  currentHp: number;
  maxHp: number;
  isDefeated: boolean;
  defeatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbItem {
  id: string;
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
  requiredCorruption: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  isEquipped: boolean;
  acquiredAt: Date;
  updatedAt: Date;
  item?: DbItem;
}

export interface DbEconomyTransaction {
  id: string;
  userId: string;
  type: "MISSION_REWARD" | "PURCHASE" | "REFUND" | "MILESTONE_REWARD" | "COMEBACK_REWARD";
  amount: number;
  itemId: string | null;
  description: string | null;
  createdAt: Date;
}

export interface DbUserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  totalActiveDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbDailyActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  missionsCompleted: number;
  xpEarned: number;
  creditsEarned: number;
  createdAt: Date;
}

export interface DbMilestone {
  id: string;
  key: string;
  name: string;
  description: string;
  loreQuote: string | null;
  requirementType: string;
  requirementValue: number;
  rewardCredits: number;
  rewardXP: number;
  icon: string;
  createdAt: Date;
}

export interface DbUserMilestone {
  id: string;
  userId: string;
  milestoneId: string;
  unlockedAt: Date;
  milestone?: DbMilestone;
}

export interface DbComebackChallenge {
  id: string;
  userId: string;
  startedAt: Date;
  expiresAt: Date;
  missionsRequired: number;
  missionsCompleted: number;
  completed: boolean;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbWorldEvent {
  id: string;
  key: string;
  title: string;
  description: string;
  loreSnippet: string | null;
  targetAttribute: string;
  targetArea: string | null;
  requiredCompletions: number;
  rewardCredits: number;
  rewardXp: number;
  corruptionChange: number;
  bossDamageBonus: number;
  rarity: string;
  loreId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbUserWorldEvent {
  id: string;
  userId: string;
  worldEventId: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  progress: number;
  requiredProgress: number;
  completed: boolean;
  rewardClaimed: boolean;
  startsAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  worldEvent?: DbWorldEvent;
}

export interface DbUserLoreUnlock {
  id: string;
  userId: string;
  loreKey: string;
  title: string;
  content: string;
  source: string;
  unlockedAt: Date;
}

export interface WorldStateSummary {
  corruption: number;
  integrityPercent: number;
  worldProgress: DbWorldProgress;
  areas: (DbWorldAreaProgress & {
    name: string;
    subtitle: string;
    description: string;
    requiredCorruption: number;
    accentColor: string;
    category: MissionCategory | null;
    status: "LOCKED" | "CORRUPTED" | "RECLAIMING" | "RESTORED";
  })[];
  activeBoss: DbBossProgress & {
    name: string;
    title: string;
    order: number;
    description: string;
    threatTrait: string;
    threatTraitDesc: string;
    corruptionSource: string;
    corruptionSourceDesc: string;
    accentColor: string;
    hpPercent: number;
  };
  allBosses: DbBossProgress[];
}

export interface ShopItemView extends DbItem {
  isUnlocked: boolean;
  canAfford: boolean;
  ownedQuantity: number;
}

// Fallback file persistence path for zero-dependency local development/testing
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "survivors.json");

interface LocalDataStore {
  users: DbUser[];
  characters: DbCharacter[];
  missions: DbMission[];
  missionCompletions: DbMissionCompletion[];
  worldProgress: DbWorldProgress[];
  worldAreaProgress: DbWorldAreaProgress[];
  bossProgress: DbBossProgress[];
  items: DbItem[];
  inventoryItems: DbInventoryItem[];
  economyTransactions: DbEconomyTransaction[];
  userStreaks: DbUserStreak[];
  dailyActivities: DbDailyActivity[];
  milestones: DbMilestone[];
  userMilestones: DbUserMilestone[];
  comebackChallenges: DbComebackChallenge[];
  worldEvents: DbWorldEvent[];
  userWorldEvents: DbUserWorldEvent[];
  userLoreUnlocks: DbUserLoreUnlock[];
  missionEvidences: DbMissionEvidence[];
  focusSessions: DbFocusSession[];
}

function generateId(prefix = "c"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

function getLocalStore(): LocalDataStore {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      const seededItems: DbItem[] = STARTER_CATALOG.map((cat) => ({
        id: `itm_${cat.key.toLowerCase()}`,
        key: cat.key,
        name: cat.name,
        description: cat.description,
        category: cat.category,
        rarity: cat.rarity,
        price: cat.price,
        icon: cat.icon,
        effectType: cat.effectType,
        effectValue: cat.effectValue,
        slot: cat.slot,
        requiredCorruption: cat.requiredCorruption,
        isActive: cat.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const seededMilestones: DbMilestone[] = SURVIVAL_MILESTONES.map((m) => ({
        id: `mls_${m.key.toLowerCase()}`,
        key: m.key,
        name: m.name,
        description: m.description,
        loreQuote: m.loreQuote,
        requirementType: m.requirementType,
        requirementValue: m.requirementValue,
        rewardCredits: m.rewardCredits,
        rewardXP: m.rewardXP,
        icon: m.icon,
        createdAt: new Date(),
      }));

      const seededWorldEvents: DbWorldEvent[] = (Object.keys(CANONICAL_WORLD_EVENTS) as WorldEventKey[]).map(
        (k) => {
          const t = CANONICAL_WORLD_EVENTS[k];
          return {
            id: `we_${t.key.toLowerCase()}`,
            key: t.key,
            title: t.title,
            description: t.description,
            loreSnippet: t.loreSnippet,
            targetAttribute: t.targetAttribute,
            targetArea: t.targetArea || null,
            requiredCompletions: t.requiredCompletions,
            rewardCredits: t.rewardCredits,
            rewardXp: t.rewardXp,
            corruptionChange: t.corruptionChange,
            bossDamageBonus: t.bossDamageBonus,
            rarity: t.rarity,
            loreId: t.loreId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      );

      const initial: LocalDataStore = {
        users: [],
        characters: [],
        missions: [],
        missionCompletions: [],
        worldProgress: [],
        worldAreaProgress: [],
        bossProgress: [],
        items: seededItems,
        inventoryItems: [],
        economyTransactions: [],
        userStreaks: [],
        dailyActivities: [],
        milestones: seededMilestones,
        userMilestones: [],
        comebackChallenges: [],
        worldEvents: seededWorldEvents,
        userWorldEvents: [],
        userLoreUnlocks: [],
        missionEvidences: [],
        focusSessions: [],
      };
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.users = (parsed.users || []).map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt),
    }));
    parsed.characters = (parsed.characters || []).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    }));
    parsed.missions = (parsed.missions || []).map((m: any) => ({
      ...m,
      dueDate: m.dueDate ? new Date(m.dueDate) : null,
      isActive: m.isActive !== undefined ? m.isActive : m.status !== "ARCHIVED",
      status: (m.status as MissionStatus) || (m.isActive === false ? "ARCHIVED" : "ACTIVE"),
      verificationType: (m.verificationType as VerificationType) || "SELF_REPORT",
      focusDurationMinutes:
        m.focusDurationMinutes !== undefined
          ? m.focusDurationMinutes
          : m.verificationType === "FOCUS_SESSION"
          ? 25
          : null,
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }));
    parsed.missionCompletions = (parsed.missionCompletions || []).map((mc: any) => ({
      ...mc,
      completedAt: new Date(mc.completedAt),
    }));
    parsed.worldProgress = (parsed.worldProgress || []).map((wp: any) => ({
      ...wp,
      updatedAt: new Date(wp.updatedAt),
    }));
    parsed.worldAreaProgress = (parsed.worldAreaProgress || []).map((wap: any) => ({
      ...wap,
      createdAt: new Date(wap.createdAt),
      updatedAt: new Date(wap.updatedAt),
    }));
    parsed.bossProgress = (parsed.bossProgress || []).map((bp: any) => ({
      ...bp,
      defeatedAt: bp.defeatedAt ? new Date(bp.defeatedAt) : null,
      createdAt: new Date(bp.createdAt),
      updatedAt: new Date(bp.updatedAt),
    }));

    // Ensure catalog items exist
    const items = (parsed.items || []).map((i: any) => ({
      ...i,
      createdAt: new Date(i.createdAt),
      updatedAt: new Date(i.updatedAt),
    }));

    if (items.length < STARTER_CATALOG.length) {
      for (const cat of STARTER_CATALOG) {
        if (!items.some((i: any) => i.key === cat.key)) {
          items.push({
            id: `itm_${cat.key.toLowerCase()}`,
            key: cat.key,
            name: cat.name,
            description: cat.description,
            category: cat.category,
            rarity: cat.rarity,
            price: cat.price,
            icon: cat.icon,
            effectType: cat.effectType,
            effectValue: cat.effectValue,
            slot: cat.slot,
            requiredCorruption: cat.requiredCorruption,
            isActive: cat.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
    parsed.items = items;

    parsed.inventoryItems = (parsed.inventoryItems || []).map((inv: any) => ({
      ...inv,
      acquiredAt: new Date(inv.acquiredAt),
      updatedAt: new Date(inv.updatedAt),
    }));

    parsed.economyTransactions = (parsed.economyTransactions || []).map((tx: any) => ({
      ...tx,
      createdAt: new Date(tx.createdAt),
    }));

    // Ensure milestones exist
    const milestones = (parsed.milestones || []).map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));

    if (milestones.length < SURVIVAL_MILESTONES.length) {
      for (const mDef of SURVIVAL_MILESTONES) {
        if (!milestones.some((m: any) => m.key === mDef.key)) {
          milestones.push({
            id: `mls_${mDef.key.toLowerCase()}`,
            key: mDef.key,
            name: mDef.name,
            description: mDef.description,
            loreQuote: mDef.loreQuote,
            requirementType: mDef.requirementType,
            requirementValue: mDef.requirementValue,
            rewardCredits: mDef.rewardCredits,
            rewardXP: mDef.rewardXP,
            icon: mDef.icon,
            createdAt: new Date(),
          });
        }
      }
    }
    parsed.milestones = milestones;

    parsed.userStreaks = (parsed.userStreaks || []).map((s: any) => ({
      ...s,
      lastActiveDate: s.lastActiveDate ? new Date(s.lastActiveDate) : null,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));

    parsed.dailyActivities = (parsed.dailyActivities || []).map((da: any) => ({
      ...da,
      createdAt: new Date(da.createdAt),
    }));

    parsed.userMilestones = (parsed.userMilestones || []).map((um: any) => ({
      ...um,
      unlockedAt: new Date(um.unlockedAt),
    }));

    parsed.comebackChallenges = (parsed.comebackChallenges || []).map((cc: any) => ({
      ...cc,
      startedAt: new Date(cc.startedAt),
      expiresAt: new Date(cc.expiresAt),
      createdAt: new Date(cc.createdAt),
      updatedAt: new Date(cc.updatedAt),
    }));

    // Ensure canonical world events exist
    const worldEvents = (parsed.worldEvents || []).map((we: any) => ({
      ...we,
      createdAt: new Date(we.createdAt),
      updatedAt: new Date(we.updatedAt),
    }));

    const canonicalKeys = Object.keys(CANONICAL_WORLD_EVENTS) as WorldEventKey[];
    for (const key of canonicalKeys) {
      if (!worldEvents.some((we: any) => we.key === key)) {
        const t = CANONICAL_WORLD_EVENTS[key];
        worldEvents.push({
          id: `we_${t.key.toLowerCase()}`,
          key: t.key,
          title: t.title,
          description: t.description,
          loreSnippet: t.loreSnippet,
          targetAttribute: t.targetAttribute,
          targetArea: t.targetArea || null,
          requiredCompletions: t.requiredCompletions,
          rewardCredits: t.rewardCredits,
          rewardXp: t.rewardXp,
          corruptionChange: t.corruptionChange,
          bossDamageBonus: t.bossDamageBonus,
          rarity: t.rarity,
          loreId: t.loreId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    parsed.worldEvents = worldEvents;

    parsed.userWorldEvents = (parsed.userWorldEvents || []).map((uwe: any) => ({
      ...uwe,
      startsAt: new Date(uwe.startsAt),
      expiresAt: new Date(uwe.expiresAt),
      completedAt: uwe.completedAt ? new Date(uwe.completedAt) : null,
      createdAt: new Date(uwe.createdAt),
      updatedAt: new Date(uwe.updatedAt),
    }));

    parsed.userLoreUnlocks = (parsed.userLoreUnlocks || []).map((ulu: any) => ({
      ...ulu,
      unlockedAt: new Date(ulu.unlockedAt),
    }));

    parsed.missionEvidences = (parsed.missionEvidences || []).map((me: any) => ({
      ...me,
      createdAt: new Date(me.createdAt),
    }));

    parsed.focusSessions = (parsed.focusSessions || []).map((fs: any) => ({
      ...fs,
      startedAt: new Date(fs.startedAt),
      lastHeartbeatAt: new Date(fs.lastHeartbeatAt),
      completedAt: fs.completedAt ? new Date(fs.completedAt) : null,
      createdAt: new Date(fs.createdAt),
      updatedAt: new Date(fs.updatedAt),
    }));

    return parsed;
  } catch (err) {
    console.error("[DB Fallback Store Error]:", err);
    return {
      users: [],
      characters: [],
      missions: [],
      missionCompletions: [],
      worldProgress: [],
      worldAreaProgress: [],
      bossProgress: [],
      items: [],
      inventoryItems: [],
      economyTransactions: [],
      userStreaks: [],
      dailyActivities: [],
      milestones: [],
      userMilestones: [],
      comebackChallenges: [],
      worldEvents: [],
      userWorldEvents: [],
      userLoreUnlocks: [],
      missionEvidences: [],
      focusSessions: [],
    };
  }
}

function saveLocalStore(store: LocalDataStore): void {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB Fallback Save Error]:", err);
  }
}

// Database Repository Operations
export const db = {
  /**
   * Find a user by email, including character relation
   */
  async findUserByEmail(email: string): Promise<DbUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const pgUser = await executePrisma(() =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { character: true },
      })
    );
    if (pgUser) return pgUser as unknown as DbUser;

    const store = getLocalStore();
    const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) return null;
    const character = store.characters.find((c) => c.userId === user.id) || null;
    return { ...user, character };
  },

  /**
   * Find a user by ID, including character relation
   */
  async findUserById(id: string): Promise<DbUser | null> {
    const pgUser = await executePrisma(() =>
      prisma.user.findUnique({
        where: { id },
        include: { character: true },
      })
    );
    if (pgUser) return pgUser as unknown as DbUser;

    const store = getLocalStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) return null;
    const character = store.characters.find((c) => c.userId === user.id) || null;
    return { ...user, character };
  },

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    username: string;
    timezone?: string;
  }): Promise<DbUser> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim();
    const userTimezone = data.timezone || "UTC";

    const pgUser = await executePrisma(() =>
      prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          username: cleanUsername,
          timezone: userTimezone,
        },
      })
    );
    if (pgUser) return pgUser as unknown as DbUser;

    const store = getLocalStore();
    const newUser: DbUser = {
      id: generateId("usr"),
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      username: cleanUsername,
      timezone: userTimezone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.users.push(newUser);
    saveLocalStore(store);
    return newUser;
  },

  /**
   * Find a character by User ID
   */
  async findCharacterByUserId(userId: string): Promise<DbCharacter | null> {
    const pgChar = await executePrisma(() =>
      prisma.character.findUnique({
        where: { userId },
      })
    );
    if (pgChar) return pgChar as unknown as DbCharacter;

    const store = getLocalStore();
    const character = store.characters.find((c) => c.userId === userId);
    return character || null;
  },

  /**
   * Create a character for a user with server-determined starting values
   */
  async createCharacter(data: {
    userId: string;
    name: string;
    archetype: string;
    mind: number;
    body: number;
    focus: number;
    spirit: number;
    connection: number;
  }): Promise<DbCharacter> {
    const cleanName = data.name.trim();

    const pgChar = await executePrisma(() =>
      prisma.character.create({
        data: {
          userId: data.userId,
          name: cleanName,
          archetype: data.archetype,
          level: 1,
          xp: 0,
          credits: 0,
          mind: data.mind,
          body: data.body,
          focus: data.focus,
          spirit: data.spirit,
          connection: data.connection,
        },
      })
    );
    if (pgChar) return pgChar as unknown as DbCharacter;

    const store = getLocalStore();
    const existingIdx = store.characters.findIndex((c) => c.userId === data.userId);
    const newChar: DbCharacter = {
      id: generateId("chr"),
      userId: data.userId,
      name: cleanName,
      archetype: data.archetype,
      level: 1,
      xp: 0,
      credits: 0,
      mind: data.mind,
      body: data.body,
      focus: data.focus,
      spirit: data.spirit,
      connection: data.connection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingIdx >= 0) {
      store.characters[existingIdx] = newChar;
    } else {
      store.characters.push(newChar);
    }
    saveLocalStore(store);
    return newChar;
  },

  /**
   * Update character stats directly
   */
  async updateCharacter(
    userId: string,
    data: Partial<DbCharacter>
  ): Promise<DbCharacter | null> {
    const pgChar = await executePrisma(() =>
      prisma.character.update({
        where: { userId },
        data,
      })
    );
    if (pgChar) return pgChar as unknown as DbCharacter;

    const store = getLocalStore();
    const idx = store.characters.findIndex((c) => c.userId === userId);
    if (idx === -1) return null;

    const updated = {
      ...store.characters[idx],
      ...data,
      updatedAt: new Date(),
    };
    store.characters[idx] = updated;
    saveLocalStore(store);
    return updated;
  },

  /**
   * Retrieve survivor missions with attached completion metadata
   */
  async findMissionsByUserId(
    userId: string,
    filters?: { category?: string; status?: string }
  ): Promise<DbMission[]> {
    const pgMissions = await executePrisma(async () => {
      const where: any = { userId };
      if (filters?.category && filters.category !== "ALL") {
        where.category = filters.category;
      }
      if (filters?.status && filters.status !== "ALL") {
        where.status = filters.status;
      }
      return prisma.mission.findMany({
        where,
        include: {
          completions: {
            orderBy: { completedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ createdAt: "desc" }],
      });
    });

    if (pgMissions) {
      return pgMissions.map((m: any) => {
        const lastCompletion = m.completions?.[0];
        const eligibility = validateMissionCompletionEligibility(
          m.frequency as MissionFrequency,
          lastCompletion ? new Date(lastCompletion.completedAt) : null
        );

        return {
          ...m,
          verificationType: (m.verificationType as VerificationType) || "SELF_REPORT",
          focusDurationMinutes:
            m.focusDurationMinutes !== undefined
              ? m.focusDurationMinutes
              : m.verificationType === "FOCUS_SESSION"
              ? 25
              : null,
          lastCompletedAt: lastCompletion ? new Date(lastCompletion.completedAt) : null,
          isCompletedToday: !eligibility.eligible,
        } as DbMission;
      });
    }

    const store = getLocalStore();
    let missions = store.missions.filter((m) => m.userId === userId);

    if (filters?.category && filters.category !== "ALL") {
      missions = missions.filter((m) => m.category === filters.category);
    }
    if (filters?.status && filters.status !== "ALL") {
      missions = missions.filter((m) => m.status === filters.status);
    }

    const userCompletions = store.missionCompletions.filter((mc) => mc.userId === userId);

    const enrichedMissions = missions.map((m) => {
      const missionCompletions = userCompletions
        .filter((mc) => mc.missionId === m.id)
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      const lastCompletion = missionCompletions[0];
      const eligibility = validateMissionCompletionEligibility(
        m.frequency,
        lastCompletion ? lastCompletion.completedAt : null
      );

      return {
        ...m,
        verificationType: (m.verificationType as VerificationType) || "SELF_REPORT",
        focusDurationMinutes:
          m.focusDurationMinutes !== undefined
            ? m.focusDurationMinutes
            : m.verificationType === "FOCUS_SESSION"
            ? 25
            : null,
        lastCompletedAt: lastCompletion ? lastCompletion.completedAt : null,
        isCompletedToday: !eligibility.eligible,
      };
    });

    return enrichedMissions.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "ACTIVE" ? -1 : 1;
      }
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  },

  /**
   * Retrieve single mission record with scoped ownership check
   */
  async findMissionById(id: string, userId: string): Promise<DbMission | null> {
    const pgMission = await executePrisma(() =>
      prisma.mission.findFirst({
        where: { id, userId },
        include: {
          completions: {
            orderBy: { completedAt: "desc" },
            take: 1,
          },
        },
      })
    );

    if (pgMission) {
      const lastCompletion = (pgMission as any).completions?.[0];
      return {
        ...pgMission,
        verificationType: ((pgMission as any).verificationType as VerificationType) || "SELF_REPORT",
        focusDurationMinutes:
          (pgMission as any).focusDurationMinutes !== undefined
            ? (pgMission as any).focusDurationMinutes
            : (pgMission as any).verificationType === "FOCUS_SESSION"
            ? 25
            : null,
        lastCompletedAt: lastCompletion ? new Date(lastCompletion.completedAt) : null,
      } as unknown as DbMission;
    }

    const store = getLocalStore();
    const mission = store.missions.find((m) => m.id === id && m.userId === userId);
    if (!mission) return null;

    const lastCompletion = store.missionCompletions
      .filter((mc) => mc.missionId === id && mc.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0];

    return {
      ...mission,
      verificationType: (mission.verificationType as VerificationType) || "SELF_REPORT",
      focusDurationMinutes:
        mission.focusDurationMinutes !== undefined
          ? mission.focusDurationMinutes
          : mission.verificationType === "FOCUS_SESSION"
          ? 25
          : null,
      lastCompletedAt: lastCompletion ? lastCompletion.completedAt : null,
    };
  },

  /**
   * Create new mission
   */
  async createMission(data: {
    userId: string;
    title: string;
    description?: string | null;
    category: MissionCategory;
    difficulty: MissionDifficulty;
    frequency: MissionFrequency;
    dueDate?: Date | null;
    verificationType?: VerificationType;
    focusDurationMinutes?: number | null;
  }): Promise<DbMission> {
    const cleanTitle = data.title.trim();
    const cleanDescription = data.description ? data.description.trim() : null;
    const vType = data.verificationType || "SELF_REPORT";
    const focusDuration =
      vType === "FOCUS_SESSION" ? Math.max(1, data.focusDurationMinutes || 25) : null;

    const pgMission = await executePrisma(() =>
      prisma.mission.create({
        data: {
          userId: data.userId,
          title: cleanTitle,
          description: cleanDescription,
          category: data.category,
          difficulty: data.difficulty,
          frequency: data.frequency,
          dueDate: data.dueDate || null,
          isActive: true,
          status: "ACTIVE",
          verificationType: vType,
          focusDurationMinutes: focusDuration,
        },
      })
    );
    if (pgMission) {
      return {
        ...pgMission,
        verificationType: vType,
        focusDurationMinutes: focusDuration,
      } as unknown as DbMission;
    }

    const store = getLocalStore();
    const newMission: DbMission = {
      id: generateId("msn"),
      userId: data.userId,
      title: cleanTitle,
      description: cleanDescription,
      category: data.category,
      difficulty: data.difficulty,
      frequency: data.frequency,
      dueDate: data.dueDate || null,
      isActive: true,
      status: "ACTIVE",
      verificationType: vType,
      focusDurationMinutes: focusDuration,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.missions.push(newMission);
    saveLocalStore(store);
    return newMission;
  },

  /**
   * Update mission fields safely
   */
  async updateMission(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string | null;
      category: MissionCategory;
      difficulty: MissionDifficulty;
      frequency: MissionFrequency;
      dueDate: Date | null;
      isActive: boolean;
      status: MissionStatus;
      verificationType: VerificationType;
      focusDurationMinutes: number | null;
    }>
  ): Promise<DbMission | null> {
    const pgMission = await executePrisma(async () => {
      const existing = await prisma.mission.findFirst({
        where: { id, userId },
      });
      if (!existing) return null;

      return prisma.mission.update({
        where: { id },
        data: {
          ...data,
          isActive: data.status ? data.status === "ACTIVE" : data.isActive,
        },
      });
    });
    if (pgMission) {
      return {
        ...pgMission,
        verificationType: ((pgMission as any).verificationType as VerificationType) || "SELF_REPORT",
        focusDurationMinutes: (pgMission as any).focusDurationMinutes,
      } as unknown as DbMission;
    }

    const store = getLocalStore();
    const missionIdx = store.missions.findIndex((m) => m.id === id && m.userId === userId);
    if (missionIdx === -1) return null;

    const current = store.missions[missionIdx];
    const updatedStatus =
      data.status ||
      (data.isActive === false
        ? "ARCHIVED"
        : data.isActive === true
        ? "ACTIVE"
        : current.status);
    const updatedMission: DbMission = {
      ...current,
      ...data,
      status: updatedStatus as MissionStatus,
      isActive: updatedStatus === "ACTIVE",
      verificationType: data.verificationType !== undefined ? data.verificationType : current.verificationType || "SELF_REPORT",
      focusDurationMinutes: data.focusDurationMinutes !== undefined ? data.focusDurationMinutes : current.focusDurationMinutes,
      updatedAt: new Date(),
    };

    store.missions[missionIdx] = updatedMission;
    saveLocalStore(store);
    return updatedMission;
  },

  /**
   * Delete mission
   */
  async deleteMission(id: string, userId: string): Promise<boolean> {
    const pgDeleted = await executePrisma(async () => {
      const existing = await prisma.mission.findFirst({
        where: { id, userId },
      });
      if (!existing) return false;

      await prisma.mission.delete({ where: { id } });
      return true;
    });
    if (pgDeleted !== null) return pgDeleted;

    const store = getLocalStore();
    const initialLen = store.missions.length;
    store.missions = store.missions.filter((m) => !(m.id === id && m.userId === userId));
    if (store.missions.length < initialLen) {
      saveLocalStore(store);
      return true;
    }
    return false;
  },

  /**
   * Find historical completions by user
   */
  async findCompletionsByUserId(userId: string): Promise<DbMissionCompletion[]> {
    const pgCompletions = await executePrisma(() =>
      prisma.missionCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
      })
    );
    if (pgCompletions) return pgCompletions as unknown as DbMissionCompletion[];

    const store = getLocalStore();
    return store.missionCompletions
      .filter((mc) => mc.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  },

  // ==========================================
  // PHASE 5: WORLD & BOSS STATE MANAGEMENT
  // ==========================================

  /**
   * Find or initialize user World Progress, Areas, and Boss Progress
   */
  async findOrCreateWorldProgress(userId: string): Promise<{
    worldProgress: DbWorldProgress;
    areas: DbWorldAreaProgress[];
    allBosses: DbBossProgress[];
    activeBoss: DbBossProgress;
  }> {
    // 1. Try Prisma first
    const pgData = await executePrisma(async () => {
      let wp = await prisma.worldProgress.findUnique({
        where: { userId },
      });

      if (!wp) {
        wp = await prisma.worldProgress.create({
          data: {
            userId,
            corruption: 100,
          },
        });
      }

      // Ensure all 6 areas exist
      const userAreas = await prisma.worldAreaProgress.findMany({
        where: { userId },
      });

      if (userAreas.length < WORLD_AREAS.length) {
        for (const areaDef of WORLD_AREAS) {
          const exists = userAreas.some((a) => a.areaKey === areaDef.key);
          if (!exists) {
            const isUnlocked = wp.corruption <= areaDef.requiredCorruption;
            const newArea = await prisma.worldAreaProgress.create({
              data: {
                userId,
                areaKey: areaDef.key,
                isUnlocked,
                restorationPercent: 0,
              },
            });
            userAreas.push(newArea);
          }
        }
      }

      // Ensure all bosses exist
      const userBosses = await prisma.bossProgress.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      if (userBosses.length < BOSS_DEFINITIONS.length) {
        for (const bossDef of BOSS_DEFINITIONS) {
          const exists = userBosses.some((b) => b.bossKey === bossDef.key);
          if (!exists) {
            const newBoss = await prisma.bossProgress.create({
              data: {
                userId,
                bossKey: bossDef.key,
                currentHp: bossDef.maxHp,
                maxHp: bossDef.maxHp,
                isDefeated: false,
              },
            });
            userBosses.push(newBoss);
          }
        }
      }

      // Find active boss
      const sortedBosses = [...userBosses].sort((a, b) => {
        const orderA = getBossDefinition(a.bossKey).order;
        const orderB = getBossDefinition(b.bossKey).order;
        return orderA - orderB;
      });

      const activeBoss =
        sortedBosses.find((b) => !b.isDefeated) || sortedBosses[sortedBosses.length - 1];

      return {
        worldProgress: wp as unknown as DbWorldProgress,
        areas: userAreas as unknown as DbWorldAreaProgress[],
        allBosses: sortedBosses as unknown as DbBossProgress[],
        activeBoss: activeBoss as unknown as DbBossProgress,
      };
    });

    if (pgData) return pgData;

    // 2. Fallback local store
    const store = getLocalStore();
    let wp = store.worldProgress.find((w) => w.userId === userId);
    if (!wp) {
      wp = {
        id: generateId("wp"),
        userId,
        corruption: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.worldProgress.push(wp);
    }

    const userAreas = store.worldAreaProgress.filter((a) => a.userId === userId);
    for (const areaDef of WORLD_AREAS) {
      let area = userAreas.find((a) => a.areaKey === areaDef.key);
      if (!area) {
        const isUnlocked = wp.corruption <= areaDef.requiredCorruption;
        area = {
          id: generateId("wap"),
          userId,
          areaKey: areaDef.key,
          isUnlocked,
          restorationPercent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.worldAreaProgress.push(area);
        userAreas.push(area);
      }
    }

    const userBosses = store.bossProgress.filter((b) => b.userId === userId);
    for (const bossDef of BOSS_DEFINITIONS) {
      let boss = userBosses.find((b) => b.bossKey === bossDef.key);
      if (!boss) {
        boss = {
          id: generateId("bp"),
          userId,
          bossKey: bossDef.key,
          currentHp: bossDef.maxHp,
          maxHp: bossDef.maxHp,
          isDefeated: false,
          defeatedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.bossProgress.push(boss);
        userBosses.push(boss);
      }
    }

    saveLocalStore(store);

    const sortedBosses = [...userBosses].sort((a, b) => {
      const orderA = getBossDefinition(a.bossKey).order;
      const orderB = getBossDefinition(b.bossKey).order;
      return orderA - orderB;
    });

    const activeBoss =
      sortedBosses.find((b) => !b.isDefeated) || sortedBosses[sortedBosses.length - 1];

    return {
      worldProgress: wp,
      areas: userAreas,
      allBosses: sortedBosses,
      activeBoss,
    };
  },

  /**
   * Update World Progress directly
   */
  async updateWorldProgress(
    userId: string,
    data: Partial<DbWorldProgress>
  ): Promise<DbWorldProgress | null> {
    const pgWp = await executePrisma(() =>
      prisma.worldProgress.update({
        where: { userId },
        data,
      })
    );
    if (pgWp) return pgWp as unknown as DbWorldProgress;

    const store = getLocalStore();
    const idx = store.worldProgress.findIndex((w) => w.userId === userId);
    if (idx === -1) return null;

    const updated = {
      ...store.worldProgress[idx],
      ...data,
      updatedAt: new Date(),
    };
    store.worldProgress[idx] = updated;
    saveLocalStore(store);
    return updated;
  },

  /**
   * Retrieve aggregate World State for UI rendering
   */
  async findWorldStateByUserId(userId: string): Promise<WorldStateSummary> {
    const { worldProgress, areas, activeBoss, allBosses } =
      await this.findOrCreateWorldProgress(userId);

    const activeBossDef = getBossDefinition(activeBoss.bossKey);
    const corruption = worldProgress.corruption;
    const integrityPercent = clampRestoration(100 - corruption);

    const enrichedAreas = WORLD_AREAS.map((def) => {
      const prog = areas.find((a) => a.areaKey === def.key);
      const isUnlocked = prog ? prog.isUnlocked : corruption <= def.requiredCorruption;
      const restorationPercent = prog ? prog.restorationPercent : 0;

      let status: "LOCKED" | "CORRUPTED" | "RECLAIMING" | "RESTORED" = "CORRUPTED";
      if (!isUnlocked) {
        status = "LOCKED";
      } else if (restorationPercent >= 100) {
        status = "RESTORED";
      } else if (restorationPercent > 0) {
        status = "RECLAIMING";
      } else {
        status = "CORRUPTED";
      }

      return {
        id: prog ? prog.id : `tmp_${def.key}`,
        userId,
        areaKey: def.key,
        name: def.name,
        subtitle: def.subtitle,
        description: def.description,
        requiredCorruption: def.requiredCorruption,
        accentColor: def.accentColor,
        category: def.category,
        isUnlocked,
        restorationPercent,
        status,
        createdAt: prog?.createdAt || new Date(),
        updatedAt: prog?.updatedAt || new Date(),
      };
    });

    const hpPercent =
      activeBoss.maxHp > 0
        ? Math.round((activeBoss.currentHp / activeBoss.maxHp) * 100)
        : 0;

    return {
      corruption,
      integrityPercent,
      worldProgress,
      areas: enrichedAreas,
      activeBoss: {
        ...activeBoss,
        name: activeBossDef.name,
        title: activeBossDef.title,
        order: activeBossDef.order,
        description: activeBossDef.description,
        threatTrait: activeBossDef.threatTrait,
        threatTraitDesc: activeBossDef.threatTraitDesc,
        corruptionSource: activeBossDef.corruptionSource,
        corruptionSourceDesc: activeBossDef.corruptionSourceDesc,
        accentColor: activeBossDef.accentColor,
        hpPercent,
      },
      allBosses,
    };
  },

  /**
   * Retrieve all Bosses and progression for user
   */
  async findBossesByUserId(userId: string): Promise<DbBossProgress[]> {
    const { allBosses } = await this.findOrCreateWorldProgress(userId);
    return allBosses;
  },

  /**
   * Retrieve active Boss for user
   */
  async findActiveBossByUserId(userId: string): Promise<DbBossProgress> {
    const { activeBoss } = await this.findOrCreateWorldProgress(userId);
    return activeBoss;
  },

  // ==========================================
  // PHASE 6: ARCADE & INVENTORY SYSTEMS
  // ==========================================

  /**
   * Ensure catalog items are seeded in database
   */
  async findOrCreateItems(): Promise<DbItem[]> {
    const pgItems = await executePrisma(async () => {
      const items = await prisma.item.findMany();
      if (items.length < STARTER_CATALOG.length) {
        for (const cat of STARTER_CATALOG) {
          const exists = items.some((i) => i.key === cat.key);
          if (!exists) {
            const newItem = await prisma.item.create({
              data: {
                key: cat.key,
                name: cat.name,
                description: cat.description,
                category: cat.category,
                rarity: cat.rarity,
                price: cat.price,
                icon: cat.icon,
                effectType: cat.effectType,
                effectValue: cat.effectValue,
                slot: cat.slot,
                requiredCorruption: cat.requiredCorruption,
                isActive: cat.isActive,
              },
            });
            items.push(newItem);
          }
        }
      }
      return items;
    });

    if (pgItems) return pgItems as unknown as DbItem[];

    const store = getLocalStore();
    return store.items;
  },

  /**
   * Find all Arcade shop catalog items with user contextual metadata (unlocked, can afford, owned quantity)
   */
  async findShopItems(userId: string): Promise<{
    items: ShopItemView[];
    credits: number;
    corruption: number;
  }> {
    const [character, worldState, allItems, inventory] = await Promise.all([
      this.findCharacterByUserId(userId),
      this.findWorldStateByUserId(userId),
      this.findOrCreateItems(),
      this.findInventoryByUserId(userId),
    ]);

    const credits = character?.credits || 0;
    const corruption = worldState.corruption;

    const items: ShopItemView[] = allItems
      .filter((i) => i.isActive)
      .map((item) => {
        const owned = inventory.find((inv) => inv.itemId === item.id || inv.item?.key === item.key);
        const isUnlocked = corruption <= item.requiredCorruption;
        const canAfford = credits >= item.price;

        return {
          ...item,
          isUnlocked,
          canAfford,
          ownedQuantity: owned?.quantity || 0,
        };
      })
      .sort((a, b) => {
        // Sort by rarity order then price
        const rarityA = RARITY_CONFIG[a.rarity as ItemRarity]?.order || 1;
        const rarityB = RARITY_CONFIG[b.rarity as ItemRarity]?.order || 1;
        if (rarityA !== rarityB) return rarityA - rarityB;
        return a.price - b.price;
      });

    return { items, credits, corruption };
  },

  /**
   * ATOMIC TRANSACTION: Purchase Arcade Item
   * 1. Validates user & character exist
   * 2. Validates item exists, is active, is unlocked by corruption, and user has sufficient credits
   * 3. Deducts item price from character credits
   * 4. Upserts inventory item quantity (+1)
   * 5. Logs economy transaction
   * 6. Commits atomically
   */
  async purchaseItemTransaction(
    userId: string,
    itemId: string
  ): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
    newBalance?: number;
    item?: DbItem;
    inventoryItem?: DbInventoryItem;
  }> {
    // 1. Fetch character, world state, and item
    const [character, worldState, allItems] = await Promise.all([
      this.findCharacterByUserId(userId),
      this.findWorldStateByUserId(userId),
      this.findOrCreateItems(),
    ]);

    if (!character) {
      return {
        success: false,
        error: "Survivor matrix not found.",
        statusCode: 404,
      };
    }

    const item = allItems.find((i) => i.id === itemId || i.key === itemId);
    if (!item) {
      return {
        success: false,
        error: "Target item not found in Arcade catalog.",
        statusCode: 404,
      };
    }

    // 2. Validate Authoritative Purchase Rules
    const validation = validatePurchaseEligibility({
      credits: character.credits,
      itemPrice: item.price,
      isActive: item.isActive,
      requiredCorruption: item.requiredCorruption,
      currentCorruption: worldState.corruption,
    });

    if (!validation.eligible) {
      return {
        success: false,
        error: validation.reason,
        statusCode: validation.statusCode || 400,
      };
    }

    const newBalance = character.credits - item.price;
    const now = new Date();

    // 3. Prisma Atomic Transaction
    const pgResult = await executePrisma(async () => {
      return prisma.$transaction(async (tx) => {
        // Deduct credits
        const updatedChar = await tx.character.update({
          where: { userId },
          data: { credits: newBalance },
        });

        // Upsert inventory item
        const existingInv = await tx.inventoryItem.findUnique({
          where: { userId_itemId: { userId, itemId: item.id } },
        });

        let updatedInv;
        if (existingInv) {
          updatedInv = await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: existingInv.quantity + 1 },
            include: { item: true },
          });
        } else {
          updatedInv = await tx.inventoryItem.create({
            data: {
              userId,
              itemId: item.id,
              quantity: 1,
              isEquipped: false,
            },
            include: { item: true },
          });
        }

        // Log transaction
        await tx.economyTransaction.create({
          data: {
            userId,
            type: "PURCHASE",
            amount: -item.price,
            itemId: item.id,
            description: `Acquired ${item.name} from The Arcade`,
          },
        });

        return {
          char: updatedChar as unknown as DbCharacter,
          inv: updatedInv as unknown as DbInventoryItem,
        };
      });
    });

    if (pgResult) {
      return {
        success: true,
        newBalance: pgResult.char.credits,
        item,
        inventoryItem: pgResult.inv,
      };
    }

    // 4. Local Fallback Atomic Store Commit
    const store = getLocalStore();
    const charIdx = store.characters.findIndex((c) => c.userId === userId);
    if (charIdx === -1) {
      return {
        success: false,
        error: "Survivor character not found in local store.",
        statusCode: 500,
      };
    }

    // Deduct credits
    store.characters[charIdx].credits = newBalance;
    store.characters[charIdx].updatedAt = now;

    // Upsert inventory item
    const invIdx = store.inventoryItems.findIndex(
      (inv) => inv.userId === userId && (inv.itemId === item.id || inv.itemId === item.key)
    );

    let updatedInv: DbInventoryItem;
    if (invIdx >= 0) {
      store.inventoryItems[invIdx].quantity += 1;
      store.inventoryItems[invIdx].updatedAt = now;
      updatedInv = { ...store.inventoryItems[invIdx], item };
    } else {
      updatedInv = {
        id: generateId("inv"),
        userId,
        itemId: item.id,
        quantity: 1,
        isEquipped: false,
        acquiredAt: now,
        updatedAt: now,
        item,
      };
      store.inventoryItems.push(updatedInv);
    }

    // Log economy transaction
    const txRecord: DbEconomyTransaction = {
      id: generateId("etx"),
      userId,
      type: "PURCHASE",
      amount: -item.price,
      itemId: item.id,
      description: `Acquired ${item.name} from The Arcade`,
      createdAt: now,
    };
    store.economyTransactions.push(txRecord);

    saveLocalStore(store);

    return {
      success: true,
      newBalance,
      item,
      inventoryItem: updatedInv,
    };
  },

  /**
   * Find player inventory with linked Item details
   */
  async findInventoryByUserId(userId: string): Promise<DbInventoryItem[]> {
    const pgInv = await executePrisma(() =>
      prisma.inventoryItem.findMany({
        where: { userId },
        include: { item: true },
        orderBy: [{ isEquipped: "desc" }, { acquiredAt: "desc" }],
      })
    );

    if (pgInv) {
      return pgInv.map((inv: any) => ({
        ...inv,
        item: inv.item as DbItem,
      }));
    }

    const store = getLocalStore();
    const allItems = store.items;

    const userInv = store.inventoryItems
      .filter((inv) => inv.userId === userId)
      .map((inv) => {
        const linkedItem = allItems.find(
          (i) => i.id === inv.itemId || i.key === inv.itemId
        );
        return {
          ...inv,
          item: linkedItem,
        };
      });

    return userInv.sort((a, b) => {
      if (a.isEquipped !== b.isEquipped) return a.isEquipped ? -1 : 1;
      const rarityA = RARITY_CONFIG[a.item?.rarity as ItemRarity]?.order || 1;
      const rarityB = RARITY_CONFIG[b.item?.rarity as ItemRarity]?.order || 1;
      if (rarityA !== rarityB) return rarityB - rarityA;
      return b.acquiredAt.getTime() - a.acquiredAt.getTime();
    });
  },

  /**
   * ATOMIC TRANSACTION: Equip Item into Slot
   * 1. Verifies item belongs to user
   * 2. Checks isEquippable(item)
   * 3. Unequips any existing item occupying the same equipment slot
   * 4. Sets isEquipped = true for target item
   */
  async equipInventoryItem(
    userId: string,
    inventoryItemId: string
  ): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
    equippedItem?: DbInventoryItem;
  }> {
    // 1. Prisma Atomic Transaction
    const pgResult = await executePrisma(async () => {
      return prisma.$transaction(async (tx) => {
        const target = await tx.inventoryItem.findFirst({
          where: { id: inventoryItemId, userId },
          include: { item: true },
        });

        if (!target) return { error: "Item not found in your inventory", code: 404 };
        if (!isEquippable(target.item)) {
          return { error: "This item cannot be equipped into a gear slot.", code: 400 };
        }

        const slot = target.item.slot;

        // Unequip any item in the same slot for this user
        if (slot) {
          const slotConflicts = await tx.inventoryItem.findMany({
            where: {
              userId,
              isEquipped: true,
              item: { slot },
            },
          });

          for (const conflict of slotConflicts) {
            await tx.inventoryItem.update({
              where: { id: conflict.id },
              data: { isEquipped: false },
            });
          }
        }

        // Equip target item
        const updated = await tx.inventoryItem.update({
          where: { id: target.id },
          data: { isEquipped: true },
          include: { item: true },
        });

        return { equippedItem: updated as unknown as DbInventoryItem };
      });
    });

    if (pgResult) {
      if ("error" in pgResult) {
        return {
          success: false,
          error: pgResult.error,
          statusCode: pgResult.code,
        };
      }
      return { success: true, equippedItem: pgResult.equippedItem };
    }

    // 2. Local Fallback Atomic Store
    const store = getLocalStore();
    const targetIdx = store.inventoryItems.findIndex(
      (inv) => inv.id === inventoryItemId && inv.userId === userId
    );

    if (targetIdx === -1) {
      return {
        success: false,
        error: "Item not found in your inventory.",
        statusCode: 404,
      };
    }

    const targetInv = store.inventoryItems[targetIdx];
    const linkedItem = store.items.find(
      (i) => i.id === targetInv.itemId || i.key === targetInv.itemId
    );

    if (!linkedItem || !isEquippable(linkedItem)) {
      return {
        success: false,
        error: "This item cannot be equipped into a gear slot.",
        statusCode: 400,
      };
    }

    const slot = linkedItem.slot;

    // Unequip conflicts in same slot
    if (slot) {
      store.inventoryItems.forEach((inv) => {
        if (inv.userId === userId && inv.isEquipped) {
          const i = store.items.find((it) => it.id === inv.itemId || it.key === inv.itemId);
          if (i && i.slot === slot) {
            inv.isEquipped = false;
            inv.updatedAt = new Date();
          }
        }
      });
    }

    // Equip target
    store.inventoryItems[targetIdx].isEquipped = true;
    store.inventoryItems[targetIdx].updatedAt = new Date();
    saveLocalStore(store);

    return {
      success: true,
      equippedItem: { ...store.inventoryItems[targetIdx], item: linkedItem },
    };
  },

  /**
   * Unequip an item
   */
  async unequipInventoryItem(
    userId: string,
    inventoryItemId: string
  ): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
    inventoryItem?: DbInventoryItem;
  }> {
    const pgResult = await executePrisma(async () => {
      const target = await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, userId },
      });
      if (!target) return null;

      const updated = await prisma.inventoryItem.update({
        where: { id: target.id },
        data: { isEquipped: false },
        include: { item: true },
      });
      return updated as unknown as DbInventoryItem;
    });

    if (pgResult) {
      return { success: true, inventoryItem: pgResult };
    }

    const store = getLocalStore();
    const idx = store.inventoryItems.findIndex(
      (inv) => inv.id === inventoryItemId && inv.userId === userId
    );
    if (idx === -1) {
      return { success: false, error: "Item not found.", statusCode: 404 };
    }

    store.inventoryItems[idx].isEquipped = false;
    store.inventoryItems[idx].updatedAt = new Date();
    saveLocalStore(store);

    const linkedItem = store.items.find(
      (i) => i.id === store.inventoryItems[idx].itemId || i.key === store.inventoryItems[idx].itemId
    );

    return {
      success: true,
      inventoryItem: { ...store.inventoryItems[idx], item: linkedItem },
    };
  },

  // ==========================================
  // PHASE 7: SURVIVAL PROTOCOL & STREAKS
  // ==========================================

  /**
   * Find current user streak record
   */
  async findUserStreak(userId: string): Promise<DbUserStreak | null> {
    const pgStreak = await executePrisma(() =>
      prisma.userStreak.findUnique({
        where: { userId },
      })
    );
    if (pgStreak) return pgStreak as unknown as DbUserStreak;

    const store = getLocalStore();
    const streak = store.userStreaks.find((s) => s.userId === userId);
    return streak || null;
  },

  /**
   * Find daily activity record for a specific calendar date (YYYY-MM-DD)
   */
  async findDailyActivity(userId: string, date: string): Promise<DbDailyActivity | null> {
    const pgAct = await executePrisma(() =>
      prisma.dailyActivity.findUnique({
        where: { userId_date: { userId, date } },
      })
    );
    if (pgAct) return pgAct as unknown as DbDailyActivity;

    const store = getLocalStore();
    const act = store.dailyActivities.find((da) => da.userId === userId && da.date === date);
    return act || null;
  },

  /**
   * Find all milestones and user unlocked milestones
   */
  async findUserMilestones(userId: string): Promise<{
    all: DbMilestone[];
    unlocked: DbUserMilestone[];
    unlockedKeys: Set<string>;
  }> {
    const pgResult = await executePrisma(async () => {
      const allMilestones = await prisma.milestone.findMany({
        orderBy: { requirementValue: "asc" },
      });

      if (allMilestones.length < SURVIVAL_MILESTONES.length) {
        for (const mDef of SURVIVAL_MILESTONES) {
          const exists = allMilestones.some((m) => m.key === mDef.key);
          if (!exists) {
            const created = await prisma.milestone.create({
              data: {
                key: mDef.key,
                name: mDef.name,
                description: mDef.description,
                loreQuote: mDef.loreQuote,
                requirementType: mDef.requirementType,
                requirementValue: mDef.requirementValue,
                rewardCredits: mDef.rewardCredits,
                rewardXP: mDef.rewardXP,
                icon: mDef.icon,
              },
            });
            allMilestones.push(created);
          }
        }
      }

      const unlocked = await prisma.userMilestone.findMany({
        where: { userId },
        include: { milestone: true },
        orderBy: { unlockedAt: "desc" },
      });

      const unlockedKeys = new Set(unlocked.map((um) => um.milestone.key));

      return {
        all: allMilestones as unknown as DbMilestone[],
        unlocked: unlocked as unknown as DbUserMilestone[],
        unlockedKeys,
      };
    });

    if (pgResult) return pgResult;

    const store = getLocalStore();
    const unlocked = store.userMilestones
      .filter((um) => um.userId === userId)
      .map((um) => {
        const milestone = store.milestones.find((m) => m.id === um.milestoneId);
        return { ...um, milestone };
      });

    const unlockedKeys = new Set(
      unlocked.map((um) => um.milestone?.key).filter(Boolean) as string[]
    );

    return {
      all: store.milestones,
      unlocked,
      unlockedKeys,
    };
  },

  /**
   * Find active unexpired Comeback Challenge for user
   */
  async findActiveComebackChallenge(userId: string): Promise<DbComebackChallenge | null> {
    const now = new Date();
    const pgChallenge = await executePrisma(() =>
      prisma.comebackChallenge.findFirst({
        where: {
          userId,
          completed: false,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      })
    );
    if (pgChallenge) return pgChallenge as unknown as DbComebackChallenge;

    const store = getLocalStore();
    const active = store.comebackChallenges.find(
      (cc) => cc.userId === userId && !cc.completed && !isComebackExpired(cc.expiresAt, now)
    );
    return active || null;
  },

  /**
   * Start or restart a Comeback Challenge for user
   */
  async startComebackChallenge(userId: string): Promise<DbComebackChallenge> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + COMEBACK_CONFIG.durationMs);

    const pgChallenge = await executePrisma(() =>
      prisma.comebackChallenge.create({
        data: {
          userId,
          startedAt: now,
          expiresAt,
          missionsRequired: COMEBACK_CONFIG.missionsRequired,
          missionsCompleted: 0,
          completed: false,
          rewardClaimed: false,
        },
      })
    );
    if (pgChallenge) return pgChallenge as unknown as DbComebackChallenge;

    const store = getLocalStore();
    const newChallenge: DbComebackChallenge = {
      id: generateId("cmc"),
      userId,
      startedAt: now,
      expiresAt,
      missionsRequired: COMEBACK_CONFIG.missionsRequired,
      missionsCompleted: 0,
      completed: false,
      rewardClaimed: false,
      createdAt: now,
      updatedAt: now,
    };
    store.comebackChallenges.push(newChallenge);
    saveLocalStore(store);
    return newChallenge;
  },

  /**
   * Comprehensive Streak & Signal Telemetry Summary for UI HUD
   */
  async findStreakSummary(userId: string, userTimezone?: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    lastActiveDate: Date | null;
    todayActive: boolean;
    nextMilestone: {
      name: string;
      days: number;
      remaining: number;
    } | null;
    signal: SignalStatus;
    streakBroken: boolean;
    previousStreak: number;
  }> {
    const user = await this.findUserById(userId);
    const resolvedTimezone = userTimezone || user?.timezone || "UTC";
    const now = new Date();
    const todayStr = getLogicalDate(now, resolvedTimezone);

    const streakRecord = await this.findUserStreak(userId);
    const todayActivity = await this.findDailyActivity(userId, todayStr);
    const todayActive = !!todayActivity && todayActivity.missionsCompleted > 0;

    let currentStreak = streakRecord?.currentStreak ?? 0;
    const longestStreak = streakRecord?.longestStreak ?? 0;
    const totalActiveDays = streakRecord?.totalActiveDays ?? 0;
    const lastActiveDate = streakRecord?.lastActiveDate ?? null;

    let streakBroken = false;
    const previousStreak = currentStreak;

    if (lastActiveDate) {
      const lastActiveStr = getLogicalDate(lastActiveDate, resolvedTimezone);
      if (!isSameDay(lastActiveStr, todayStr) && !isYesterday(lastActiveStr, todayStr)) {
        streakBroken = true;
        // The streak has lapsed since last activity
        currentStreak = 0;
      }
    }

    const nextMilestoneDef = getNextMilestone(currentStreak);
    const nextMilestone = nextMilestoneDef
      ? {
          name: nextMilestoneDef.milestone.name,
          days: nextMilestoneDef.milestone.requirementValue,
          remaining: nextMilestoneDef.remainingDays,
        }
      : null;

    const signal = getSignalStrength(currentStreak, todayActive);

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
      lastActiveDate,
      todayActive,
      nextMilestone,
      signal,
      streakBroken,
      previousStreak,
    };
  },

  /**
   * Find active unexpired UserWorldEvent with template included
   */
  async findActiveUserWorldEvent(userId: string): Promise<DbUserWorldEvent | null> {
    const now = new Date();
    const pgEvent = await executePrisma(async () => {
      const event = await prisma.userWorldEvent.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        include: {
          worldEvent: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!event) {
        // Also check if an active event has expired and mark it
        const expiredEvent = await prisma.userWorldEvent.findFirst({
          where: {
            userId,
            status: "ACTIVE",
            expiresAt: { lte: now },
          },
        });
        if (expiredEvent) {
          await prisma.userWorldEvent.update({
            where: { id: expiredEvent.id },
            data: { status: "EXPIRED" },
          });
        }
        return null;
      }

      return event;
    });

    if (pgEvent !== null) return pgEvent as unknown as DbUserWorldEvent;

    const store = getLocalStore();
    const event = store.userWorldEvents.find(
      (uwe) => uwe.userId === userId && uwe.status === "ACTIVE"
    );
    if (!event) return null;

    if (now.getTime() >= new Date(event.expiresAt).getTime() && !event.completed) {
      event.status = "EXPIRED";
      saveLocalStore(store);
      return null;
    }

    const template = store.worldEvents.find((we) => we.id === event.worldEventId);
    return {
      ...event,
      worldEvent: template,
    };
  },

  /**
   * Find historical completed and expired events for a user
   */
  async findUserWorldEventHistory(userId: string, limit = 20): Promise<DbUserWorldEvent[]> {
    const pgHistory = await executePrisma(async () => {
      return prisma.userWorldEvent.findMany({
        where: {
          userId,
          status: { in: ["COMPLETED", "EXPIRED"] },
        },
        include: {
          worldEvent: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    });

    if (pgHistory) return pgHistory as unknown as DbUserWorldEvent[];

    const store = getLocalStore();
    return store.userWorldEvents
      .filter((uwe) => uwe.userId === userId && (uwe.status === "COMPLETED" || uwe.status === "EXPIRED"))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((uwe) => ({
        ...uwe,
        worldEvent: store.worldEvents.find((we) => we.id === uwe.worldEventId),
      }));
  },

  /**
   * Retrieve all world lore logs discovered by a survivor
   */
  async findUserLoreUnlocks(userId: string): Promise<DbUserLoreUnlock[]> {
    const pgLore = await executePrisma(async () => {
      return prisma.userLoreUnlock.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
      });
    });

    if (pgLore) return pgLore as unknown as DbUserLoreUnlock[];

    const store = getLocalStore();
    return (store.userLoreUnlocks || [])
      .filter((u) => u.userId === userId)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
  },

  /**
   * Idempotently unlock a lore log for a survivor
   */
  async saveUserLoreUnlock(userId: string, loreKey: string): Promise<DbUserLoreUnlock | null> {
    const loreDef = getLoreDefinition(loreKey);
    if (!loreDef) return null;

    const pgLore = await executePrisma(async () => {
      const existing = await prisma.userLoreUnlock.findUnique({
        where: { userId_loreKey: { userId, loreKey } },
      });
      if (existing) return null;

      return prisma.userLoreUnlock.create({
        data: {
          userId,
          loreKey,
          title: loreDef.title,
          content: loreDef.content,
          source: loreDef.source,
          unlockedAt: new Date(),
        },
      });
    });

    if (pgLore !== undefined) return pgLore as unknown as DbUserLoreUnlock | null;

    const store = getLocalStore();
    const existing = (store.userLoreUnlocks || []).find(
      (u) => u.userId === userId && u.loreKey === loreKey
    );
    if (existing) return null;

    const newUnlock: DbUserLoreUnlock = {
      id: generateId("lore"),
      userId,
      loreKey,
      title: loreDef.title,
      content: loreDef.content,
      source: loreDef.source,
      unlockedAt: new Date(),
    };
    store.userLoreUnlocks.push(newUnlock);
    saveLocalStore(store);
    return newUnlock;
  },

  /**
   * Context-aware event generation: Ensures an active event exists if eligible
   */
  async ensureUserWorldEvent(userId: string, bypassCooldown = false): Promise<DbUserWorldEvent | null> {
    const active = await this.findActiveUserWorldEvent(userId);
    if (active) return active;

    const history = await this.findUserWorldEventHistory(userId, 5);
    const lastEvent = history[0];
    const lastFinishedAt = lastEvent?.completedAt || lastEvent?.expiresAt || null;

    if (!isEligibleForNewEvent(false, lastFinishedAt, new Date(), bypassCooldown)) {
      return null;
    }

    const { worldProgress, activeBoss } = await this.findOrCreateWorldProgress(userId);
    const char = await this.findCharacterByUserId(userId);

    const ctx: EventGenerationContext = {
      corruption: worldProgress.corruption,
      activeBossDefeated: activeBoss.isDefeated,
      activeBossKey: activeBoss.bossKey,
      characterAttributes: char
        ? {
            mind: char.mind,
            body: char.body,
            focus: char.focus,
            spirit: char.spirit,
            connection: char.connection,
          }
        : undefined,
      recentCompletedEventKeys: history
        .map((h) => h.worldEvent?.key)
        .filter(Boolean) as string[],
      lastEventFinishedAt: lastFinishedAt,
    };

    const template = selectEligibleEventTemplate(ctx);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + template.durationHours * 60 * 60 * 1000);

    const pgUserEvent = await executePrisma(async () => {
      const dbTemplate = await prisma.worldEvent.upsert({
        where: { key: template.key },
        update: {},
        create: {
          key: template.key,
          title: template.title,
          description: template.description,
          loreSnippet: template.loreSnippet,
          targetAttribute: template.targetAttribute,
          targetArea: template.targetArea || null,
          requiredCompletions: template.requiredCompletions,
          rewardCredits: template.rewardCredits,
          rewardXp: template.rewardXp,
          corruptionChange: template.corruptionChange,
          bossDamageBonus: template.bossDamageBonus,
          rarity: template.rarity,
          loreId: template.loreId || null,
        },
      });

      return prisma.userWorldEvent.create({
        data: {
          userId,
          worldEventId: dbTemplate.id,
          status: "ACTIVE",
          progress: 0,
          requiredProgress: template.requiredCompletions,
          completed: false,
          rewardClaimed: false,
          startsAt: now,
          expiresAt,
        },
        include: {
          worldEvent: true,
        },
      });
    });

    if (pgUserEvent) return pgUserEvent as unknown as DbUserWorldEvent;

    const store = getLocalStore();
    let dbTemplate = store.worldEvents.find((we) => we.key === template.key);
    if (!dbTemplate) {
      dbTemplate = {
        id: `we_${template.key.toLowerCase()}`,
        key: template.key,
        title: template.title,
        description: template.description,
        loreSnippet: template.loreSnippet,
        targetAttribute: template.targetAttribute,
        targetArea: template.targetArea || null,
        requiredCompletions: template.requiredCompletions,
        rewardCredits: template.rewardCredits,
        rewardXp: template.rewardXp,
        corruptionChange: template.corruptionChange,
        bossDamageBonus: template.bossDamageBonus,
        rarity: template.rarity,
        loreId: template.loreId || null,
        createdAt: now,
        updatedAt: now,
      };
      store.worldEvents.push(dbTemplate);
    }

    const newUserEvent: DbUserWorldEvent = {
      id: generateId("uwe"),
      userId,
      worldEventId: dbTemplate.id,
      status: "ACTIVE",
      progress: 0,
      requiredProgress: template.requiredCompletions,
      completed: false,
      rewardClaimed: false,
      startsAt: now,
      expiresAt,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      worldEvent: dbTemplate,
    };

    store.userWorldEvents.push(newUserEvent);
    saveLocalStore(store);
    return newUserEvent;
  },

  /**
   * Directly assign a specific World Event to a user (used for testing and deterministic triggers)
   */
  async ensureUserWorldEventForTesting(
    userId: string,
    eventKey: WorldEventKey,
    options?: { customDurationHours?: number }
  ): Promise<DbUserWorldEvent> {
    const template = getWorldEventDefinition(eventKey);
    const now = new Date();
    const durationHours = options?.customDurationHours ?? template.durationHours;
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const pgUserEvent = await executePrisma(async () => {
      // Clean up previous active events for user to ensure single active event
      await prisma.userWorldEvent.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      });

      const dbTemplate = await prisma.worldEvent.upsert({
        where: { key: template.key },
        update: {},
        create: {
          key: template.key,
          title: template.title,
          description: template.description,
          loreSnippet: template.loreSnippet,
          targetAttribute: template.targetAttribute,
          targetArea: template.targetArea || null,
          requiredCompletions: template.requiredCompletions,
          rewardCredits: template.rewardCredits,
          rewardXp: template.rewardXp,
          corruptionChange: template.corruptionChange,
          bossDamageBonus: template.bossDamageBonus,
          rarity: template.rarity,
          loreId: template.loreId || null,
        },
      });

      return prisma.userWorldEvent.create({
        data: {
          userId,
          worldEventId: dbTemplate.id,
          status: "ACTIVE",
          progress: 0,
          requiredProgress: template.requiredCompletions,
          completed: false,
          rewardClaimed: false,
          startsAt: now,
          expiresAt,
        },
        include: {
          worldEvent: true,
        },
      });
    });

    if (pgUserEvent) return pgUserEvent as unknown as DbUserWorldEvent;

    const store = getLocalStore();
    for (const uwe of store.userWorldEvents) {
      if (uwe.userId === userId && uwe.status === "ACTIVE") {
        uwe.status = "EXPIRED";
      }
    }

    let dbTemplate = store.worldEvents.find((we) => we.key === template.key);
    if (!dbTemplate) {
      dbTemplate = {
        id: `we_${template.key.toLowerCase()}`,
        key: template.key,
        title: template.title,
        description: template.description,
        loreSnippet: template.loreSnippet,
        targetAttribute: template.targetAttribute,
        targetArea: template.targetArea || null,
        requiredCompletions: template.requiredCompletions,
        rewardCredits: template.rewardCredits,
        rewardXp: template.rewardXp,
        corruptionChange: template.corruptionChange,
        bossDamageBonus: template.bossDamageBonus,
        rarity: template.rarity,
        loreId: template.loreId || null,
        createdAt: now,
        updatedAt: now,
      };
      store.worldEvents.push(dbTemplate);
    }

    const newUserEvent: DbUserWorldEvent = {
      id: generateId("uwe"),
      userId,
      worldEventId: dbTemplate.id,
      status: "ACTIVE",
      progress: 0,
      requiredProgress: template.requiredCompletions,
      completed: false,
      rewardClaimed: false,
      startsAt: now,
      expiresAt,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      worldEvent: dbTemplate,
    };

    store.userWorldEvents.push(newUserEvent);
    saveLocalStore(store);
    return newUserEvent;
  },

  /**
   * ATOMIC TRANSACTION: Complete Mission & Award Full Phase 5, 6 & 7 Progression
   * 1. Validates ownership & existence
   * 2. Checks duplicate completion rules
   * 3. Calculates authoritative character XP, credits, attribute boost, and level advancement
   * 4. Calculates authoritative World Corruption reduction & Area Restoration
   * 5. Calculates authoritative Boss damage, defeat states, and next boss transitions
   * 6. Calculates authoritative DailyActivity, Streaks, Milestones & Comeback progress
   * 7. Creates historical MissionCompletion and EconomyTransaction records
   * 8. Atomically updates Character, WorldProgress, BossProgress, UserStreak, DailyActivity, Milestones
   */
  async completeMissionTransaction(
    userId: string,
    missionId: string,
    userTimezone?: string
  ): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
    mission?: DbMission;
    rewards?: any;
    character?: DbCharacter;
    levelUp?: {
      occurred: boolean;
      previousLevel: number;
      newLevel: number;
      levelsGained: number;
    };
    world?: {
      corruptionBefore: number;
      corruptionAfter: number;
      corruptionReduced: number;
      integrityPercent: number;
    };
    boss?: {
      key: string;
      name: string;
      title: string;
      damageDealt: number;
      hpBefore: number;
      hpAfter: number;
      maxHp: number;
      isDefeated: boolean;
      defeatedAt: Date | null;
      nextBossKey?: string | null;
      nextBossName?: string | null;
    };
    area?: {
      areaKey: string;
      name: string;
      restorationGained: number;
      restorationPercent: number;
      isRestored: boolean;
      isUnlocked: boolean;
      newlyUnlockedAreas: string[];
    };
    streak?: {
      currentStreak: number;
      longestStreak: number;
      totalActiveDays: number;
      streakAdvanced: boolean;
      streakBroken: boolean;
      isFirstDay: boolean;
      todayActive: boolean;
    };
    milestonesUnlocked?: MilestoneDefinition[];
    comeback?: {
      active: boolean;
      completed: boolean;
      rewardClaimed: boolean;
      missionsCompleted: number;
      missionsRequired: number;
      corruptionReduced?: number;
      bonusCredits?: number;
    } | null;
    survivalSecuredToday?: boolean;
    verification?: {
      type: VerificationType;
      signalIntegrity: number;
      status: string;
    };
    event?: {
      id: string;
      key: string;
      title: string;
      progress: number;
      requiredProgress: number;
      completed: boolean;
      newlyCompleted: boolean;
      rewardClaimed: boolean;
      rewardCredits: number;
      rewardXp: number;
      corruptionReduced?: number;
      bossDamageDealt?: number;
      loreUnlocked?: DbUserLoreUnlock | null;
      loreSnippet?: string | null;
    } | null;
  }> {
    // 1. Fetch Mission, Character & User
    const mission = await this.findMissionById(missionId, userId);
    if (!mission) {
      return {
        success: false,
        error: "Mission anomaly: Target mission not found in your dossier.",
        statusCode: 404,
      };
    }

    const character = await this.findCharacterByUserId(userId);
    if (!character) {
      return {
        success: false,
        error: "Survivor matrix not found. Please re-enter the realm.",
        statusCode: 404,
      };
    }

    const user = await this.findUserById(userId);
    const resolvedTimezone = userTimezone || user?.timezone || "UTC";

    // 2. Validate Duplicate Completion
    const eligibility = validateMissionCompletionEligibility(
      mission.frequency,
      mission.lastCompletedAt
    );
    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason || "MISSION ALREADY COMPLETED",
        statusCode: 400,
      };
    }

    // 2b. Phase 9 Signal Integrity & Anti-Bypass Enforcement
    const vType = (mission.verificationType as VerificationType) || "SELF_REPORT";
    if (vType === "EVIDENCE") {
      const evidence = await this.findMissionEvidence(userId, missionId);
      if (!evidence || evidence.length === 0) {
        return {
          success: false,
          error: "EVIDENCE REQUIRED: Submit verification evidence before closing this mission.",
          statusCode: 400,
        };
      }
    } else if (vType === "FOCUS_SESSION") {
      const completedSession = await this.findCompletedFocusSession(userId, missionId);
      if (!completedSession) {
        return {
          success: false,
          error: "FOCUS SESSION REQUIRED: Complete the verification protocol before closing this mission.",
          statusCode: 400,
        };
      }
    }

    // 3. Load Current World & Boss State
    const { worldProgress, areas, activeBoss, allBosses } =
      await this.findOrCreateWorldProgress(userId);

    // 4. Process Authoritative Game Math
    // A) Character Progression (XP, Credits, Attributes, Level)
    const { rewards, updatedStats, levelUp } = processProgressionMath(character, mission);

    // B) World Corruption Reduction
    const corruptionReduction = getCorruptionReduction(mission.difficulty);
    const corruptionBefore = worldProgress.corruption;
    let corruptionAfter = clampCorruption(corruptionBefore - corruptionReduction);

    // C) World Area Restoration & Unlocking
    const targetAreaKey = getAreaForCategory(mission.category);
    const targetAreaDef = WORLD_AREAS.find((a) => a.key === targetAreaKey) || WORLD_AREAS[0];
    const restorationGain = getAreaRestorationGain(mission.difficulty);

    const currentAreaProg = areas.find((a) => a.areaKey === targetAreaKey);
    const currentRestoration = currentAreaProg ? currentAreaProg.restorationPercent : 0;
    const newRestoration = clampRestoration(currentRestoration + restorationGain);
    const isRestored = newRestoration >= 100;

    // Determine newly unlocked areas across the map
    const newlyUnlockedAreas: string[] = [];
    const updatedAreasMap = areas.map((a) => {
      const def = WORLD_AREAS.find((wa) => wa.key === a.areaKey);
      const threshold = def ? def.requiredCorruption : 100;
      const wasUnlocked = a.isUnlocked;
      const nowUnlocked = corruptionAfter <= threshold;

      if (!wasUnlocked && nowUnlocked) {
        newlyUnlockedAreas.push(a.areaKey);
      }

      return {
        ...a,
        isUnlocked: wasUnlocked || nowUnlocked,
        restorationPercent: a.areaKey === targetAreaKey ? newRestoration : a.restorationPercent,
      };
    });

    // D) Active Boss Damage & Defeat Resolution
    const bossDamage = getBossDamage(mission.difficulty);
    const bossDef = getBossDefinition(activeBoss.bossKey);
    const damageCalc = processBossDamageCalculation(
      activeBoss.currentHp,
      activeBoss.maxHp,
      bossDamage
    );

    let isBossDefeatedNow = damageCalc.isDefeated;
    let defeatedAt = isBossDefeatedNow ? new Date() : activeBoss.defeatedAt;
    let nextBossKey: string | null = null;
    let nextBossName: string | null = null;

    if (isBossDefeatedNow) {
      updatedStats.xp += bossDef.banishBonusXp;
      corruptionAfter = clampCorruption(corruptionAfter - bossDef.banishCorruptionDrop);

      const nextBossDef = getNextBossDefinition(activeBoss.bossKey);
      if (nextBossDef) {
        nextBossKey = nextBossDef.key;
        nextBossName = nextBossDef.name;
      }
    }

    const completedAt = new Date();
    const todayStr = getLogicalDate(completedAt, resolvedTimezone);

    // E) Survival Protocol: Streaks, Milestones & Comeback Math
    const existingStreak = await this.findUserStreak(userId);
    const streakCalc = calculateStreakUpdate({
      lastActiveDateStr: existingStreak?.lastActiveDate
        ? getLogicalDate(existingStreak.lastActiveDate, resolvedTimezone)
        : null,
      currentStreak: existingStreak?.currentStreak ?? 0,
      longestStreak: existingStreak?.longestStreak ?? 0,
      totalActiveDays: existingStreak?.totalActiveDays ?? 0,
      todayStr,
    });

    // Milestone checks
    const { unlockedKeys } = await this.findUserMilestones(userId);
    const newlyUnlockedMilestones = checkMilestones(
      streakCalc.currentStreak,
      streakCalc.totalActiveDays,
      unlockedKeys
    );

    let totalMilestoneCredits = 0;
    let totalMilestoneXP = 0;
    for (const m of newlyUnlockedMilestones) {
      totalMilestoneCredits += m.rewardCredits;
      totalMilestoneXP += m.rewardXP;
    }
    updatedStats.credits += totalMilestoneCredits;
    updatedStats.xp += totalMilestoneXP;

    // Comeback challenge tracking
    const existingComeback = await this.findActiveComebackChallenge(userId);
    let comebackStatus: {
      active: boolean;
      completed: boolean;
      rewardClaimed: boolean;
      missionsCompleted: number;
      missionsRequired: number;
      corruptionReduced?: number;
      bonusCredits?: number;
    } | null = null;

    let comebackChallengeToUpsert: DbComebackChallenge | null = null;
    let comebackRewardClaimedNow = false;

    if (
      existingComeback &&
      !existingComeback.completed &&
      !isComebackExpired(existingComeback.expiresAt, completedAt)
    ) {
      const newMissionsCompleted = existingComeback.missionsCompleted + 1;
      const isCompletedNow = newMissionsCompleted >= existingComeback.missionsRequired;

      comebackChallengeToUpsert = {
        ...existingComeback,
        missionsCompleted: newMissionsCompleted,
        completed: isCompletedNow,
        rewardClaimed: isCompletedNow,
        updatedAt: completedAt,
      };

      if (isCompletedNow) {
        comebackRewardClaimedNow = true;
        updatedStats.credits += COMEBACK_CONFIG.rewardCredits;
        corruptionAfter = clampCorruption(corruptionAfter - COMEBACK_CONFIG.corruptionReduction);
        comebackStatus = {
          active: false,
          completed: true,
          rewardClaimed: true,
          missionsCompleted: newMissionsCompleted,
          missionsRequired: existingComeback.missionsRequired,
          corruptionReduced: COMEBACK_CONFIG.corruptionReduction,
          bonusCredits: COMEBACK_CONFIG.rewardCredits,
        };
      } else {
        comebackStatus = {
          active: true,
          completed: false,
          rewardClaimed: false,
          missionsCompleted: newMissionsCompleted,
          missionsRequired: existingComeback.missionsRequired,
        };
      }
    } else if (
      streakCalc.streakBroken &&
      (!existingComeback || isComebackExpired(existingComeback.expiresAt, completedAt))
    ) {
      // Auto-start comeback challenge when streak is broken
      const expiresAt = new Date(completedAt.getTime() + COMEBACK_CONFIG.durationMs);
      comebackChallengeToUpsert = {
        id: generateId("cmc"),
        userId,
        startedAt: completedAt,
        expiresAt,
        missionsRequired: COMEBACK_CONFIG.missionsRequired,
        missionsCompleted: 1, // Current completed mission counts toward comeback!
        completed: false,
        rewardClaimed: false,
        createdAt: completedAt,
        updatedAt: completedAt,
      };
      comebackStatus = {
        active: true,
        completed: false,
        rewardClaimed: false,
        missionsCompleted: 1,
        missionsRequired: COMEBACK_CONFIG.missionsRequired,
      };
    }

    // Phase 8: Active World Event Tracking
    const activeUserEvent = await this.findActiveUserWorldEvent(userId);
    let eventResult: {
      id: string;
      key: string;
      title: string;
      progress: number;
      requiredProgress: number;
      completed: boolean;
      newlyCompleted: boolean;
      rewardClaimed: boolean;
      rewardCredits: number;
      rewardXp: number;
      corruptionReduced?: number;
      bossDamageDealt?: number;
      loreUnlocked?: DbUserLoreUnlock | null;
      loreSnippet?: string | null;
    } | null = null;

    let userEventToUpdate: DbUserWorldEvent | null = null;
    let eventLoreToUnlock: DbUserLoreUnlock | null = null;
    let eventBonusCredits = 0;
    let eventBonusXp = 0;

    if (
      activeUserEvent &&
      activeUserEvent.status === "ACTIVE" &&
      !activeUserEvent.completed &&
      !isEventExpired(activeUserEvent.expiresAt, completedAt)
    ) {
      const targetAttr = activeUserEvent.worldEvent?.targetAttribute || "ANY";
      const isMatch = targetAttr === "ANY" || targetAttr === mission.category;

      if (isMatch) {
        const nextProgress = Math.min(activeUserEvent.requiredProgress, activeUserEvent.progress + 1);
        const newlyCompleted = nextProgress >= activeUserEvent.requiredProgress && !activeUserEvent.completed;

        userEventToUpdate = {
          ...activeUserEvent,
          progress: nextProgress,
          completed: newlyCompleted || activeUserEvent.completed,
          status: newlyCompleted ? "COMPLETED" : "ACTIVE",
          rewardClaimed: newlyCompleted || activeUserEvent.rewardClaimed,
          completedAt: newlyCompleted ? completedAt : activeUserEvent.completedAt,
          updatedAt: completedAt,
        };

        let extraCorruptionReduced = 0;
        let extraBossDamage = 0;

        if (newlyCompleted) {
          eventBonusCredits = activeUserEvent.worldEvent?.rewardCredits || 0;
          eventBonusXp = activeUserEvent.worldEvent?.rewardXp || 0;
          updatedStats.credits += eventBonusCredits;
          updatedStats.xp += eventBonusXp;

          // Event corruption bonus
          if (activeUserEvent.worldEvent?.corruptionChange && activeUserEvent.worldEvent.corruptionChange < 0) {
            const extraRed = Math.abs(activeUserEvent.worldEvent.corruptionChange);
            corruptionAfter = clampCorruption(corruptionAfter - extraRed);
            extraCorruptionReduced = extraRed;
          }

          // Event boss damage bonus
          if (
            activeUserEvent.worldEvent?.bossDamageBonus &&
            activeUserEvent.worldEvent.bossDamageBonus > 0 &&
            !activeBoss.isDefeated
          ) {
            extraBossDamage = activeUserEvent.worldEvent.bossDamageBonus;
            damageCalc.damageDealt += extraBossDamage;
            damageCalc.hpAfter = Math.max(0, damageCalc.hpAfter - extraBossDamage);
            if (damageCalc.hpAfter === 0) {
              isBossDefeatedNow = true;
              defeatedAt = completedAt;
              const nextBoss = getNextBossDefinition(activeBoss.bossKey);
              nextBossKey = nextBoss?.key || null;
              nextBossName = nextBoss?.name || null;
            }
          }

          // Check Lore Unlock
          if (activeUserEvent.worldEvent?.loreId) {
            const existingLores = await this.findUserLoreUnlocks(userId);
            if (!existingLores.some((l) => l.loreKey === activeUserEvent.worldEvent!.loreId)) {
              const loreDef = getLoreDefinition(activeUserEvent.worldEvent.loreId);
              if (loreDef) {
                eventLoreToUnlock = {
                  id: generateId("lur"),
                  userId,
                  loreKey: loreDef.key,
                  title: loreDef.title,
                  content: loreDef.content,
                  source: activeUserEvent.worldEvent.title,
                  unlockedAt: completedAt,
                };
              }
            }
          }
        }

        eventResult = {
          id: activeUserEvent.id,
          key: activeUserEvent.worldEvent?.key || "ANOMALY",
          title: activeUserEvent.worldEvent?.title || "SUPERVISION ANOMALY",
          progress: nextProgress,
          requiredProgress: activeUserEvent.requiredProgress,
          completed: userEventToUpdate.completed,
          newlyCompleted,
          rewardClaimed: userEventToUpdate.rewardClaimed,
          rewardCredits: eventBonusCredits,
          rewardXp: eventBonusXp,
          corruptionReduced: extraCorruptionReduced,
          bossDamageDealt: extraBossDamage,
          loreUnlocked: eventLoreToUnlock,
          loreSnippet: activeUserEvent.worldEvent?.loreSnippet || null,
        };
      } else {
        // Mission did not match category, return active status without progress increment
        eventResult = {
          id: activeUserEvent.id,
          key: activeUserEvent.worldEvent?.key || "ANOMALY",
          title: activeUserEvent.worldEvent?.title || "SUPERVISION ANOMALY",
          progress: activeUserEvent.progress,
          requiredProgress: activeUserEvent.requiredProgress,
          completed: activeUserEvent.completed,
          newlyCompleted: false,
          rewardClaimed: activeUserEvent.rewardClaimed,
          rewardCredits: 0,
          rewardXp: 0,
          loreSnippet: activeUserEvent.worldEvent?.loreSnippet || null,
        };
      }
    }

    // 5. Execute Atomic Persistence
    const pgResult = await executePrisma(async () => {
      return prisma.$transaction(async (tx) => {
        // Create MissionCompletion
        const completion = await tx.missionCompletion.create({
          data: {
            missionId: mission.id,
            userId,
            xpEarned: rewards.xp,
            creditsEarned: rewards.credits,
            completedAt,
          },
        });

        // Log Mission Reward Economy Transaction
        await tx.economyTransaction.create({
          data: {
            userId,
            type: "MISSION_REWARD",
            amount: rewards.credits,
            description: `Reward for clearing mission: ${mission.title}`,
          },
        });

        // Update Character
        const updatedChar = await tx.character.update({
          where: { userId },
          data: updatedStats,
        });

        // Update Mission (if ONCE)
        let updatedMsn = mission;
        if (mission.frequency === "ONCE") {
          await tx.mission.update({
            where: { id: mission.id },
            data: { status: "COMPLETED", isActive: false },
          });
          updatedMsn = {
            ...mission,
            status: "COMPLETED",
            isActive: false,
          };
        }

        // Update WorldProgress
        const updatedWp = await tx.worldProgress.update({
          where: { userId },
          data: { corruption: corruptionAfter },
        });

        // Update World Area Progresses
        for (const ua of updatedAreasMap) {
          await tx.worldAreaProgress.upsert({
            where: { userId_areaKey: { userId, areaKey: ua.areaKey } },
            update: {
              isUnlocked: ua.isUnlocked,
              restorationPercent: ua.restorationPercent,
            },
            create: {
              userId,
              areaKey: ua.areaKey,
              isUnlocked: ua.isUnlocked,
              restorationPercent: ua.restorationPercent,
            },
          });
        }

        // Update Active Boss Progress
        const updatedBoss = await tx.bossProgress.update({
          where: { userId_bossKey: { userId, bossKey: activeBoss.bossKey } },
          data: {
            currentHp: damageCalc.hpAfter,
            isDefeated: activeBoss.isDefeated || isBossDefeatedNow,
            defeatedAt,
          },
        });

        // Upsert UserStreak
        await tx.userStreak.upsert({
          where: { userId },
          update: {
            currentStreak: streakCalc.currentStreak,
            longestStreak: streakCalc.longestStreak,
            totalActiveDays: streakCalc.totalActiveDays,
            lastActiveDate: completedAt,
          },
          create: {
            userId,
            currentStreak: streakCalc.currentStreak,
            longestStreak: streakCalc.longestStreak,
            totalActiveDays: streakCalc.totalActiveDays,
            lastActiveDate: completedAt,
          },
        });

        // Upsert DailyActivity
        const existingActivity = await tx.dailyActivity.findUnique({
          where: { userId_date: { userId, date: todayStr } },
        });
        if (existingActivity) {
          await tx.dailyActivity.update({
            where: { id: existingActivity.id },
            data: {
              missionsCompleted: existingActivity.missionsCompleted + 1,
              xpEarned: existingActivity.xpEarned + rewards.xp,
              creditsEarned: existingActivity.creditsEarned + rewards.credits,
            },
          });
        } else {
          await tx.dailyActivity.create({
            data: {
              userId,
              date: todayStr,
              missionsCompleted: 1,
              xpEarned: rewards.xp,
              creditsEarned: rewards.credits,
            },
          });
        }

        // Newly unlocked milestones
        for (const m of newlyUnlockedMilestones) {
          let dbMilestone = await tx.milestone.findUnique({ where: { key: m.key } });
          if (!dbMilestone) {
            dbMilestone = await tx.milestone.create({
              data: {
                key: m.key,
                name: m.name,
                description: m.description,
                loreQuote: m.loreQuote,
                requirementType: m.requirementType,
                requirementValue: m.requirementValue,
                rewardCredits: m.rewardCredits,
                rewardXP: m.rewardXP,
                icon: m.icon,
              },
            });
          }
          await tx.userMilestone.create({
            data: {
              userId,
              milestoneId: dbMilestone.id,
              unlockedAt: completedAt,
            },
          });
          if (m.rewardCredits > 0) {
            await tx.economyTransaction.create({
              data: {
                userId,
                type: "MILESTONE_REWARD",
                amount: m.rewardCredits,
                description: `Milestone Unlocked: ${m.name}`,
              },
            });
          }
        }

        // Comeback challenge persistence
        if (comebackChallengeToUpsert) {
          await tx.comebackChallenge.upsert({
            where: { id: comebackChallengeToUpsert.id },
            update: {
              missionsCompleted: comebackChallengeToUpsert.missionsCompleted,
              completed: comebackChallengeToUpsert.completed,
              rewardClaimed: comebackChallengeToUpsert.rewardClaimed,
              updatedAt: completedAt,
            },
            create: {
              id: comebackChallengeToUpsert.id,
              userId,
              startedAt: comebackChallengeToUpsert.startedAt,
              expiresAt: comebackChallengeToUpsert.expiresAt,
              missionsRequired: comebackChallengeToUpsert.missionsRequired,
              missionsCompleted: comebackChallengeToUpsert.missionsCompleted,
              completed: comebackChallengeToUpsert.completed,
              rewardClaimed: comebackChallengeToUpsert.rewardClaimed,
            },
          });
          if (comebackRewardClaimedNow) {
            await tx.economyTransaction.create({
              data: {
                userId,
                type: "COMEBACK_REWARD",
                amount: COMEBACK_CONFIG.rewardCredits,
                description: "Comeback Protocol Completed: Signal Restored",
              },
            });
          }
        }

        // World Event persistence
        if (userEventToUpdate) {
          await tx.userWorldEvent.update({
            where: { id: userEventToUpdate.id },
            data: {
              progress: userEventToUpdate.progress,
              completed: userEventToUpdate.completed,
              status: userEventToUpdate.status,
              rewardClaimed: userEventToUpdate.rewardClaimed,
              completedAt: userEventToUpdate.completedAt,
              updatedAt: completedAt,
            },
          });

          if (eventResult?.newlyCompleted && eventBonusCredits > 0) {
            await tx.economyTransaction.create({
              data: {
                userId,
                type: "MISSION_REWARD",
                amount: eventBonusCredits,
                description: `Anomaly Contained: ${eventResult.title}`,
              },
            });
          }

          if (eventLoreToUnlock) {
            await tx.userLoreUnlock.upsert({
              where: {
                userId_loreKey: {
                  userId,
                  loreKey: eventLoreToUnlock.loreKey,
                },
              },
              update: {},
              create: {
                userId,
                loreKey: eventLoreToUnlock.loreKey,
                title: eventLoreToUnlock.title,
                content: eventLoreToUnlock.content,
                source: eventLoreToUnlock.source,
                unlockedAt: completedAt,
              },
            });
          }
        }

        return {
          updatedChar: updatedChar as unknown as DbCharacter,
          updatedMsn,
          completion: completion as unknown as DbMissionCompletion,
          updatedWp: updatedWp as unknown as DbWorldProgress,
          updatedBoss: updatedBoss as unknown as DbBossProgress,
        };
      });
    });

    if (pgResult) {
      return {
        success: true,
        mission: {
          ...pgResult.updatedMsn,
          lastCompletedAt: completedAt,
          isCompletedToday: true,
        },
        rewards,
        character: pgResult.updatedChar,
        levelUp: {
          occurred: levelUp.levelUp,
          previousLevel: levelUp.previousLevel,
          newLevel: levelUp.newLevel,
          levelsGained: levelUp.levelsGained,
        },
        world: {
          corruptionBefore,
          corruptionAfter,
          corruptionReduced: corruptionBefore - corruptionAfter,
          integrityPercent: clampRestoration(100 - corruptionAfter),
        },
        boss: {
          key: activeBoss.bossKey,
          name: bossDef.name,
          title: bossDef.title,
          damageDealt: damageCalc.damageDealt,
          hpBefore: damageCalc.hpBefore,
          hpAfter: damageCalc.hpAfter,
          maxHp: activeBoss.maxHp,
          isDefeated: isBossDefeatedNow || activeBoss.isDefeated,
          defeatedAt,
          nextBossKey,
          nextBossName,
        },
        area: {
          areaKey: targetAreaKey,
          name: targetAreaDef.name,
          restorationGained: restorationGain,
          restorationPercent: newRestoration,
          isRestored,
          isUnlocked: true,
          newlyUnlockedAreas,
        },
        streak: {
          currentStreak: streakCalc.currentStreak,
          longestStreak: streakCalc.longestStreak,
          totalActiveDays: streakCalc.totalActiveDays,
          streakAdvanced: streakCalc.streakAdvanced,
          streakBroken: streakCalc.streakBroken,
          isFirstDay: streakCalc.isFirstDay,
          todayActive: true,
        },
        milestonesUnlocked: newlyUnlockedMilestones,
        comeback: comebackStatus,
        survivalSecuredToday: true,
        verification: {
          type: vType,
          signalIntegrity: calculateSignalIntegrity(vType),
          status:
            vType === "EVIDENCE"
              ? "EVIDENCE RECEIVED"
              : vType === "FOCUS_SESSION"
              ? "SESSION VERIFIED"
              : "SELF CONFIRMED",
        },
        event: eventResult,
      };
    }

    // Local Fallback Atomic Store Commit
    const store = getLocalStore();
    const localCharIdx = store.characters.findIndex((c) => c.userId === userId);
    const localMsnIdx = store.missions.findIndex(
      (m) => m.id === missionId && m.userId === userId
    );
    const localWpIdx = store.worldProgress.findIndex((w) => w.userId === userId);
    const localBossIdx = store.bossProgress.findIndex(
      (b) => b.userId === userId && b.bossKey === activeBoss.bossKey
    );

    if (localCharIdx === -1 || localMsnIdx === -1) {
      return {
        success: false,
        error: "Failed to resolve survivor progression state.",
        statusCode: 500,
      };
    }

    const completionRecord: DbMissionCompletion = {
      id: generateId("cmp"),
      missionId: mission.id,
      userId,
      xpEarned: rewards.xp,
      creditsEarned: rewards.credits,
      completedAt,
    };

    const economyRecord: DbEconomyTransaction = {
      id: generateId("etx"),
      userId,
      type: "MISSION_REWARD",
      amount: rewards.credits,
      itemId: null,
      description: `Reward for clearing mission: ${mission.title}`,
      createdAt: completedAt,
    };

    const updatedChar: DbCharacter = {
      ...store.characters[localCharIdx],
      ...updatedStats,
      updatedAt: new Date(),
    };

    const updatedMission: DbMission = {
      ...store.missions[localMsnIdx],
      lastCompletedAt: completedAt,
      isCompletedToday: true,
      updatedAt: new Date(),
    };

    if (mission.frequency === "ONCE") {
      updatedMission.status = "COMPLETED";
      updatedMission.isActive = false;
    }

    if (localWpIdx >= 0) {
      store.worldProgress[localWpIdx].corruption = corruptionAfter;
      store.worldProgress[localWpIdx].updatedAt = new Date();
    }

    if (localBossIdx >= 0) {
      store.bossProgress[localBossIdx].currentHp = damageCalc.hpAfter;
      store.bossProgress[localBossIdx].isDefeated =
        store.bossProgress[localBossIdx].isDefeated || isBossDefeatedNow;
      store.bossProgress[localBossIdx].defeatedAt = defeatedAt;
      store.bossProgress[localBossIdx].updatedAt = new Date();
    }

    for (const ua of updatedAreasMap) {
      const idx = store.worldAreaProgress.findIndex(
        (a) => a.userId === userId && a.areaKey === ua.areaKey
      );
      if (idx >= 0) {
        store.worldAreaProgress[idx].isUnlocked = ua.isUnlocked;
        store.worldAreaProgress[idx].restorationPercent = ua.restorationPercent;
        store.worldAreaProgress[idx].updatedAt = new Date();
      }
    }

    // Local Streak update
    const streakIdx = store.userStreaks.findIndex((s) => s.userId === userId);
    const updatedStreakRecord: DbUserStreak = {
      id: streakIdx >= 0 ? store.userStreaks[streakIdx].id : generateId("str"),
      userId,
      currentStreak: streakCalc.currentStreak,
      longestStreak: streakCalc.longestStreak,
      totalActiveDays: streakCalc.totalActiveDays,
      lastActiveDate: completedAt,
      createdAt: streakIdx >= 0 ? store.userStreaks[streakIdx].createdAt : completedAt,
      updatedAt: completedAt,
    };
    if (streakIdx >= 0) {
      store.userStreaks[streakIdx] = updatedStreakRecord;
    } else {
      store.userStreaks.push(updatedStreakRecord);
    }

    // Local DailyActivity update
    const activityIdx = store.dailyActivities.findIndex(
      (da) => da.userId === userId && da.date === todayStr
    );
    if (activityIdx >= 0) {
      store.dailyActivities[activityIdx].missionsCompleted += 1;
      store.dailyActivities[activityIdx].xpEarned += rewards.xp;
      store.dailyActivities[activityIdx].creditsEarned += rewards.credits;
    } else {
      store.dailyActivities.push({
        id: generateId("act"),
        userId,
        date: todayStr,
        missionsCompleted: 1,
        xpEarned: rewards.xp,
        creditsEarned: rewards.credits,
        createdAt: completedAt,
      });
    }

    // Local Milestones unlocking & transactions
    for (const m of newlyUnlockedMilestones) {
      const milestoneDef = store.milestones.find((ml) => ml.key === m.key);
      const milestoneId = milestoneDef ? milestoneDef.id : `mls_${m.key.toLowerCase()}`;

      store.userMilestones.push({
        id: generateId("uml"),
        userId,
        milestoneId,
        unlockedAt: completedAt,
      });

      if (m.rewardCredits > 0) {
        store.economyTransactions.push({
          id: generateId("etx"),
          userId,
          type: "MILESTONE_REWARD",
          amount: m.rewardCredits,
          itemId: null,
          description: `Milestone Unlocked: ${m.name}`,
          createdAt: completedAt,
        });
      }
    }

    // Local Comeback Challenge update & transactions
    if (comebackChallengeToUpsert) {
      const cIdx = store.comebackChallenges.findIndex(
        (c) => c.id === comebackChallengeToUpsert!.id
      );
      if (cIdx >= 0) {
        store.comebackChallenges[cIdx] = comebackChallengeToUpsert;
      } else {
        store.comebackChallenges.push(comebackChallengeToUpsert);
      }

      if (comebackRewardClaimedNow) {
        store.economyTransactions.push({
          id: generateId("etx"),
          userId,
          type: "COMEBACK_REWARD",
          amount: COMEBACK_CONFIG.rewardCredits,
          itemId: null,
          description: "Comeback Protocol Completed: Signal Restored",
          createdAt: completedAt,
        });
      }
    }

    // Local World Event update & transactions
    if (userEventToUpdate) {
      const uweIdx = store.userWorldEvents.findIndex((u) => u.id === userEventToUpdate!.id);
      if (uweIdx >= 0) {
        store.userWorldEvents[uweIdx] = {
          ...store.userWorldEvents[uweIdx],
          progress: userEventToUpdate.progress,
          completed: userEventToUpdate.completed,
          status: userEventToUpdate.status,
          rewardClaimed: userEventToUpdate.rewardClaimed,
          completedAt: userEventToUpdate.completedAt,
          updatedAt: completedAt,
        };
      }

      if (eventResult?.newlyCompleted && eventBonusCredits > 0) {
        store.economyTransactions.push({
          id: generateId("etx"),
          userId,
          type: "MISSION_REWARD",
          amount: eventBonusCredits,
          itemId: null,
          description: `Anomaly Contained: ${eventResult.title}`,
          createdAt: completedAt,
        });
      }

      if (eventLoreToUnlock) {
        const existingIdx = store.userLoreUnlocks.findIndex(
          (l) => l.userId === userId && l.loreKey === eventLoreToUnlock!.loreKey
        );
        if (existingIdx === -1) {
          store.userLoreUnlocks.push(eventLoreToUnlock);
        }
      }
    }

    store.missionCompletions.push(completionRecord);
    store.economyTransactions.push(economyRecord);
    store.characters[localCharIdx] = updatedChar;
    store.missions[localMsnIdx] = updatedMission;
    saveLocalStore(store);

    return {
      success: true,
      mission: updatedMission,
      rewards,
      character: updatedChar,
      levelUp: {
        occurred: levelUp.levelUp,
        previousLevel: levelUp.previousLevel,
        newLevel: levelUp.newLevel,
        levelsGained: levelUp.levelsGained,
      },
      world: {
        corruptionBefore,
        corruptionAfter,
        corruptionReduced: corruptionBefore - corruptionAfter,
        integrityPercent: clampRestoration(100 - corruptionAfter),
      },
      boss: {
        key: activeBoss.bossKey,
        name: bossDef.name,
        title: bossDef.title,
        damageDealt: damageCalc.damageDealt,
        hpBefore: damageCalc.hpBefore,
        hpAfter: damageCalc.hpAfter,
        maxHp: activeBoss.maxHp,
        isDefeated: isBossDefeatedNow || activeBoss.isDefeated,
        defeatedAt,
        nextBossKey,
        nextBossName,
      },
      area: {
        areaKey: targetAreaKey,
        name: targetAreaDef.name,
        restorationGained: restorationGain,
        restorationPercent: newRestoration,
        isRestored,
        isUnlocked: true,
        newlyUnlockedAreas,
      },
      streak: {
        currentStreak: streakCalc.currentStreak,
        longestStreak: streakCalc.longestStreak,
        totalActiveDays: streakCalc.totalActiveDays,
        streakAdvanced: streakCalc.streakAdvanced,
        streakBroken: streakCalc.streakBroken,
        isFirstDay: streakCalc.isFirstDay,
        todayActive: true,
      },
      milestonesUnlocked: newlyUnlockedMilestones,
      comeback: comebackStatus,
      survivalSecuredToday: true,
      verification: {
        type: vType,
        signalIntegrity: calculateSignalIntegrity(vType),
        status:
          vType === "EVIDENCE"
            ? "EVIDENCE RECEIVED"
            : vType === "FOCUS_SESSION"
            ? "SESSION VERIFIED"
            : "SELF CONFIRMED",
      },
      event: eventResult,
    };
  },

  // ==========================================
  // PHASE 9: SIGNAL INTEGRITY & TASK VALIDATION
  // ==========================================

  /**
   * Create a server-authoritative Focus Session
   */
  async createFocusSession(data: {
    userId: string;
    missionId: string;
    requiredDurationSeconds?: number;
  }): Promise<DbFocusSession> {
    const mission = await this.findMissionById(data.missionId, data.userId);
    const authoritativeDuration = (mission?.focusDurationMinutes || 25) * 60;
    const now = new Date();
    const pgSession = await executePrisma(() =>
      prisma.focusSession.create({
        data: {
          userId: data.userId,
          missionId: data.missionId,
          startedAt: now,
          lastHeartbeatAt: now,
          requiredDurationSeconds: authoritativeDuration,
          accumulatedActiveSeconds: 0,
          idleSeconds: 0,
          status: "ACTIVE",
        },
      })
    );
    if (pgSession) return pgSession as unknown as DbFocusSession;

    const store = getLocalStore();
    const newSession: DbFocusSession = {
      id: generateId("fcs"),
      userId: data.userId,
      missionId: data.missionId,
      startedAt: now,
      lastHeartbeatAt: now,
      requiredDurationSeconds: authoritativeDuration,
      accumulatedActiveSeconds: 0,
      idleSeconds: 0,
      status: "ACTIVE",
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.focusSessions.push(newSession);
    saveLocalStore(store);
    return newSession;
  },

  /**
   * Find active Focus Session for user, optionally filtered by mission
   * Automatically handles expiration if session has gone silent
   */
  async findActiveFocusSession(userId: string, missionId?: string): Promise<DbFocusSession | null> {
    const pgSession = await executePrisma(async () => {
      const where: any = { userId, status: "ACTIVE" };
      if (missionId) where.missionId = missionId;
      const session = await prisma.focusSession.findFirst({
        where,
        orderBy: { createdAt: "desc" },
      });
      if (!session) return null;

      // Auto-expire stale session if silence exceeds timeout
      const silentSeconds = Math.floor((Date.now() - new Date(session.lastHeartbeatAt).getTime()) / 1000);
      if (silentSeconds > FOCUS_CONSTANTS.SESSION_EXPIRATION_TIMEOUT_SECONDS) {
        await prisma.focusSession.update({
          where: { id: session.id },
          data: { status: "EXPIRED" },
        });
        return null;
      }
      return session;
    });
    if (pgSession !== null) return pgSession as unknown as DbFocusSession;

    const store = getLocalStore();
    const sessionIdx = store.focusSessions.findIndex(
      (fs) => fs.userId === userId && fs.status === "ACTIVE" && (!missionId || fs.missionId === missionId)
    );
    if (sessionIdx === -1) return null;

    const session = store.focusSessions[sessionIdx];
    const silentSeconds = Math.floor((Date.now() - session.lastHeartbeatAt.getTime()) / 1000);
    if (silentSeconds > FOCUS_CONSTANTS.SESSION_EXPIRATION_TIMEOUT_SECONDS) {
      session.status = "EXPIRED";
      session.updatedAt = new Date();
      saveLocalStore(store);
      return null;
    }
    return session;
  },

  /**
   * Find Focus Session by ID with user isolation
   */
  async findFocusSessionById(id: string, userId: string): Promise<DbFocusSession | null> {
    const pgSession = await executePrisma(() =>
      prisma.focusSession.findFirst({
        where: { id, userId },
      })
    );
    if (pgSession) return pgSession as unknown as DbFocusSession;

    const store = getLocalStore();
    return store.focusSessions.find((fs) => fs.id === id && fs.userId === userId) || null;
  },

  /**
   * Record periodic heartbeat with server-calculated elapsed active/idle time
   */
  async recordFocusHeartbeat(
    id: string,
    userId: string,
    clientReportedState: "ACTIVE" | "IDLE" = "ACTIVE"
  ): Promise<{
    success: boolean;
    session?: DbFocusSession;
    error?: string;
    signalIntegrity?: number;
  }> {
    const session = await this.findFocusSessionById(id, userId);
    if (!session) {
      return { success: false, error: "Focus session anomaly: Session not found." };
    }
    if (session.status !== "ACTIVE") {
      return {
        success: false,
        error: `Session is not active (current status: ${session.status}).`,
        session,
      };
    }

    const now = new Date();
    const evalResult = evaluateHeartbeat({
      lastHeartbeatAt: session.lastHeartbeatAt,
      now,
      clientReportedState,
      currentActiveSeconds: session.accumulatedActiveSeconds,
      currentIdleSeconds: session.idleSeconds,
      requiredDurationSeconds: session.requiredDurationSeconds,
      sessionStatus: session.status,
    });

    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: {
          lastHeartbeatAt: now,
          accumulatedActiveSeconds: evalResult.newActiveSeconds,
          idleSeconds: evalResult.newIdleSeconds,
          status: evalResult.status,
        },
      })
    );

    if (pgUpdated) {
      return {
        success: true,
        session: pgUpdated as unknown as DbFocusSession,
        signalIntegrity: evalResult.signalIntegrity,
      };
    }

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      store.focusSessions[idx] = {
        ...store.focusSessions[idx],
        lastHeartbeatAt: now,
        accumulatedActiveSeconds: evalResult.newActiveSeconds,
        idleSeconds: evalResult.newIdleSeconds,
        status: evalResult.status,
        updatedAt: now,
      };
      saveLocalStore(store);
      return {
        success: true,
        session: store.focusSessions[idx],
        signalIntegrity: evalResult.signalIntegrity,
      };
    }
    return { success: false, error: "Unable to update session telemetry." };
  },

  /**
   * Pause an active focus session
   */
  async pauseFocusSession(id: string, userId: string): Promise<DbFocusSession | null> {
    const session = await this.findFocusSessionById(id, userId);
    if (!session || session.status !== "ACTIVE") return null;

    const now = new Date();
    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: { status: "PAUSED" },
      })
    );
    if (pgUpdated) return pgUpdated as unknown as DbFocusSession;

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      store.focusSessions[idx].status = "PAUSED";
      store.focusSessions[idx].updatedAt = now;
      saveLocalStore(store);
      return store.focusSessions[idx];
    }
    return null;
  },

  /**
   * Resume a paused focus session
   */
  async resumeFocusSession(id: string, userId: string): Promise<DbFocusSession | null> {
    const session = await this.findFocusSessionById(id, userId);
    if (!session || session.status !== "PAUSED") return null;

    const now = new Date();
    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: { status: "ACTIVE", lastHeartbeatAt: now },
      })
    );
    if (pgUpdated) return pgUpdated as unknown as DbFocusSession;

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      store.focusSessions[idx].status = "ACTIVE";
      store.focusSessions[idx].lastHeartbeatAt = now;
      store.focusSessions[idx].updatedAt = now;
      saveLocalStore(store);
      return store.focusSessions[idx];
    }
    return null;
  },

  /**
   * Cancel/Abort a focus session
   */
  async cancelFocusSession(id: string, userId: string): Promise<DbFocusSession | null> {
    const session = await this.findFocusSessionById(id, userId);
    if (!session || session.status === "COMPLETED") return null;

    const now = new Date();
    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
    );
    if (pgUpdated) return pgUpdated as unknown as DbFocusSession;

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      store.focusSessions[idx].status = "CANCELLED";
      store.focusSessions[idx].updatedAt = now;
      saveLocalStore(store);
      return store.focusSessions[idx];
    }
    return null;
  },

  /**
   * Authoritatively finish and validate a focus session
   */
  async finishFocusSession(
    id: string,
    userId: string
  ): Promise<{
    success: boolean;
    session?: DbFocusSession;
    error?: string;
    signalIntegrity?: number;
  }> {
    const session = await this.findFocusSessionById(id, userId);
    if (!session) {
      return { success: false, error: "Focus session not found." };
    }
    if (session.status === "COMPLETED") {
      const integrity = calculateSignalIntegrity(
        "FOCUS_SESSION",
        session.accumulatedActiveSeconds,
        session.idleSeconds
      );
      return { success: true, session, signalIntegrity: integrity };
    }

    const check = validateSessionCompletion(
      session.accumulatedActiveSeconds,
      session.requiredDurationSeconds,
      session.status
    );
    if (!check.eligible) {
      return {
        success: false,
        error: check.reason || "Required focus duration not reached.",
        session,
      };
    }

    const now = new Date();
    const signalIntegrity = calculateSignalIntegrity(
      "FOCUS_SESSION",
      session.accumulatedActiveSeconds,
      session.idleSeconds
    );

    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      })
    );
    if (pgUpdated) {
      return {
        success: true,
        session: pgUpdated as unknown as DbFocusSession,
        signalIntegrity,
      };
    }

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      store.focusSessions[idx].status = "COMPLETED";
      store.focusSessions[idx].completedAt = now;
      store.focusSessions[idx].updatedAt = now;
      saveLocalStore(store);
      return {
        success: true,
        session: store.focusSessions[idx],
        signalIntegrity,
      };
    }
    return { success: false, error: "Failed to persist session completion." };
  },

  /**
   * Check if a completed FocusSession exists for mission
   */
  async findCompletedFocusSession(userId: string, missionId: string): Promise<DbFocusSession | null> {
    const pgSession = await executePrisma(() =>
      prisma.focusSession.findFirst({
        where: { userId, missionId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      })
    );
    if (pgSession) return pgSession as unknown as DbFocusSession;

    const store = getLocalStore();
    return (
      store.focusSessions
        .filter((fs) => fs.userId === userId && fs.missionId === missionId && fs.status === "COMPLETED")
        .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0] || null
    );
  },

  /**
   * Create mission evidence (photo or observation note)
   */
  async createMissionEvidence(data: {
    userId: string;
    missionId: string;
    type: EvidenceType;
    fileUrl?: string | null;
    description?: string | null;
  }): Promise<DbMissionEvidence> {
    const now = new Date();
    const pgEvidence = await executePrisma(() =>
      prisma.missionEvidence.create({
        data: {
          userId: data.userId,
          missionId: data.missionId,
          type: data.type,
          fileUrl: data.fileUrl || null,
          description: data.description || null,
          createdAt: now,
        },
      })
    );
    if (pgEvidence) return pgEvidence as unknown as DbMissionEvidence;

    const store = getLocalStore();
    const newEvidence: DbMissionEvidence = {
      id: generateId("mve"),
      userId: data.userId,
      missionId: data.missionId,
      type: data.type,
      fileUrl: data.fileUrl || null,
      description: data.description || null,
      createdAt: now,
    };
    store.missionEvidences.push(newEvidence);
    saveLocalStore(store);
    return newEvidence;
  },

  /**
   * Find evidence submitted for mission by user
   */
  async findMissionEvidence(userId: string, missionId: string): Promise<DbMissionEvidence[]> {
    const pgEvidences = await executePrisma(() =>
      prisma.missionEvidence.findMany({
        where: { userId, missionId },
        orderBy: { createdAt: "desc" },
      })
    );
    if (pgEvidences) return pgEvidences as unknown as DbMissionEvidence[];

    const store = getLocalStore();
    return store.missionEvidences
      .filter((me) => me.userId === userId && me.missionId === missionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Fast-forward / simulate focus session telemetry for testing purposes
   */
  async simulateFocusSessionProgressForTesting(
    id: string,
    userId: string,
    data: { accumulatedActiveSeconds?: number; idleSeconds?: number; lastHeartbeatAt?: Date }
  ): Promise<DbFocusSession | null> {
    const pgUpdated = await executePrisma(() =>
      prisma.focusSession.update({
        where: { id },
        data: {
          ...(data.accumulatedActiveSeconds !== undefined
            ? { accumulatedActiveSeconds: data.accumulatedActiveSeconds }
            : {}),
          ...(data.idleSeconds !== undefined ? { idleSeconds: data.idleSeconds } : {}),
          ...(data.lastHeartbeatAt !== undefined ? { lastHeartbeatAt: data.lastHeartbeatAt } : {}),
        },
      })
    );
    if (pgUpdated) return pgUpdated as unknown as DbFocusSession;

    const store = getLocalStore();
    const idx = store.focusSessions.findIndex((fs) => fs.id === id && fs.userId === userId);
    if (idx !== -1) {
      if (data.accumulatedActiveSeconds !== undefined) {
        store.focusSessions[idx].accumulatedActiveSeconds = data.accumulatedActiveSeconds;
      }
      if (data.idleSeconds !== undefined) {
        store.focusSessions[idx].idleSeconds = data.idleSeconds;
      }
      if (data.lastHeartbeatAt !== undefined) {
        store.focusSessions[idx].lastHeartbeatAt = data.lastHeartbeatAt;
      }
      store.focusSessions[idx].updatedAt = new Date();
      saveLocalStore(store);
      return store.focusSessions[idx];
    }
    return null;
  },
};

