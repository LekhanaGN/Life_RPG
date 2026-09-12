// THE OTHER SIDE - Security & Progression Automated Verification Script (Phase 4)

import { calculateMissionReward, DIFFICULTY_REWARDS, CATEGORY_ATTRIBUTE_MAP } from "../lib/game/rewards";
import { getXPRequiredForLevel, getLevelFromXP, checkLevelUp, getXPForLevelSpan } from "../lib/game/leveling";
import {
  isSameCalendarDay,
  isSameCalendarWeek,
  validateMissionCompletionEligibility,
  processProgressionMath,
} from "../lib/game/progression";
import { db } from "../lib/db/client";

async function runSecurityAndProgressionTests() {
  console.log("==================================================");
  console.log("STARTING PHASE 4 RPG PROGRESSION & SECURITY TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Leveling Formula & Non-Linear XP Curves
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 1: Leveling Formula & XP Curves ---");
  assert(getXPForLevelSpan(1) === 100, "Level 1 span is 100 XP");
  assert(getXPForLevelSpan(2) === 282, "Level 2 span is 282 XP (100 * 2^1.5 = 282)");
  assert(getXPForLevelSpan(3) === 519, "Level 3 span is 519 XP (100 * 3^1.5 = 519)");

  const lvl1 = getLevelFromXP(0);
  assert(lvl1.level === 1 && lvl1.currentLevelXP === 0 && lvl1.nextLevelXP === 100, "0 XP is Level 1 (0/100)");

  const lvl1Mid = getLevelFromXP(50);
  assert(lvl1Mid.level === 1 && lvl1Mid.currentLevelXP === 50 && lvl1Mid.progressPercent === 50, "50 XP is Level 1 (50/100, 50%)");

  const lvl2 = getLevelFromXP(100);
  assert(lvl2.level === 2 && lvl2.currentLevelXP === 0 && lvl2.nextLevelXP === 282, "100 XP is Level 2 (0/282)");

  const lvl2Mid = getLevelFromXP(241);
  assert(lvl2Mid.level === 2 && lvl2Mid.currentLevelXP === 141, "241 XP is Level 2 (141/282)");

  const levelUpCheck1 = checkLevelUp(20, 140);
  assert(levelUpCheck1.levelUp && levelUpCheck1.previousLevel === 1 && levelUpCheck1.newLevel === 2, "checkLevelUp(20, 140) triggers Level 1 -> 2");

  const levelUpCheckMulti = checkLevelUp(0, 450);
  assert(levelUpCheckMulti.levelUp && levelUpCheckMulti.newLevel === 3 && levelUpCheckMulti.levelsGained === 2, "checkLevelUp(0, 450) triggers Level 1 -> 3 (multi-level gain)");

  // ----------------------------------------------------
  // TEST 2: Authoritative Reward System & Attribute Mapping
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 2: Reward System & Attribute Mapping ---");
  const easyMind = calculateMissionReward({ category: "MIND", difficulty: "EASY" });
  assert(easyMind.xp === 20 && easyMind.credits === 10 && easyMind.attribute === "mind" && easyMind.attributeIncrease === 1, "EASY MIND gives +20 XP, +10 Credits, +1 MIND");

  const epicFocus = calculateMissionReward({ category: "FOCUS", difficulty: "EPIC" });
  assert(epicFocus.xp === 120 && epicFocus.credits === 60 && epicFocus.attribute === "focus" && epicFocus.attributeIncrease === 5, "EPIC FOCUS gives +120 XP, +60 Credits, +5 FOCUS");

  const hardBody = calculateMissionReward({ category: "BODY", difficulty: "HARD" });
  assert(hardBody.xp === 70 && hardBody.credits === 35 && hardBody.attribute === "body" && hardBody.attributeIncrease === 3, "HARD BODY gives +70 XP, +35 Credits, +3 BODY");

  // ----------------------------------------------------
  // TEST 3: Duplicate Completion Prevention Rules
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 3: Duplicate Completion Prevention ---");
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000);

  // ONCE
  const onceNew = validateMissionCompletionEligibility("ONCE", null, now);
  assert(onceNew.eligible, "ONCE mission without prior completions is eligible");

  const onceDone = validateMissionCompletionEligibility("ONCE", tenDaysAgo, now);
  assert(Boolean(!onceDone.eligible && onceDone.reason?.includes("ALREADY COMPLETED")), "ONCE mission completed 10 days ago is rejected");

  // DAILY
  const dailyToday = validateMissionCompletionEligibility("DAILY", now, now);
  assert(!dailyToday.eligible, "DAILY mission completed today is rejected for same day");

  const dailyYesterday = validateMissionCompletionEligibility("DAILY", yesterday, now);
  assert(dailyYesterday.eligible, "DAILY mission completed yesterday is eligible today");

  // WEEKLY
  const weeklyThisWeek = validateMissionCompletionEligibility("WEEKLY", now, now);
  assert(!weeklyThisWeek.eligible, "WEEKLY mission completed this week is rejected for same week");

  const weeklyTenDaysAgo = validateMissionCompletionEligibility("WEEKLY", tenDaysAgo, now);
  assert(weeklyTenDaysAgo.eligible, "WEEKLY mission completed 10 days ago is eligible this week");

  // ----------------------------------------------------
  // TEST 4: Atomic Progression Database Execution & IDOR Protection
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 4: Atomic Transactions & IDOR Access Scoping ---");

  // Create test user A and test character A
  const userA = await db.createUser({
    email: `test_user_a_${Date.now()}@theotherside.world`,
    username: "TestHeroA",
    passwordHash: "dummyhash",
  });
  const charA = await db.createCharacter({
    userId: userA.id,
    name: "HeroA",
    archetype: "EXPLORER",
    mind: 10,
    body: 10,
    focus: 10,
    spirit: 10,
    connection: 10,
  });

  // Create test user B
  const userB = await db.createUser({
    email: `test_user_b_${Date.now()}@theotherside.world`,
    username: "TestHeroB",
    passwordHash: "dummyhash",
  });
  const charB = await db.createCharacter({
    userId: userB.id,
    name: "HeroB",
    archetype: "WARRIOR",
    mind: 8,
    body: 16,
    focus: 10,
    spirit: 10,
    connection: 6,
  });

  // User A creates a mission
  const missionA = await db.createMission({
    userId: userA.id,
    title: "Master Quantum Algorithms",
    category: "MIND",
    difficulty: "HARD",
    frequency: "DAILY",
  });

  // Security Check 1: User B cannot complete User A's mission
  const stealAttempt = await db.completeMissionTransaction(userB.id, missionA.id);
  assert(!stealAttempt.success && stealAttempt.statusCode === 404, "SECURITY: User B cannot complete User A's mission (IDOR blocked with 404)");

  // Complete mission as User A
  const completeRes = await db.completeMissionTransaction(userA.id, missionA.id);
  assert(completeRes.success, "User A successfully completes their own mission");
  assert(completeRes.rewards.xp === 70, "Server awarded exactly +70 XP for HARD");
  assert(completeRes.rewards.credits === 35, "Server awarded exactly +35 Credits for HARD");
  assert(completeRes.rewards.attributeIncrease === 3, "Server awarded exactly +3 MIND for HARD");
  assert(completeRes.character?.mind === 13, "Character A mind increased from 10 to 13");
  assert(((completeRes.character as any)?.currentXp || completeRes.character?.xp) === 70, "Character A total XP updated to 70");
  assert(
    completeRes.character?.credits === 35 || completeRes.character?.credits === 45,
    "Character A credits updated appropriately"
  );

  const dupAttempt = await db.completeMissionTransaction(userA.id, missionA.id);
  assert(Boolean(!dupAttempt.success && dupAttempt.statusCode === 400 && dupAttempt.error?.includes("ALREADY COMPLETED")), "SECURITY: Duplicate DAILY completion on same day is rejected with 400");

  // Check completion history
  const completionsA = await db.findCompletionsByUserId(userA.id);
  assert(completionsA.length >= 1 && completionsA[0].xpEarned === 70, "Mission completion history recorded with 70 XP earned");

  // User A completes an EPIC FOCUS mission -> Level Up trigger
  const epicMission = await db.createMission({
    userId: userA.id,
    title: "Dimensional Void Meditation",
    category: "FOCUS",
    difficulty: "EPIC",
    frequency: "ONCE",
  });

  const levelUpRes = await db.completeMissionTransaction(userA.id, epicMission.id);
  assert(levelUpRes.success, "User A completed EPIC mission");
  assert(((levelUpRes.character as any)?.currentXp || levelUpRes.character?.xp) === 190, "Total XP updated to 190 (70 + 120)");
  assert(levelUpRes.levelUp?.occurred === true, "LEVEL UP triggered (XP 190 > 100 threshold)");
  assert(levelUpRes.levelUp?.previousLevel === 1 && levelUpRes.levelUp?.newLevel === 2, "Level transition 01 -> 02 recorded");
  assert(levelUpRes.character?.level === 2, "Character record level updated to 2");
  assert(levelUpRes.character?.focus === 15, "Focus attribute increased from 10 to 15 (+5)");

  // ONCE mission cannot be repeated
  const dupOnceAttempt = await db.completeMissionTransaction(userA.id, epicMission.id);
  assert(!dupOnceAttempt.success && dupOnceAttempt.statusCode === 400, "SECURITY: ONCE mission cannot be completed a second time");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAndProgressionTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
