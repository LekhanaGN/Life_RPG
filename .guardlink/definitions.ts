// GuardLink Security Model Definitions
// Comprehensive threat modeling for The Other Side (Phase 3: Mission System)

/**
 * @asset #user-session -- "Authenticated survivor session token stored in HTTP-only SameSite cookie"
 * @asset #mission-data -- "Survivor mission records and real-world task metadata"
 * @asset #character-data -- "Survivor character stats and attribute levels"
 * @asset #streak-data -- "Authoritative player streak counters and daily activity records"
 * @asset #milestone-data -- "Player milestone progress, achievements, and unlock logs"
 * @asset #comeback-challenge -- "Active comeback recovery challenges and countdown timers"
 *
 * @threat #unauthorized-access -- "An unauthenticated user attempts to access or mutate missions"
 * @threat #idor -- "Insecure Direct Object Reference: User A attempts to view, edit, or abandon User B's missions"
 * @threat #input-validation-failure -- "Malicious, oversized, or malformed data injection in mission payload"
 * @threat #data-tampering -- "Unauthorized modification of mission attributes or status"
 * @threat #streak-tampering -- "Malicious manipulation of streak counts or completion timestamps"
 * @threat #duplicate-reward-exploit -- "Replaying completion or milestone unlock to farm credits/XP"
 * @threat #comeback-spoofing -- "Direct modification of comeback challenge progress or completion status"
 *
 * @control #session-auth -- "Server-side cryptographic JWT verification via jose and HTTP-only cookies"
 * @control #user-scoping -- "Strict database-level user isolation ensuring mission queries enforce mission.userId === session.userId"
 * @control #input-validation -- "Rigorous client and server-side schema validation for mission fields"
 * @control #prepared-queries -- "Parameterized Prisma queries and sanitized local fallback operations"
 * @control #server-authoritative-time -- "Server-side logical date calculation utilizing UTC timestamps and validated timezone"
 * @control #atomic-streak-transaction -- "Atomic Prisma and fallback transaction ensuring streak, activity, milestone, and comeback state are mutated synchronously"
 */

export const GuardLinkDefinitions = {
  version: "1.2.0",
  phase: "Phase 7 — Survival Protocol",
};
