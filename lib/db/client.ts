// THE OTHER SIDE - Database & Persistence Layer
// Prisma + PostgreSQL data engine with resilient local persistence fallback.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { processProgressionMath, validateMissionCompletionEligibility } from "@/lib/game/progression";

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
  createdAt: Date;
  updatedAt: Date;
  lastCompletedAt?: Date | null;
  isCompletedToday?: boolean;
}

export interface DbMissionCompletion {
  id: string;
  missionId: string;
  userId: string;
  completedAt: Date;
  xpEarned: number;
  creditsEarned: number;
}

// Fallback file persistence path for zero-dependency local development/testing
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "survivors.json");

interface LocalDataStore {
  users: DbUser[];
  characters: DbCharacter[];
  missions: DbMission[];
  missionCompletions: DbMissionCompletion[];
}

function getLocalStore(): LocalDataStore {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      const initial: LocalDataStore = {
        users: [],
        characters: [],
        missions: [],
        missionCompletions: [],
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
      createdAt: new Date(m.createdAt),
      updatedAt: new Date(m.updatedAt),
    }));
    parsed.missionCompletions = (parsed.missionCompletions || []).map((mc: any) => ({
      ...mc,
      completedAt: new Date(mc.completedAt),
    }));
    return parsed;
  } catch (err) {
    console.error("[DB Fallback Store Error]:", err);
    return { users: [], characters: [], missions: [], missionCompletions: [] };
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

function generateId(prefix = "c"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
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
  }): Promise<DbUser> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const cleanUsername = data.username.trim();

    const pgUser = await executePrisma(() =>
      prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          username: cleanUsername,
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
  }): Promise<DbMission> {
    const cleanTitle = data.title.trim();
    const cleanDescription = data.description ? data.description.trim() : null;

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
        },
      })
    );
    if (pgMission) return pgMission as unknown as DbMission;

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
    if (pgMission) return pgMission as unknown as DbMission;

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

  /**
   * ATOMIC TRANSACTION: Complete Mission & Award Progression
   * 1. Validates ownership & existence
   * 2. Checks duplicate completion rules
   * 3. Calculates authoritative rewards & level progression
   * 4. Creates historical MissionCompletion
   * 5. Updates Character stats & XP
   * 6. Updates Mission state
   */
  async completeMissionTransaction(
    userId: string,
    missionId: string
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
  }> {
    // 1. Fetch Mission & Character
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

    // 3. Process Authoritative Game Math
    const { rewards, updatedStats, levelUp } = processProgressionMath(character, mission);

    // 4. Atomic Execution
    const completedAt = new Date();

    const pgResult = await executePrisma(async () => {
      return prisma.$transaction(async (tx) => {
        const completion = await tx.missionCompletion.create({
          data: {
            missionId: mission.id,
            userId,
            xpEarned: rewards.xp,
            creditsEarned: rewards.credits,
            completedAt,
          },
        });

        const updatedChar = await tx.character.update({
          where: { userId },
          data: updatedStats,
        });

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

        return {
          updatedChar: updatedChar as unknown as DbCharacter,
          updatedMsn,
          completion: completion as unknown as DbMissionCompletion,
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
      };
    }

    // Local Fallback Transaction
    const store = getLocalStore();
    const localCharIdx = store.characters.findIndex((c) => c.userId === userId);
    const localMsnIdx = store.missions.findIndex(
      (m) => m.id === missionId && m.userId === userId
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

    const updatedChar: DbCharacter = {
      ...store.characters[localCharIdx],
      ...updatedStats,
      updatedAt: new Date(),
    };

    let updatedMission: DbMission = {
      ...store.missions[localMsnIdx],
      lastCompletedAt: completedAt,
      isCompletedToday: true,
      updatedAt: new Date(),
    };

    if (mission.frequency === "ONCE") {
      updatedMission.status = "COMPLETED";
      updatedMission.isActive = false;
    }

    // Commit all updates together atomically
    store.missionCompletions.push(completionRecord);
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
    };
  },
};
