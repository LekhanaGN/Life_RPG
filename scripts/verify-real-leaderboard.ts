import { db } from "../lib/db/client";

async function runTests() {
  console.log("==================================================");
  console.log("VERIFYING REAL LEADERBOARD & STRICT DUMMY DATA REMOVAL");
  console.log("==================================================\n");

  // TEST 1: Retrieve all leaderboard entries
  console.log("▶ TEST 1: Fetching Leaderboard Data...");
  const leaderboard = await db.getLeaderboard({ limit: 100 });

  console.log(`Total Players Registered: ${leaderboard.totalPlayers}`);
  console.log(`Entries Returned: ${leaderboard.entries.length}`);

  if (leaderboard.entries.length === 0) {
    console.log("Leaderboard is currently empty (valid state for zero users).");
  } else {
    leaderboard.entries.forEach((e) => {
      console.log(
        `  Rank #${e.rank.toString().padStart(2, "0")} | Name: ${e.name.padEnd(12)} | User: ${e.username.padEnd(12)} | Class: ${e.archetype.padEnd(10)} | Level: ${e.level.toString().padStart(2, "0")} | XP: ${e.xp.toString().padStart(4, "0")} | Streak: ${e.streak}D`
      );
    });
  }

  // TEST 2: Ensure no dummy / test runner names or placeholder accounts exist
  console.log("\n▶ TEST 2: Validating Strict Exclusion of Dummy/Mock Data...");
  const forbiddenPatterns = [
    "test_user",
    "testhero",
    "survivor_p",
    "intruder",
    "adversary",
    "malory",
    "subject88",
    "subject99",
    "vanguard99",
    "shadowplayer",
    "demouser",
    "fake",
    "dummy",
  ];

  let dummyFound = false;
  for (const entry of leaderboard.entries) {
    const nameLower = (entry.name || "").toLowerCase();
    const userLower = (entry.username || "").toLowerCase();
    for (const pattern of forbiddenPatterns) {
      if (nameLower.includes(pattern) || userLower.includes(pattern)) {
        console.error(`❌ FORBIDDEN DUMMY ENTRY DETECTED: ${entry.name} (${entry.username})`);
        dummyFound = true;
      }
    }
  }

  if (!dummyFound) {
    console.log("✔ PASSED: Zero dummy, mock, or seeded test users found in leaderboard.");
  } else {
    throw new Error("Dummy data check failed!");
  }

  // TEST 3: Verify sorting invariant (XP DESC)
  console.log("\n▶ TEST 3: Validating Sorting Invariant (XP DESC)...");
  let isSorted = true;
  for (let i = 0; i < leaderboard.entries.length - 1; i++) {
    if (leaderboard.entries[i].xp < leaderboard.entries[i + 1].xp) {
      isSorted = false;
      console.error(
        `❌ SORT MISMATCH: Rank #${leaderboard.entries[i].rank} (${leaderboard.entries[i].xp} XP) < Rank #${leaderboard.entries[i + 1].rank} (${leaderboard.entries[i + 1].xp} XP)`
      );
    }
  }
  if (isSorted) {
    console.log("✔ PASSED: Leaderboard is strictly sorted by real cumulative XP descending.");
  } else {
    throw new Error("Sorting check failed!");
  }

  // TEST 4: Security & Privacy Check (Public Projection)
  console.log("\n▶ TEST 4: Validating Security & Public Projection Sanitization...");
  let privacyViolation = false;
  for (const entry of leaderboard.entries) {
    if ((entry as any).passwordHash || (entry as any).email || (entry as any).token) {
      console.error(`❌ SENSITIVE DATA EXPOSED on entry:`, entry);
      privacyViolation = true;
    }
  }
  if (!privacyViolation) {
    console.log("✔ PASSED: No private fields (passwords, emails, tokens) are exposed in leaderboard projections.");
  } else {
    throw new Error("Privacy violation check failed!");
  }

  // TEST 5: Authenticated User Position Check
  if (leaderboard.entries.length > 0) {
    const testUser = leaderboard.entries[0];
    console.log(`\n▶ TEST 5: Validating Authenticated User Highlight for '${testUser.username}'...`);
    const userLeaderboard = await db.getLeaderboard({
      currentUserId: testUser.userId,
      limit: 100,
    });

    const myEntry = userLeaderboard.entries.find((e) => e.isCurrentUser);
    if (myEntry && myEntry.userId === testUser.userId && userLeaderboard.currentUserEntry?.userId === testUser.userId) {
      console.log(`✔ PASSED: Authenticated user correctly highlighted at Rank #${myEntry.rank} with isCurrentUser=true.`);
    } else {
      throw new Error("Current user highlight check failed!");
    }
  }

  console.log("\n==================================================");
  console.log("ALL REAL LEADERBOARD AUDIT CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test run error:", err);
  process.exit(1);
});
