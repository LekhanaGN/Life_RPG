-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verificationType" TEXT NOT NULL DEFAULT 'SELF_REPORT',
    "focusDurationMinutes" INTEGER DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_completions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpEarned" INTEGER NOT NULL,
    "creditsEarned" INTEGER NOT NULL,

    CONSTRAINT "mission_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archetype" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "mind" INTEGER NOT NULL,
    "body" INTEGER NOT NULL,
    "focus" INTEGER NOT NULL,
    "spirit" INTEGER NOT NULL,
    "connection" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "corruption" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_area_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaKey" TEXT NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "restorationPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_area_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bossKey" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "isDefeated" BOOLEAN NOT NULL DEFAULT false,
    "defeatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "effectValue" INTEGER NOT NULL DEFAULT 0,
    "slot" TEXT,
    "requiredCorruption" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economy_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "itemId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economy_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "totalActiveDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "missionsCompleted" INTEGER NOT NULL DEFAULT 1,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "loreQuote" TEXT,
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "rewardCredits" INTEGER NOT NULL DEFAULT 0,
    "rewardXP" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'Flame',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_milestones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comeback_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "missionsRequired" INTEGER NOT NULL DEFAULT 3,
    "missionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comeback_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_events" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "loreSnippet" TEXT,
    "targetAttribute" TEXT NOT NULL,
    "targetArea" TEXT,
    "requiredCompletions" INTEGER NOT NULL DEFAULT 3,
    "rewardCredits" INTEGER NOT NULL DEFAULT 60,
    "rewardXp" INTEGER NOT NULL DEFAULT 40,
    "corruptionChange" INTEGER NOT NULL DEFAULT 0,
    "bossDamageBonus" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "loreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_world_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "worldEventId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "requiredProgress" INTEGER NOT NULL DEFAULT 3,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_world_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lore_unlocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loreKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_lore_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "fileUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredDurationSeconds" INTEGER NOT NULL,
    "accumulatedActiveSeconds" INTEGER NOT NULL DEFAULT 0,
    "idleSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "missions_userId_idx" ON "missions"("userId");

-- CreateIndex
CREATE INDEX "mission_completions_missionId_idx" ON "mission_completions"("missionId");

-- CreateIndex
CREATE INDEX "mission_completions_userId_idx" ON "mission_completions"("userId");

-- CreateIndex
CREATE INDEX "mission_completions_userId_completedAt_idx" ON "mission_completions"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_key" ON "characters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "world_progress_userId_key" ON "world_progress"("userId");

-- CreateIndex
CREATE INDEX "world_area_progress_userId_idx" ON "world_area_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "world_area_progress_userId_areaKey_key" ON "world_area_progress"("userId", "areaKey");

-- CreateIndex
CREATE INDEX "boss_progress_userId_idx" ON "boss_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "boss_progress_userId_bossKey_key" ON "boss_progress"("userId", "bossKey");

-- CreateIndex
CREATE UNIQUE INDEX "items_key_key" ON "items"("key");

-- CreateIndex
CREATE INDEX "inventory_items_userId_idx" ON "inventory_items"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_userId_itemId_key" ON "inventory_items"("userId", "itemId");

-- CreateIndex
CREATE INDEX "economy_transactions_userId_idx" ON "economy_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_userId_key" ON "user_streaks"("userId");

-- CreateIndex
CREATE INDEX "daily_activities_userId_idx" ON "daily_activities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_userId_date_key" ON "daily_activities"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_key_key" ON "milestones"("key");

-- CreateIndex
CREATE INDEX "user_milestones_userId_idx" ON "user_milestones"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_milestones_userId_milestoneId_key" ON "user_milestones"("userId", "milestoneId");

-- CreateIndex
CREATE INDEX "comeback_challenges_userId_idx" ON "comeback_challenges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "world_events_key_key" ON "world_events"("key");

-- CreateIndex
CREATE INDEX "user_world_events_userId_status_expiresAt_idx" ON "user_world_events"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "user_lore_unlocks_userId_idx" ON "user_lore_unlocks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_lore_unlocks_userId_loreKey_key" ON "user_lore_unlocks"("userId", "loreKey");

-- CreateIndex
CREATE INDEX "mission_evidence_userId_idx" ON "mission_evidence"("userId");

-- CreateIndex
CREATE INDEX "mission_evidence_missionId_idx" ON "mission_evidence"("missionId");

-- CreateIndex
CREATE INDEX "focus_sessions_userId_status_idx" ON "focus_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "focus_sessions_missionId_idx" ON "focus_sessions"("missionId");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_completions" ADD CONSTRAINT "mission_completions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_completions" ADD CONSTRAINT "mission_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_progress" ADD CONSTRAINT "world_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_area_progress" ADD CONSTRAINT "world_area_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_progress" ADD CONSTRAINT "boss_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economy_transactions" ADD CONSTRAINT "economy_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comeback_challenges" ADD CONSTRAINT "comeback_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_world_events" ADD CONSTRAINT "user_world_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_world_events" ADD CONSTRAINT "user_world_events_worldEventId_fkey" FOREIGN KEY ("worldEventId") REFERENCES "world_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lore_unlocks" ADD CONSTRAINT "user_lore_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_evidence" ADD CONSTRAINT "mission_evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_evidence" ADD CONSTRAINT "mission_evidence_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
