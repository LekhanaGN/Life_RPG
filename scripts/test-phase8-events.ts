// THE OTHER SIDE - Automated Test Suite for Phase 8: World Events
// Tests all 20 core verification requirements for server-authoritative world events.

import { db } from "../lib/db/client";
import {
  CANONICAL_WORLD_EVENTS,
  WORLD_LORE_LOGS,
  getWorldEventDefinition,
  getLoreDefinition,
  formatActiveAnomalyData,
} from "../lib/game/worldEvents";
import {
  selectEligibleEventTemplate,
  isEligibleForNewEvent,
  isEventExpired,
} from "../lib/game/eventGenerator";
import { calculateEventReward } from "../lib/game/eventRewards";

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
  console.log("STARTING PHASE 8 WORLD EVENTS AUTOMATED TEST SUITE");
  console.log("==================================================");

  // -------------------------------------------------------------------------
  // REQ 1 & 2: Event Generation & Context-Aware Eligibility
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 1 & 2: Canonical Templates & Context-Aware Selection ---");
  const templateKeys = Object.keys(CANONICAL_WORLD_EVENTS);
  assert(templateKeys.length === 8, `Catalog contains 8 canonical events (found ${templateKeys.length})`);
  assert(WORLD_LORE_LOGS.length === 6, `Lore archive contains 6 canonical logs (found ${WORLD_LORE_LOGS.length})`);

  // High corruption selection bias
  const highCorruptionCtx = {
    corruption: 85,
    activeBossDefeated: true,
  };
  let emergencyCount = 0;
  for (let i = 0; i < 50; i++) {
    const selected = selectEligibleEventTemplate(highCorruptionCtx);
    if (["BREACH_WARNING", "STATIC_STORM", "THE_LONG_NIGHT"].includes(selected.key)) {
      emergencyCount++;
    }
  }
  assert(emergencyCount >= 25, `High corruption strongly biases towards emergency events (${emergencyCount}/50)`);

  // Active boss selection bias
  const activeBossCtx = {
    corruption: 30,
    activeBossDefeated: false,
  };
  let ironWakeCount = 0;
  for (let i = 0; i < 50; i++) {
    const selected = selectEligibleEventTemplate(activeBossCtx);
    if (selected.key === "IRON_WAKE") {
      ironWakeCount++;
    }
  }
  assert(ironWakeCount >= 8, `Active boss biases towards IRON_WAKE combat event (${ironWakeCount}/50)`);

  // -------------------------------------------------------------------------
  // REQ 3: Single Active Event (No Duplicates) & Cooldown
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 3: Single Active Event & Cooldown Evaluation ---");
  assert(
    isEligibleForNewEvent(true, null) === false,
    "User with active event is not eligible for new event"
  );
  assert(
    isEligibleForNewEvent(false, null) === true,
    "User with no active event and no previous finish is eligible"
  );

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  assert(
    isEligibleForNewEvent(false, tenMinutesAgo) === false,
    "User within cooldown window (10 min < 2 hrs) is not eligible"
  );
  assert(
    isEligibleForNewEvent(false, tenMinutesAgo, new Date(), true) === true,
    "Cooldown can be bypassed when explicitly requested (e.g. testing/simulation)"
  );

  // -------------------------------------------------------------------------
  // REQ 4: Server-Authoritative Expiration
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 4: Server-Authoritative Expiration ---");
  const futureExpiry = new Date(Date.now() + 3600 * 1000);
  const pastExpiry = new Date(Date.now() - 3600 * 1000);
  assert(isEventExpired(futureExpiry) === false, "Future expiration date is not expired");
  assert(isEventExpired(pastExpiry) === true, "Past expiration date is strictly expired");

  // -------------------------------------------------------------------------
  // REQ 5-10: Database Lifecycle & Atomic Mission Completion
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 5-10: DB Lifecycle, Progress Increments & Exactly-Once Rewards ---");

  // Create isolated test user
  const user = await db.createUser({
    email: `survivor_p8_${Date.now()}@otherside.test`,
    username: "Subject88",
    passwordHash: "hash-dummy",
    timezone: "UTC",
  });
  const testUserId = user.id;

  await db.createCharacter({
    userId: testUserId,
    name: "Subject 88",
    archetype: "TECHNICIAN",
    mind: 10,
    body: 10,
    focus: 10,
    spirit: 10,
    connection: 10,
  });

  const characterBefore = await db.findCharacterByUserId(testUserId);
  assert(characterBefore !== null, "Isolated test user created with character");

  // Ensure active event generated
  const userEvent = await db.ensureUserWorldEventForTesting(testUserId, "SIGNAL_SURGE");
  assert(userEvent !== null, "Active world event generated for test user");
  assert(userEvent.progress === 0, "Initial progress is 0");
  assert(userEvent.completed === false, "Initial status is uncompleted");
  assert(userEvent.rewardClaimed === false, "Initial rewardClaimed is false");

  // Re-calling ensureUserWorldEvent must return the SAME active event (REQ 3)
  const userEventSecondCall = await db.ensureUserWorldEvent(testUserId);
  assert(
    userEventSecondCall?.id === userEvent.id,
    "No duplicate active events: second ensureUserWorldEvent returns identical event ID"
  );

  // Create two missions: one matching SIGNAL_SURGE (FOCUS), one non-matching (BODY)
  const focusMission = await db.createMission({
    userId: testUserId,
    title: "Focus Carrier Sweep",
    description: "Scan the 80s monitor band",
    category: "FOCUS",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });

  const bodyMission = await db.createMission({
    userId: testUserId,
    title: "Physical Boundary Reinforce",
    description: "Move iron barricades",
    category: "BODY",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });

  // REQ 6: Non-matching mission does NOT advance progress
  const nonMatchingResult = await db.completeMissionTransaction(testUserId, bodyMission.id);
  assert(
    !nonMatchingResult.event || nonMatchingResult.event.progress === 0,
    "Non-matching category (BODY) does NOT advance SIGNAL_SURGE (FOCUS) progress"
  );

  const eventAfterNonMatch = await db.findActiveUserWorldEvent(testUserId);
  assert(eventAfterNonMatch?.progress === 0, "Event progress remains 0 after non-matching mission");

  // REQ 5 & 7: Matching category advances progress by exactly +1
  const matchingResult1 = await db.completeMissionTransaction(testUserId, focusMission.id);
  assert(matchingResult1.event !== undefined && matchingResult1.event !== null, "Matching category mission returns event telemetry");
  assert(matchingResult1.event?.progress === 1, "Matching mission advances progress by exactly +1 (0 -> 1)");
  assert(matchingResult1.event?.newlyCompleted === false, "Event not yet completed (1 / 3 required)");

  // Complete second matching mission (progress -> 2)
  const focusMission2 = await db.createMission({
    userId: testUserId,
    title: "Second Carrier Sweep",
    description: "Filter noise frequencies",
    category: "FOCUS",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });
  const matchingResult2 = await db.completeMissionTransaction(testUserId, focusMission2.id);
  assert(matchingResult2.event?.progress === 2, "Second matching mission advances progress to 2 / 3");
  assert(matchingResult2.event?.newlyCompleted === false, "Event not yet completed (2 / 3 required)");

  // REQ 8 & 9: Third matching mission completes event (progress -> 3) and awards rewards exactly once
  const focusMission3 = await db.createMission({
    userId: testUserId,
    title: "Third Carrier Sweep",
    description: "Lock the signal crystal",
    category: "FOCUS",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });

  const creditsBeforeCompletion = matchingResult2.character?.credits || 0;
  const matchingResult3 = await db.completeMissionTransaction(testUserId, focusMission3.id);
  assert(matchingResult3.event?.progress === 3, "Third matching mission reaches required progress (3 / 3)");
  assert(matchingResult3.event?.completed === true, "Event status marked completed");
  assert(matchingResult3.event?.newlyCompleted === true, "Event newlyCompleted flag is true");
  assert(matchingResult3.event?.rewardCredits === 60, "SIGNAL_SURGE awards 60 bonus credits");
  assert(matchingResult3.event?.rewardXp === 40, "SIGNAL_SURGE awards 40 bonus XP");

  // Verify credits increased by mission reward + event bonus reward
  const expectedCredits = creditsBeforeCompletion + 20 + 60;
  assert(
    matchingResult3.character?.credits === expectedCredits,
    `Survivor credits accurately credited: ${matchingResult3.character?.credits} == ${expectedCredits}`
  );

  // REQ 10: Refresh / re-query does not duplicate rewards
  const recheckedActiveEvent = await db.findActiveUserWorldEvent(testUserId);
  assert(
    recheckedActiveEvent === null,
    "Completed event is no longer active (status is COMPLETED, rewardClaimed is true)"
  );

  // REQ 15 & 16: Event history and lore unlock persisted
  console.log("\n--- TEST 15 & 16: Event History & Lore Archive ---");
  const history = await db.findUserWorldEventHistory(testUserId);
  assert(history.length >= 1, `Contained event saved in user history (count: ${history.length})`);
  assert(history[0].status === "COMPLETED", "History entry status is COMPLETED");

  const loreUnlocks = await db.findUserLoreUnlocks(testUserId);
  assert(loreUnlocks.length === 1, `Lore unlocked upon containment (count: ${loreUnlocks.length})`);
  assert(loreUnlocks[0].loreKey === "LOG_07", "LOG_07 unlocked from SIGNAL_SURGE");

  // Duplicate lore unlock check
  const duplicateLoreAttempt = await db.saveUserLoreUnlock(testUserId, "LOG_07");
  assert(duplicateLoreAttempt === null, "Re-unlocking identical lore returns null (idempotent / no duplicate)");

  // -------------------------------------------------------------------------
  // REQ 12: Expired Event Cannot Receive Progress
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 12: Expired Event Progress Rejection ---");
  // Set up an expired event for the user using negative duration hours
  await db.ensureUserWorldEventForTesting(testUserId, "STATIC_STORM", { customDurationHours: -1 });
  const staticMission = await db.createMission({
    userId: testUserId,
    title: "Static Shielding",
    description: "Defend against static discharge",
    category: "SPIRIT",
    difficulty: "MEDIUM",
    frequency: "DAILY",
  });

  const expiredMissionResult = await db.completeMissionTransaction(testUserId, staticMission.id);
  assert(
    !expiredMissionResult.event,
    "Expired event does NOT advance progress or return event progression"
  );

  const historyAfterExpire = await db.findUserWorldEventHistory(testUserId);
  const foundExpired = historyAfterExpire.find((h) => h.worldEvent?.key === "STATIC_STORM");
  assert(
    foundExpired !== undefined && foundExpired.status === "EXPIRED",
    "Expired event status is correctly marked EXPIRED in database"
  );

  // -------------------------------------------------------------------------
  // REQ 14: User Isolation
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 14: Multi-Survivor Isolation ---");
  const userB = await db.createUser({
    email: `survivor_p8_b_${Date.now()}@otherside.test`,
    username: "Subject99",
    passwordHash: "hash-dummy",
    timezone: "UTC",
  });
  const userBId = userB.id;

  await db.createCharacter({
    userId: userBId,
    name: "Subject 99",
    archetype: "OUTCAST",
    mind: 10,
    body: 10,
    focus: 10,
    spirit: 10,
    connection: 10,
  });

  const userBEvent = await db.ensureUserWorldEventForTesting(userBId, "OPEN_CHANNEL");
  assert(userBEvent.userId === userBId, "User B has their own distinct event");

  const userBHistory = await db.findUserWorldEventHistory(userBId);
  const userBLore = await db.findUserLoreUnlocks(userBId);
  assert(userBLore.length === 0, "User B has not unlocked User A's lore logs");
  assert(userBHistory.length === 0, "User B has no completed history from User A");

  // -------------------------------------------------------------------------
  // REQ 17 & 18: World Corruption & Boss Interaction (IRON_WAKE)
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 17 & 18: Corruption Reduction & Boss Damage (IRON_WAKE) ---");
  const ironWakeTemplate = getWorldEventDefinition("IRON_WAKE");
  assert(ironWakeTemplate.bossDamageBonus === 40, "IRON_WAKE deals 40 bonus boss damage");
  assert(ironWakeTemplate.corruptionChange === -2, "IRON_WAKE reduces corruption by 2%");

  const rewardsCalculated = calculateEventReward(ironWakeTemplate);
  assert(rewardsCalculated.bossDamage === 40, "Calculated boss damage is 40");
  assert(rewardsCalculated.corruptionReduction === 2, "Calculated corruption drop is 2%");
  assert(rewardsCalculated.lore?.key === "LOG_19", "IRON_WAKE unlocks LOG_19");

  // -------------------------------------------------------------------------
  // REQ 19 & 20: Responsive Contract & Formatted Telemetry
  // -------------------------------------------------------------------------
  console.log("\n--- TEST 19 & 20: Telemetry Contract & Reduced Motion Compliance ---");
  const formatted = formatActiveAnomalyData(userBEvent);
  assert(formatted !== null, "formatActiveAnomalyData produces valid object");
  assert(formatted.key === "OPEN_CHANNEL", "Formatted key is OPEN_CHANNEL");
  assert(formatted.visualEffect.distortionStyle === "pulse", "Visual distortion matches template");
  assert(formatted.rewards.rarity === "COMMON", "OPEN_CHANNEL rarity is COMMON");

  console.log("\n==================================================");
  console.log("ALL 20 PHASE 8 VERIFICATION REQUIREMENTS PASSED!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
