import { db } from "../lib/db/client";

async function testProgressionSync() {
  console.log("▶ Testing real-time progression sync to leaderboard...");

  // Get initial leaderboard
  const initial = await db.getLeaderboard({ limit: 10 });
  const targetUser = initial.entries.find((e) => e.username === "dia");

  if (!targetUser) {
    console.log("Target user 'dia' not found, skipping dynamic test.");
    return;
  }

  console.log(`Initial status of '${targetUser.username}': Rank #${targetUser.rank}, XP: ${targetUser.xp}`);

  // Add XP to dia (e.g. simulate mission reward +300 XP)
  const char = await db.findCharacterByUserId(targetUser.userId);
  if (!char) throw new Error("Character not found");

  const originalXp = char.xp;
  const originalLevel = char.level;

  // Temporarily update XP
  await db.updateCharacter(targetUser.userId, { xp: 300, level: 2 });

  // Re-fetch leaderboard
  const afterUpdate = await db.getLeaderboard({ limit: 10 });
  const updatedEntry = afterUpdate.entries.find((e) => e.userId === targetUser.userId);

  console.log(`Updated status of '${targetUser.username}': Rank #${updatedEntry?.rank}, XP: ${updatedEntry?.xp}`);

  if (updatedEntry?.xp !== 300 || updatedEntry?.rank !== 2) {
    // Revert before throwing
    await db.updateCharacter(targetUser.userId, { xp: originalXp, level: originalLevel });
    throw new Error(`Progression sync failed! Expected 300 XP at Rank #2, got ${updatedEntry?.xp} at Rank #${updatedEntry?.rank}`);
  }

  console.log("✔ Leaderboard immediately reflected new XP and new Rank (#2)!");

  // Revert back to original
  await db.updateCharacter(targetUser.userId, { xp: originalXp, level: originalLevel });

  const reverted = await db.getLeaderboard({ limit: 10 });
  const revertedEntry = reverted.entries.find((e) => e.userId === targetUser.userId);
  console.log(`Reverted status of '${targetUser.username}': Rank #${revertedEntry?.rank}, XP: ${revertedEntry?.xp}`);

  console.log("✔ Test completed cleanly and state preserved.");
}

testProgressionSync().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
