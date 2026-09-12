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

// Fallback file persistence path for zero-dependency local development/testing
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "survivors.json");

interface LocalDataStore {
  users: DbUser[];
  characters: DbCharacter[];
}

function getLocalStore(): LocalDataStore {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      const initial: LocalDataStore = { users: [], characters: [] };
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
    return parsed;
  } catch (err) {
    console.error("[DB Fallback Store Error]:", err);
    return { users: [], characters: [] };
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
    try {
      // Attempt PostgreSQL Prisma query
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { character: true },
      });
      if (user) return user as unknown as DbUser;
    } catch (prismaErr) {
      // If Postgres is not reachable, seamlessly fallback to local store
      // console.warn("[DB] PostgreSQL unavailable, querying local store");
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
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { character: true },
      });
      if (user) return user as unknown as DbUser;
    } catch (prismaErr) {
      // Fallback
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
    try {
      const char = await prisma.character.findUnique({
        where: { userId },
      });
      if (char) return char as unknown as DbCharacter;
    } catch (prismaErr) {
      // Fallback
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
};
