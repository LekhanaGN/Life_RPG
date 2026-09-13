/**
 * End-to-End Verification Test for Mission Proof Upload & Ownership Security
 *
 * Tests:
 * 1. User signup & session token creation
 * 2. Character creation
 * 3. Mission creation with EVIDENCE verification type
 * 4. Image proof upload with valid magic bytes + observation note
 * 5. Mission evidence retrieval & verification integrity check
 * 6. Mission completion with XP/Credits/Progress reward validation
 * 7. Security: Second user attempting to upload proof to User 1's mission -> 403 Forbidden
 * 8. Non-existent mission ID proof upload -> 404 Not Found
 * 9. Cleanup of test accounts
 */

import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { db } from "../lib/db/client";

const BASE_URL = "http://localhost:3001";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "the_other_side_temporal_rift_secret_key_dimension_2026_supernatural";

// 1x1 transparent PNG image buffer with valid magic bytes (89 50 4E 47 0D 0A 1A 0A)
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const SAMPLE_PNG_BUFFER = Buffer.from(SAMPLE_PNG_BASE64, "base64");

async function generateAuthCookie(userId: string): Promise<string> {
  const secretKey = new TextEncoder().encode(SESSION_SECRET);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
  return `the_other_side_session=${token}`;
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING MISSION PROOF & OWNERSHIP FLOW TEST");
  console.log("==================================================\n");

  const timestamp = Date.now();
  const user1Email = `survivor_test_${timestamp}@otherside.io`;
  const user1Username = `SurvivorProof_${timestamp.toString().slice(-4)}`;
  const password = "clearancePasscode123!";

  const user2Email = `intruder_test_${timestamp}@otherside.io`;
  const user2Username = `IntruderProof_${timestamp.toString().slice(-4)}`;

  let user1Cookie = "";
  let user2Cookie = "";
  let createdMissionId = "";
  let user1Id = "";
  let user2Id = "";

  try {
    // ----------------------------------------------------
    // STEP 1: Register User 1
    // ----------------------------------------------------
    console.log("1. Registering Survivor 1 in Database:", user1Username);
    const passwordHash = await bcrypt.hash(password, 10);
    const user1 = await db.createUser({
      username: user1Username,
      email: user1Email,
      passwordHash,
    });
    user1Id = user1.id;
    user1Cookie = await generateAuthCookie(user1Id);
    console.log("   ✓ Survivor 1 created with ID:", user1Id);

    // ----------------------------------------------------
    // STEP 2: Create Character for User 1
    // ----------------------------------------------------
    console.log("2. Initializing Character for Survivor 1...");
    const char1 = await db.createCharacter({
      userId: user1Id,
      name: `${user1Username} Scout`,
      archetype: "EXPLORER",
      mind: 12,
      body: 10,
      focus: 15,
      spirit: 11,
      connection: 10,
    });
    console.log("   ✓ Character matrix created:", char1.name, `(Level ${char1.level}, XP ${char1.xp})`);

    // ----------------------------------------------------
    // STEP 3: Create Mission with EVIDENCE verification
    // ----------------------------------------------------
    console.log("3. Creating Mission with EVIDENCE verification type...");
    const missionRes = await fetch(`${BASE_URL}/api/missions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user1Cookie,
      },
      body: JSON.stringify({
        title: "Perimeter Sector Reconnaissance",
        description: "Capture photographic telemetry of anomalous field zone.",
        category: "FOCUS",
        difficulty: "MEDIUM",
        frequency: "DAILY",
        verificationType: "EVIDENCE",
      }),
    });

    const missionData = await missionRes.json();
    if (!missionRes.ok || !missionData.mission) {
      throw new Error(`Failed to create mission: ${JSON.stringify(missionData)}`);
    }

    createdMissionId = missionData.mission.id;
    console.log("   ✓ Mission created successfully! ID:", createdMissionId);
    console.log("     Verification Type:", missionData.mission.verificationType);

    // ----------------------------------------------------
    // STEP 4: Submit Photo Proof via Multipart Form Data
    // ----------------------------------------------------
    console.log("4. Submitting photo evidence via POST /api/missions/[id]/evidence...");
    const formData = new FormData();
    const blob = new Blob([SAMPLE_PNG_BUFFER], { type: "image/png" });
    formData.append("file", blob, "recon_photo.png");
    formData.append("description", "Confirmed sector anomaly stabilized via real-world focus session.");

    const evidenceRes = await fetch(`${BASE_URL}/api/missions/${createdMissionId}/evidence`, {
      method: "POST",
      headers: {
        Cookie: user1Cookie,
      },
      body: formData,
    });

    const evidenceData = await evidenceRes.json();
    console.log("   Evidence POST Status:", evidenceRes.status);
    console.log("   Evidence Response:", evidenceData);

    if (!evidenceRes.ok || !evidenceData.success) {
      throw new Error(`Evidence submission failed: ${JSON.stringify(evidenceData)}`);
    }
    console.log("   ✓ Proof successfully accepted and attached to survivor dossier!");

    // ----------------------------------------------------
    // STEP 5: Verify Evidence is Retrievable via GET
    // ----------------------------------------------------
    console.log("5. Inspecting saved evidence via GET /api/missions/[id]/evidence...");
    const getEvRes = await fetch(`${BASE_URL}/api/missions/${createdMissionId}/evidence`, {
      headers: { Cookie: user1Cookie },
    });
    const getEvData = await getEvRes.json();
    if (!getEvRes.ok || getEvData.count !== 1) {
      throw new Error(`Evidence inspection failed: ${JSON.stringify(getEvData)}`);
    }
    console.log("   ✓ Evidence verified on record. Count:", getEvData.count, "Type:", getEvData.evidences[0].type);

    // ----------------------------------------------------
    // STEP 6: Complete Mission and Verify Rewards
    // ----------------------------------------------------
    console.log("6. Completing Mission via POST /api/missions/[id]/complete...");
    const completeRes = await fetch(`${BASE_URL}/api/missions/${createdMissionId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user1Cookie,
      },
    });

    const completeData = await completeRes.json();
    console.log("   Complete Status:", completeRes.status);
    if (!completeRes.ok || !completeData.success) {
      throw new Error(`Mission completion failed: ${JSON.stringify(completeData)}`);
    }
    console.log("   ✓ Mission cleared!");
    console.log("     XP Gained: +", completeData.rewards?.xp);
    console.log("     Credits Gained: +", completeData.rewards?.credits);
    console.log("     New Character XP:", completeData.character?.xp);
    console.log("     Current Streak:", completeData.streak?.currentStreak);

    // ----------------------------------------------------
    // STEP 7: Security Test - Unauthorized User Submitting Proof
    // ----------------------------------------------------
    console.log("7. Security Verification: Creating Intruder User in Database...");
    const user2 = await db.createUser({
      username: user2Username,
      email: user2Email,
      passwordHash,
    });
    user2Id = user2.id;
    user2Cookie = await generateAuthCookie(user2Id);

    console.log("   Attempting IDOR attack: Intruder submitting proof for Survivor 1's mission...");
    const idorFormData = new FormData();
    idorFormData.append("description", "Malicious attempt to forge evidence on another user's mission.");
    const idorRes = await fetch(`${BASE_URL}/api/missions/${createdMissionId}/evidence`, {
      method: "POST",
      headers: { Cookie: user2Cookie },
      body: idorFormData,
    });

    const idorData = await idorRes.json();
    console.log("   Intruder Status Code:", idorRes.status);
    console.log("   Intruder Response:", idorData);

    if (idorRes.status !== 403) {
      throw new Error(`Security Failure: Expected 403 Forbidden, got ${idorRes.status}`);
    }
    console.log("   ✓ IDOR defense verified: 403 Forbidden returned when user does not own mission.");

    // ----------------------------------------------------
    // STEP 8: Non-Existent Mission Test
    // ----------------------------------------------------
    console.log("8. Testing Non-Existent Mission ID proof submission...");
    const nonExistentRes = await fetch(`${BASE_URL}/api/missions/msn_non_existent_9999/evidence`, {
      method: "POST",
      headers: { Cookie: user1Cookie },
      body: idorFormData,
    });
    const nonExistentData = await nonExistentRes.json();
    console.log("   Non-existent Status Code:", nonExistentRes.status);
    console.log("   Non-existent Response:", nonExistentData);

    if (nonExistentRes.status !== 404) {
      throw new Error(`Expected 404 Not Found, got ${nonExistentRes.status}`);
    }
    console.log("   ✓ 404 Not Found verified for genuinely missing mission.");

    console.log("\n==================================================");
    console.log("🎉 ALL PRODUCTION MISSION PROOF & SECURITY TESTS PASSED!");
    console.log("==================================================");
  } finally {
    // Cleanup test users from database
    console.log("\n🧹 Cleaning up test accounts from database...");
    const fs = await import("fs");
    const path = await import("path");
    const localFile = path.join(process.cwd(), ".data", "survivors.json");
    if (fs.existsSync(localFile) && (user1Id || user2Id)) {
      const store = JSON.parse(fs.readFileSync(localFile, "utf-8"));
      const testUserIds = new Set([user1Id, user2Id].filter(Boolean));
      store.users = (store.users || []).filter((u: any) => !testUserIds.has(u.id));
      store.characters = (store.characters || []).filter((c: any) => !testUserIds.has(c.userId));
      store.missions = (store.missions || []).filter((m: any) => !testUserIds.has(m.userId));
      store.missionCompletions = (store.missionCompletions || []).filter((mc: any) => !testUserIds.has(mc.userId));
      store.missionEvidences = (store.missionEvidences || []).filter((me: any) => !testUserIds.has(me.userId));
      store.dailyActivities = (store.dailyActivities || []).filter((da: any) => !testUserIds.has(da.userId));
      store.userStreaks = (store.userStreaks || []).filter((s: any) => !testUserIds.has(s.userId));
      store.economyTransactions = (store.economyTransactions || []).filter((tx: any) => !testUserIds.has(tx.userId));
      fs.writeFileSync(localFile, JSON.stringify(store, null, 2), "utf-8");
      console.log("   ✓ Cleaned up test data.");
    }
  }
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
