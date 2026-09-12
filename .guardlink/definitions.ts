// GuardLink Security Model Definitions
// Comprehensive threat modeling for The Other Side (Phase 9: Signal Integrity)

/**
 * @asset client (#client) -- "Survivor frontend client and browser environment"
 * @asset server (#server) -- "Server-authoritative Next.js runtime environment"
 * @asset user_session (#user-session) -- "Authenticated survivor session token stored in HTTP-only SameSite cookie"
 * @asset mission_data (#mission-data) -- "Survivor mission records and real-world task metadata"
 * @asset character_data (#character-data) -- "Survivor character stats and attribute levels"
 * @asset streak_data (#streak-data) -- "Authoritative player streak counters and daily activity records"
 * @asset milestone_data (#milestone-data) -- "Player milestone progress, achievements, and unlock logs"
 * @asset comeback_challenge (#comeback-challenge) -- "Active comeback recovery challenges and countdown timers"
 * @asset world_event_data (#world-event-data) -- "Authoritative active world anomalies, progress, and countdown timers"
 * @asset lore_archive (#lore-archive) -- "Recovered logs and fragments of the Other Side"
 * @asset evidence_data (#evidence-data) -- "User-submitted verification evidence (photos, notes) for missions"
 * @asset focus_session_data (#focus-session-data) -- "Active and historical focus session telemetry, timers, and state"
 *
 * @threat Unauthorized Access (#unauthorized-access) [high] -- "An unauthenticated user attempts to access or mutate missions"
 * @threat Insecure Direct Object Reference (#idor) [high] -- "Insecure Direct Object Reference: User A attempts to view, edit, or abandon User B's missions"
 * @threat Input Validation Failure (#input-validation-failure) [medium] -- "Malicious, oversized, or malformed data injection in mission payload"
 * @threat Data Tampering (#data-tampering) [high] -- "Unauthorized modification of mission attributes or status"
 * @threat Streak Tampering (#streak-tampering) [medium] -- "Malicious manipulation of streak counts or completion timestamps"
 * @threat Duplicate Reward Exploit (#duplicate-reward-exploit) [high] -- "Replaying completion or milestone unlock to farm credits/XP"
 * @threat Comeback Spoofing (#comeback-spoofing) [medium] -- "Direct modification of comeback challenge progress or completion status"
 * @threat Event Tampering (#event-tampering) [high] -- "Direct unauthorized manipulation of event progress, status, or timer"
 * @threat Event Replay Exploit (#event-replay-exploit) [high] -- "Replaying mission or event payload to duplicate event completion rewards"
 * @threat Lore Tampering (#lore-tampering) [medium] -- "Spoofing lore unlock requests without meeting event requirements"
 * @threat Evidence Tampering (#evidence-tampering) [high] -- "Unauthorized upload, spoofing, or cross-tenant access of mission evidence"
 * @threat Focus Spoofing (#focus-spoofing) [high] -- "Client manipulation of focus duration, elapsed active seconds, or completion status"
 * @threat Heartbeat Replay (#heartbeat-replay) [high] -- "Replaying heartbeats or forged timestamps to artificially advance focus sessions"
 *
 * @control Session Authentication (#session-auth) -- "Server-side cryptographic JWT verification via jose and HTTP-only cookies"
 * @control User Scoping (#user-scoping) -- "Strict database-level user isolation ensuring mission queries enforce mission.userId === session.userId"
 * @control Input Validation (#input-validation) -- "Rigorous client and server-side schema validation for mission fields"
 * @control Prepared Queries (#prepared-queries) -- "Parameterized Prisma queries and sanitized local fallback operations"
 * @control Server Authoritative Time (#server-authoritative-time) -- "Server-side logical date calculation utilizing UTC timestamps and validated timezone"
 * @control Atomic Streak Transaction (#atomic-streak-transaction) -- "Atomic Prisma and fallback transaction ensuring streak, activity, milestone, and comeback state are mutated synchronously"
 * @control Authoritative Event Engine (#authoritative-event-engine) -- "Server-only event generation, eligibility evaluation, and expiration checks"
 * @control Atomic Event Transaction (#atomic-event-transaction) -- "Atomic mission transaction mutating mission, character, event progress, rewards, and lore in a single boundary"
 * @control Server Timed Heartbeat (#server-timed-heartbeat) -- "Authoritative timestamp delta calculation on the server with clamp & idle detection"
 * @control Evidence Ownership Guard (#evidence-ownership-guard) -- "Strict user-scoped validation and MIME/magic-bytes inspection of uploaded evidence"
 * @control Verification Bypass Blocker (#verification-bypass-blocker) -- "Server-side gating requiring completed focus session or evidence before mission completion"
 */

export const GuardLinkDefinitions = {
  version: "1.4.0",
  phase: "Phase 9 — Signal Integrity: Real-World Task Validation & Anti-Cheat System",
};
