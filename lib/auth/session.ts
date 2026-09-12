// THE OTHER SIDE - Server-Side Session Manager
// Uses signed JWTs via `jose` stored in HTTP-only, SameSite=lax cookies.

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db, DbUser, DbCharacter } from "@/lib/db/client";

const COOKIE_NAME = "the_other_side_session";
const SESSION_EXPIRATION = "7d";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Encode secret key for jose
function getSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "the_other_side_temporal_rift_secret_key_dimension_2026_supernatural";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
}

/**
 * Creates and sets an HTTP-only secure session cookie for the authenticated user
 */
export async function createSession(userId: string): Promise<void> {
  const secretKey = getSecretKey();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Reads and verifies the server session from incoming request cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId === "string") {
      return { userId: payload.userId };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Destroys the session by clearing the session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export interface AuthenticatedData {
  user: DbUser;
  character: DbCharacter | null;
}

/**
 * Convenience helper to get the currently authenticated user and character from the session
 */
export async function getCurrentUser(): Promise<AuthenticatedData | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await db.findUserById(session.userId);
  if (!user) return null;

  return {
    user,
    character: user.character || null,
  };
}
