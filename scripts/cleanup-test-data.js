const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), '.data', 'survivors.json');

if (!fs.existsSync(filePath)) {
  console.log('No survivors.json found.');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Identify real users by excluding test runner prefixes
const isRealUser = (user) => {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase();
  const username = (user.username || '').toLowerCase();
  
  // Exclude test runner patterns
  if (email.startsWith('test_user_')) return false;
  if (email.startsWith('survivor_p')) return false;
  if (email.startsWith('intruder_')) return false;
  if (email.startsWith('adversary_')) return false;
  if (email.endsWith('@badactor.net')) return false;
  if (email.endsWith('@otherside.test')) return false;
  if (username === 'testheroa' || username === 'testherob') return false;
  if (username === 'malory' || username === 'adversary') return false;
  if (username === 'subject88' || username === 'subject99' || username === 'vanguard99') return false;
  if (user.passwordHash === 'dummyhash') return false;

  return true;
};

const realUsers = data.users.filter(isRealUser);
const realUserIds = new Set(realUsers.map(u => u.id));

console.log('Real Users Found:');
realUsers.forEach(u => {
  console.log(` - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
});

// Filter all collections based on realUserIds
const cleanedData = {
  users: realUsers,
  characters: (data.characters || []).filter(c => realUserIds.has(c.userId)),
  missions: (data.missions || []).filter(m => realUserIds.has(m.userId)),
  missionCompletions: (data.missionCompletions || []).filter(mc => realUserIds.has(mc.userId)),
  worldProgress: (data.worldProgress || []).filter(wp => realUserIds.has(wp.userId)),
  worldAreaProgress: (data.worldAreaProgress || []).filter(wap => realUserIds.has(wap.userId)),
  bossProgress: (data.bossProgress || []).filter(bp => realUserIds.has(bp.userId)),
  items: data.items || [], // Canonical starter items
  inventoryItems: (data.inventoryItems || []).filter(ii => realUserIds.has(ii.userId)),
  economyTransactions: (data.economyTransactions || []).filter(et => realUserIds.has(et.userId)),
  userStreaks: (data.userStreaks || []).filter(us => realUserIds.has(us.userId)),
  dailyActivities: (data.dailyActivities || []).filter(da => realUserIds.has(da.userId)),
  milestones: data.milestones || [], // Canonical milestones
  userMilestones: (data.userMilestones || []).filter(um => realUserIds.has(um.userId)),
  comebackChallenges: (data.comebackChallenges || []).filter(cc => realUserIds.has(cc.userId)),
  worldEvents: data.worldEvents || [], // Canonical world events
  userWorldEvents: (data.userWorldEvents || []).filter(uwe => realUserIds.has(uwe.userId)),
  userLoreUnlocks: (data.userLoreUnlocks || []).filter(ulu => realUserIds.has(ulu.userId)),
  missionEvidences: (data.missionEvidences || []).filter(me => realUserIds.has(me.userId)),
  focusSessions: (data.focusSessions || []).filter(fs => realUserIds.has(fs.userId)),
};

// Write cleaned data back
fs.writeFileSync(filePath, JSON.stringify(cleanedData, null, 2), 'utf8');

console.log('\n--- Sanitization Summary ---');
console.log(`Users: ${data.users.length} -> ${cleanedData.users.length}`);
console.log(`Characters: ${(data.characters || []).length} -> ${cleanedData.characters.length}`);
console.log(`Missions: ${(data.missions || []).length} -> ${cleanedData.missions.length}`);
console.log(`Completions: ${(data.missionCompletions || []).length} -> ${cleanedData.missionCompletions.length}`);
