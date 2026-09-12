// THE OTHER SIDE - Automated Test Suite for Phase 5: World Corruption + Boss System

import { db } from "../lib/db/client";
import {
  WORLD_AREAS,
  getCorruptionReduction,
  getAreaRestorationGain,
  getAreaForCategory,
  clampCorruption,
  clampRestoration,
} from "../lib/game/world";
import {
  BOSS_DEFINITIONS,
  getBossDamage,
  getBossDefinition,
  getNextBossDefinition,
  processBossDamageCalculation,
} from "../lib/game/bosses";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 5 WORLD CORRUPTION & BOSS TESTS");
  console.log("==================================================");

  // ----------------------------------------------------
  // SUITE 1: Pure Formulas & Mathematical Verification
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 1: Centralized Game Formulas ---");

  // Corruption reduction
  assert(getCorruptionReduction("EASY") === 2, "EASY corruption reduction is 2");
  assert(getCorruptionReduction("MEDIUM") === 4, "MEDIUM corruption reduction is 4");
  assert(getCorruptionReduction("HARD") === 6, "HARD corruption reduction is 6");
  assert(getCorruptionReduction("EPIC") === 10, "EPIC corruption reduction is 10");

  // Boss damage
  assert(getBossDamage("EASY") === 10, "EASY boss damage is 10");
  assert(getBossDamage("MEDIUM") === 25, "MEDIUM boss damage is 25");
  assert(getBossDamage("HARD") === 45, "HARD boss damage is 45");
  assert(getBossDamage("EPIC") === 80, "EPIC boss damage is 80");

  // Area restoration
  assert(getAreaRestorationGain("EASY") === 2, "EASY restoration gain is 2%");
  assert(getAreaRestorationGain("MEDIUM") === 4, "MEDIUM restoration gain is 4%");
  assert(getAreaRestorationGain("HARD") === 6, "HARD restoration gain is 6%");
  assert(getAreaRestorationGain("EPIC") === 10, "EPIC restoration gain is 10%");

  // Category mapping
  assert(getAreaForCategory("MIND") === "KNOWLEDGE_FOREST", "MIND maps to KNOWLEDGE_FOREST");
  assert(getAreaForCategory("FOCUS") === "FOCUS_LAB", "FOCUS maps to FOCUS_LAB");
  assert(getAreaForCategory("BODY") === "IRON_PEAK", "BODY maps to IRON_PEAK");
  assert(getAreaForCategory("SPIRIT") === "STILLWATER", "SPIRIT maps to STILLWATER");
  assert(getAreaForCategory("CONNECTION") === "THE_CITADEL", "CONNECTION maps to THE_CITADEL");

  // Clamping limits
  assert(clampCorruption(110) === 100, "clampCorruption upper bound is 100");
  assert(clampCorruption(-15) === 0, "clampCorruption lower bound is 0");
  assert(clampRestoration(120) === 100, "clampRestoration upper bound is 100");
  assert(clampRestoration(-5) === 0, "clampRestoration lower bound is 0");

  // Boss damage calculation
  const dmgCalc1 = processBossDamageCalculation(500, 500, 45);
  assert(dmgCalc1.damageDealt === 45, "Boss damage dealt is 45");
  assert(dmgCalc1.hpAfter === 455, "Boss HP after is 455");
  assert(!dmgCalc1.isDefeated, "Boss is not defeated at 455 HP");

  const dmgCalc2 = processBossDamageCalculation(30, 500, 45);
  assert(dmgCalc2.damageDealt === 30, "Boss damage clamped to remaining HP");
  assert(dmgCalc2.hpAfter === 0, "Boss HP reached exactly 0");
  assert(dmgCalc2.isDefeated, "Boss is marked defeated at 0 HP");

  // Boss sequence
  const b1 = getBossDefinition("THE_PROCRASTINATOR");
  assert(b1.maxHp === 500, "Boss 1 is THE_PROCRASTINATOR with 500 HP");
  const b2 = getNextBossDefinition("THE_PROCRASTINATOR");
  assert(b2?.key === "THE_DISTRACTION", "Boss 2 is THE_DISTRACTION with 800 HP");
  assert(b2?.maxHp === 800, "Boss 2 max HP is 800");
  const b3 = getNextBossDefinition("THE_DISTRACTION");
  assert(b3?.key === "THE_DOUBT", "Boss 3 is THE_DOUBT with 1200 HP");
  const b4 = getNextBossDefinition("THE_DOUBT");
  assert(b4?.key === "THE_SLEEPLESS", "Boss 4 is THE_SLEEPLESS with 1800 HP");

  // ----------------------------------------------------
  // SUITE 2: End-to-End User Setup & Initial State
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 2: User Initialization & Default World ---");
  const testEmail = `survivor_p5_${Date.now()}@theotherside.world`;
  const user = await db.createUser({
    email: testEmail,
    username: "Kaelen",
    passwordHash: "mock_hash_p5",
  });
  assert(!!user.id, "User created successfully");

  const character = await db.createCharacter({
    userId: user.id,
    name: "Kaelen",
    archetype: "SCHOLAR",
    mind: 16,
    body: 8,
    focus: 12,
    spirit: 8,
    connection: 6,
  });
  assert(character.level === 1, "Character created at Level 1");

  const worldState = await db.findWorldStateByUserId(user.id);
  assert(worldState.corruption === 100, "Initial corruption is 100%");
  assert(worldState.integrityPercent === 0, "Initial sanctuary integrity is 0%");
  assert(worldState.areas.length === 6, "All 6 world areas initialized");
  assert(worldState.areas.find((a) => a.areaKey === "THE_GATE")?.isUnlocked === true, "THE GATE is unlocked initially");
  assert(worldState.areas.find((a) => a.areaKey === "KNOWLEDGE_FOREST")?.isUnlocked === false, "KNOWLEDGE FOREST is locked initially (> 85% corruption)");
  assert(worldState.activeBoss.bossKey === "THE_PROCRASTINATOR", "Initial active boss is THE PROCRASTINATOR");
  assert(worldState.activeBoss.currentHp === 500, "THE PROCRASTINATOR starts with 500 HP");

  // ----------------------------------------------------
  // TEST 1: Easy Mind Mission Completion
  // ----------------------------------------------------
  console.log("\n--- TEST 1: Easy Mind Mission Completion & Progression ---");
  const easyMindMission = await db.createMission({
    userId: user.id,
    title: "Read 10 pages of OS architecture",
    category: "MIND",
    difficulty: "EASY",
    frequency: "ONCE",
  });

  const res1 = await db.completeMissionTransaction(user.id, easyMindMission.id);
  assert(res1.success, "Mission completed successfully");
  assert(res1.rewards.xp === 20, "Awarded +20 XP");
  assert(res1.rewards.credits === 10, "Awarded +10 Credits");
  assert(res1.rewards.attribute === "mind", "Trained MIND attribute");
  assert(res1.rewards.attributeIncrease === 1, "Increased MIND by +1");
  assert(res1.character?.mind === 17, "Character MIND increased from 16 to 17");
  assert(res1.world?.corruptionAfter === 98, "Corruption reduced from 100 to 98 (-2)");
  assert(res1.boss?.damageDealt === 10, "Dealt 10 damage to THE PROCRASTINATOR");
  assert(res1.boss?.hpAfter === 490, "THE PROCRASTINATOR HP dropped to 490");
  assert(res1.area?.areaKey === "KNOWLEDGE_FOREST", "Target area is KNOWLEDGE_FOREST");
  assert(res1.area?.restorationGained === 2, "Knowledge Forest gained +2% restoration");
  assert(res1.area?.restorationPercent === 2, "Knowledge Forest restoration is 2%");

  // ----------------------------------------------------
  // TEST 2: ONCE Mission Duplicate Prevention
  // ----------------------------------------------------
  console.log("\n--- TEST 2: ONCE Mission Duplicate Prevention ---");
  const res2 = await db.completeMissionTransaction(user.id, easyMindMission.id);
  assert(!res2.success, "Duplicate ONCE completion rejected");
  assert(res2.statusCode === 400, "Returned 400 Bad Request");

  // ----------------------------------------------------
  // TEST 3: DAILY Mission Duplicate Prevention
  // ----------------------------------------------------
  console.log("\n--- TEST 3: DAILY Mission Same-Day Duplicate Prevention ---");
  const dailyFocusMission = await db.createMission({
    userId: user.id,
    title: "30-minute deep focus sprint",
    category: "FOCUS",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });

  const res3a = await db.completeMissionTransaction(user.id, dailyFocusMission.id);
  assert(res3a.success, "First DAILY completion succeeded");
  assert(res3a.world?.corruptionAfter === 94, "Corruption reduced by -4 to 94");
  assert(res3a.boss?.damageDealt === 25, "Dealt 25 damage to boss");
  assert(res3a.area?.areaKey === "FOCUS_LAB", "Target area is FOCUS_LAB");
  assert(res3a.area?.restorationPercent === 4, "Focus Lab restoration is 4%");

  const res3b = await db.completeMissionTransaction(user.id, dailyFocusMission.id);
  assert(!res3b.success, "Second DAILY completion on same day rejected");
  assert(res3b.statusCode === 400, "Returned 400 for duplicate daily completion");

  // ----------------------------------------------------
  // TEST 4: Corruption Reduction & Area Unlocking
  // ----------------------------------------------------
  console.log("\n--- TEST 4: Area Unlocking via Corruption Thresholds ---");
  // Complete an EPIC mission (difficulty: EPIC -> -10 corruption)
  // Current corruption: 94 -> 94 - 10 = 84 (Threshold for Knowledge Forest is <= 85!)
  const epicMission = await db.createMission({
    userId: user.id,
    title: "Ship production microservice",
    category: "MIND",
    difficulty: "EPIC",
    frequency: "ONCE",
  });

  const res4 = await db.completeMissionTransaction(user.id, epicMission.id);
  assert(res4.success, "EPIC mission completed");
  assert(res4.world?.corruptionAfter === 84, "Corruption dropped to 84% (below 85% threshold)");
  assert(
    !!res4.area?.newlyUnlockedAreas.includes("KNOWLEDGE_FOREST"),
    "KNOWLEDGE FOREST unlocked dynamically at 84% corruption!"
  );

  const updatedWorld = await db.findWorldStateByUserId(user.id);
  const kForest = updatedWorld.areas.find((a) => a.areaKey === "KNOWLEDGE_FOREST");
  assert(kForest?.isUnlocked === true, "KNOWLEDGE FOREST is persisted as unlocked in world state");

  // ----------------------------------------------------
  // TEST 5: Boss Defeat & Progression to Next Boss
  // ----------------------------------------------------
  console.log("\n--- TEST 5: Boss Defeat at 0 HP & Next Boss Promotion ---");
  // Current boss HP: 500 - 10 (EASY) - 25 (MEDIUM) - 80 (EPIC) = 385 HP remaining.
  // Complete 5 EPIC missions (5 * 80 = 400 dmg > 385 HP) to defeat THE PROCRASTINATOR!
  let lastBossRes: any = null;
  for (let i = 1; i <= 5; i++) {
    const epicMsn = await db.createMission({
      userId: user.id,
      title: `Final Strike Phase ${i}`,
      category: "BODY",
      difficulty: "EPIC",
      frequency: "ONCE",
    });
    lastBossRes = await db.completeMissionTransaction(user.id, epicMsn.id);
  }

  assert(lastBossRes.success, "Final strike mission succeeded");
  assert(lastBossRes.boss?.hpAfter === 0, "THE PROCRASTINATOR HP dropped to 0");
  assert(lastBossRes.boss?.isDefeated === true, "THE PROCRASTINATOR marked as DEFEATED");
  assert(lastBossRes.boss?.nextBossKey === "THE_DISTRACTION", "Next boss promoted: THE DISTRACTION");
  assert(lastBossRes.boss?.nextBossName === "THE DISTRACTION", "Next boss name resolved: THE DISTRACTION");

  // Verify next active boss from DB
  const worldAfterDefeat = await db.findWorldStateByUserId(user.id);
  assert(
    worldAfterDefeat.activeBoss.bossKey === "THE_DISTRACTION",
    "THE DISTRACTION is now active boss in world state"
  );
  assert(
    worldAfterDefeat.activeBoss.currentHp === 800,
    "THE DISTRACTION active with full 800 HP"
  );

  // ----------------------------------------------------
  // TEST 6 & 7: World State & Survivor Persistence
  // ----------------------------------------------------
  console.log("\n--- TEST 6 & 7: Persistence Verification Across Simulated Sessions ---");
  const reloadedUser = await db.findUserById(user.id);
  assert(!!reloadedUser?.character, "Character relation loaded");
  assert(reloadedUser!.character!.level >= 2, "Character leveled up and persisted");

  const reloadedWorld = await db.findWorldStateByUserId(user.id);
  assert(reloadedWorld.corruption <= 40, "Reduced corruption persisted");
  assert(reloadedWorld.activeBoss.bossKey === "THE_DISTRACTION", "Active boss progression persisted");
  assert(reloadedWorld.areas.find((a) => a.areaKey === "KNOWLEDGE_FOREST")?.isUnlocked === true, "Unlocked areas persisted");

  // ----------------------------------------------------
  // TEST 8: IDOR Security Scoping
  // ----------------------------------------------------
  console.log("\n--- TEST 8: IDOR Access & Cross-User Security Scoping ---");
  const userB = await db.createUser({
    email: `intruder_${Date.now()}@badactor.net`,
    username: "Malory",
    passwordHash: "intruder_hash",
  });
  await db.createCharacter({
    userId: userB.id,
    name: "Malory",
    archetype: "WARRIOR",
    mind: 8,
    body: 16,
    focus: 10,
    spirit: 10,
    connection: 6,
  });

  // User B tries to complete User A's mission
  const idorRes = await db.completeMissionTransaction(userB.id, easyMindMission.id);
  assert(!idorRes.success, "User B blocked from completing User A's mission");
  assert(idorRes.statusCode === 404, "Returned 404 Not Found for cross-user mission target");

  console.log("\n==================================================");
  console.log("TEST SUMMARY: ALL PHASE 5 TESTS PASSED (100%)");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
