"use server";

// THE OTHER SIDE - Server Actions for Authentication & Character Creation
// Secure server-side gatekeeping: all identity and progression values are server-owned.

import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { createSession, destroySession, getSession } from "@/lib/auth/session";
import { ARCHETYPES, isValidArchetype, ArchetypeId } from "@/lib/game/archetypes";

export interface ActionResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  redirectUrl?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_\- ]{2,30}$/;
const CHARACTER_NAME_REGEX = /^[a-zA-Z0-9_\- ]{2,24}$/;

/**
 * Server Action: Register a new Survivor account
 */
export async function signupAction(formData: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}): Promise<ActionResult> {
  try {
    const username = (formData.username || "").trim();
    const email = (formData.email || "").trim().toLowerCase();
    const password = formData.password || "";
    const confirmPassword = formData.confirmPassword || "";

    // 1. Validation
    if (!username) {
      return { success: false, error: "Survivor callsign / username is required." };
    }
    if (!USERNAME_REGEX.test(username)) {
      return {
        success: false,
        error: "Callsign must be 2 to 30 characters (letters, numbers, spaces, hyphens).",
      };
    }

    if (!email) {
      return { success: false, error: "Transmission frequency / email is required." };
    }
    if (!EMAIL_REGEX.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!password) {
      return { success: false, error: "Clearance passcode is required." };
    }
    if (password.length < 6) {
      return {
        success: false,
        error: "Passcode must be at least 6 characters long.",
      };
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Passcode confirmation does not match." };
    }

    // 2. Prevent duplicate email
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        error: "A survivor with this email transmission already exists.",
      };
    }

    // 3. Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create User
    const user = await db.createUser({
      email,
      passwordHash,
      username,
    });

    // 5. Establish secure server session
    await createSession(user.id);

    return {
      success: true,
      redirectUrl: "/onboarding",
    };
  } catch (error) {
    console.error("[Signup Action Error]:", error);
    return {
      success: false,
      error: "An unexpected dimensional anomaly occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Authenticate an existing Survivor
 */
export async function loginAction(formData: {
  email?: string;
  password?: string;
}): Promise<ActionResult> {
  try {
    const email = (formData.email || "").trim().toLowerCase();
    const password = formData.password || "";

    if (!email || !password) {
      return { success: false, error: "Email and clearance passcode are required." };
    }

    // 1. Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid transmission credentials." };
    }

    // 2. Verify password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid transmission credentials." };
    }

    // 3. Establish session
    await createSession(user.id);

    // 4. Determine destination based on character existence
    if (user.character) {
      return {
        success: true,
        redirectUrl: "/right-side",
      };
    } else {
      return {
        success: true,
        redirectUrl: "/onboarding",
      };
    }
  } catch (error) {
    console.error("[Login Action Error]:", error);
    return {
      success: false,
      error: "An unexpected dimensional anomaly occurred. Please try again.",
    };
  }
}

/**
 * Server Action: Log out the current Survivor and destroy session
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    await destroySession();
    return {
      success: true,
      redirectUrl: "/auth/login",
    };
  } catch (error) {
    console.error("[Logout Action Error]:", error);
    return {
      success: false,
      redirectUrl: "/auth/login",
    };
  }
}

/**
 * Server Action: Create Survivor Character
 * The client only sends name and archetype.
 * The server securely provides userId, level, xp, credits, and calculates stats.
 */
export async function createCharacterAction(formData: {
  name?: string;
  archetype?: string;
}): Promise<ActionResult> {
  try {
    // 1. Authenticate user from session
    const session = await getSession();
    if (!session?.userId) {
      return {
        success: false,
        error: "Session expired or unauthenticated. Please log in.",
        redirectUrl: "/auth/login",
      };
    }

    // 2. Check if user already has a character
    const existingChar = await db.findCharacterByUserId(session.userId);
    if (existingChar) {
      return {
        success: true,
        redirectUrl: "/right-side",
      };
    }

    // 3. Validate Inputs
    const name = (formData.name || "").trim();
    const archetypeRaw = (formData.archetype || "").trim().toUpperCase();

    if (!name) {
      return { success: false, error: "Survivor Name is required." };
    }
    if (!CHARACTER_NAME_REGEX.test(name)) {
      return {
        success: false,
        error: "Survivor Name must be 2 to 24 characters (letters, numbers, spaces).",
      };
    }

    if (!archetypeRaw || !isValidArchetype(archetypeRaw)) {
      return {
        success: false,
        error: "Please select a valid survivor archetype (Explorer, Scholar, Warrior, Strategist).",
      };
    }

    const archetypeId = archetypeRaw as ArchetypeId;
    const archetypeDef = ARCHETYPES[archetypeId];

    // 4. Server-owned starting attributes (cannot be forged by client)
    const character = await db.createCharacter({
      userId: session.userId,
      name,
      archetype: archetypeDef.name,
      mind: archetypeDef.attributes.mind,
      body: archetypeDef.attributes.body,
      focus: archetypeDef.attributes.focus,
      spirit: archetypeDef.attributes.spirit,
      connection: archetypeDef.attributes.connection,
    });

    return {
      success: true,
      data: character,
      redirectUrl: "/right-side",
    };
  } catch (error) {
    console.error("[Create Character Error]:", error);
    return {
      success: false,
      error: "Failed to initialize survivor matrix. Please try again.",
    };
  }
}
