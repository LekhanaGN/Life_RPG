// THE OTHER SIDE - Database & Persistence Layer
// Prisma + PostgreSQL data engine with resilient local persistence fallback.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Global Prisma instance to avoid multiple connections in Next.js hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
export type MissionStatus = "ACTIVE" | "ARCHIVED";

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
}

// Fallback file persistence path for zero-dependency local development/testing
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "survivors.json");

interface LocalDataStore {
  users: DbUser[];
  characters: DbCharacter[];
  missions: DbMission[];
}

function getLocalStore(): LocalDataStore {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      const initial: LocalDataStore = { users: [], characters: [], missions: [] };
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    // Parse ISO date strings to Date objects
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
    return parsed;
  } catch (err) {
    console.error("[DB Fallback Store Error]:", err);
    return { users: [], characters: [], missions: [] };
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
    if (process.env.DATABASE_URL) {
      try {
        // Attempt PostgreSQL Prisma query
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { character: true },
        });
        if (user) return user as unknown as DbUser;
      } catch (prismaErr) {
        // Fallback
      }
    }

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
    if (process.env.DATABASE_URL) {
      try {
        const user = await prisma.user.findUnique({
          where: { id },
          include: { character: true },
        });
        if (user) return user as unknown as DbUser;
      } catch (prismaErr) {
        // Fallback
      }
    }

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

    if (process.env.DATABASE_URL) {
      try {
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: data.passwordHash,
            username: cleanUsername,
          },
        });
        return user as unknown as DbUser;
      } catch (prismaErr) {
        // Fallback
      }
    }

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
    if (process.env.DATABASE_URL) {
      try {
        const char = await prisma.character.findUnique({
          where: { userId },
        });
        if (char) return char as unknown as DbCharacter;
      } catch (prismaErr) {
        // Fallback
      }
    }

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

    if (process.env.DATABASE_URL) {
      try {
        const char = await prisma.character.create({
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
        });
        return char as unknown as DbCharacter;
      } catch (prismaErr) {
        // Fallback
      }
    }

    const store = getLocalStore();
    // Ensure no duplicate character for this user
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
   * @flows User -> db.findMissionsByUserId via SessionAuth -- "Retrieve survivor missions"
   * @mitigates db.findMissionsByUserId against #idor using #user-scoping -- "Enforces query strictly scoped to authenticated userId"
   * @handles #mission-data on db.findMissionsByUserId -- "Returns mission records belonging exclusively to user"
   */
  async findMissionsByUserId(
    userId: string,
    filters?: { category?: string; status?: string }
  ): Promise<DbMission[]> {
    if (process.env.DATABASE_URL) {
      try {
        const where: any = { userId };
        if (filters?.category && filters.category !== "ALL") {
          where.category = filters.category;
        }
        if (filters?.status && filters.status !== "ALL") {
          where.status = filters.status;
        }
        const missions = await prisma.mission.findMany({
          where,
          orderBy: [{ createdAt: "desc" }],
        });
        if (missions && missions.length >= 0) {
          return missions as unknown as DbMission[];
        }
      } catch (prismaErr) {
        // Fallback to local store
      }
    }

    const store = getLocalStore();
    let missions = store.missions.filter((m) => m.userId === userId);

    if (filters?.category && filters.category !== "ALL") {
      missions = missions.filter((m) => m.category === filters.category);
    }
    if (filters?.status && filters.status !== "ALL") {
      missions = missions.filter((m) => m.status === filters.status);
    }

    // Default sorting: active first, then due date, then newest
    return missions.sort((a, b) => {
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
   * @flows User -> db.findMissionById via SessionAuth -- "Retrieve single mission record"
   * @mitigates db.findMissionById against #idor using #user-scoping -- "Scoped lookup by id AND userId"
   * @handles #mission-data on db.findMissionById -- "Access control verified against requester ID"
   */
  async findMissionById(id: string, userId: string): Promise<DbMission | null> {
    if (process.env.DATABASE_URL) {
      try {
        const mission = await prisma.mission.findFirst({
          where: { id, userId },
        });
        if (mission) return mission as unknown as DbMission;
      } catch (prismaErr) {
        // Fallback
      }
    }

    const store = getLocalStore();
    const mission = store.missions.find((m) => m.id === id && m.userId === userId);
    return mission || null;
  },

  /**
   * @flows User -> db.createMission via SessionAuth -- "Survivor accepts new mission"
   * @mitigates db.createMission against #idor using #user-scoping -- "userId bound strictly from server-authenticated session"
   * @handles #mission-data on db.createMission -- "Stores new persistent mission with active status"
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

    if (process.env.DATABASE_URL) {
      try {
        const mission = await prisma.mission.create({
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
        });
        return mission as unknown as DbMission;
      } catch (prismaErr) {
        // Fallback
      }
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.missions.push(newMission);
    saveLocalStore(store);
    return newMission;
  },

  /**
   * @flows User -> db.updateMission via SessionAuth -- "Survivor edits mission parameters"
   * @mitigates db.updateMission against #idor using #user-scoping -- "Verifies user ownership before applying updates"
   * @handles #mission-data on db.updateMission -- "Updates mutable mission fields safely"
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
    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.mission.findFirst({
          where: { id, userId },
        });
        if (!existing) return null;

        const updated = await prisma.mission.update({
          where: { id },
          data: {
            ...data,
            isActive: data.status ? data.status === "ACTIVE" : data.isActive,
          },
        });
        return updated as unknown as DbMission;
      } catch (prismaErr) {
        // Fallback
      }
    }

    const store = getLocalStore();
    const missionIdx = store.missions.findIndex((m) => m.id === id && m.userId === userId);
    if (missionIdx === -1) return null;

    const current = store.missions[missionIdx];
    const updatedStatus = data.status || (data.isActive === false ? "ARCHIVED" : data.isActive === true ? "ACTIVE" : current.status);
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
   * @flows User -> db.deleteMission via SessionAuth -- "Survivor abandons a mission"
   * @mitigates db.deleteMission against #idor using #user-scoping -- "Ownership verified before deletion"
   * @handles #mission-data on db.deleteMission -- "Permanently purges mission from user's active matrix"
   */
  async deleteMission(id: string, userId: string): Promise<boolean> {
    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.mission.findFirst({
          where: { id, userId },
        });
        if (!existing) return false;

        await prisma.mission.delete({ where: { id } });
        return true;
      } catch (prismaErr) {
        // Fallback
      }
    }

    const store = getLocalStore();
    const initialLen = store.missions.length;
    store.missions = store.missions.filter((m) => !(m.id === id && m.userId === userId));
    if (store.missions.length < initialLen) {
      saveLocalStore(store);
      return true;
    }
    return false;
  },
};

