"use client";

import React, { useState } from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { useWorldTransition } from "@/components/world/WorldInversionTransition";
import { CharacterCard } from "@/components/character/CharacterCard";
import { AttributeBar } from "@/components/character/AttributeBar";
import { LevelUpOverlay, LevelUpData } from "@/components/character/LevelUpOverlay";
import { BossDefeatOverlay, BossDefeatData } from "@/components/character/BossDefeatOverlay";
import { WorldIntegrityMeter } from "@/components/world/WorldIntegrityMeter";
import { WorldMap } from "@/components/world/WorldMap";
import { MissionDeck, ProgressionPayload } from "@/components/missions/MissionDeck";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DbCharacter, DbUser, WorldStateSummary } from "@/lib/db/client";
import { motion } from "framer-motion";
import { Skull, AlertTriangle, Activity } from "lucide-react";
import { SurvivalDashboard } from "@/components/survival/SurvivalDashboard";
import { MilestoneUnlockOverlay } from "@/components/survival/MilestoneUnlockOverlay";
import { MilestoneDefinition, getNextMilestone } from "@/lib/game/streakRewards";
import { SignalStatus, getSignalStrength } from "@/lib/game/streaks";

export interface RightSideClientProps {
  user: DbUser;
  character: DbCharacter;
  initialWorldState?: WorldStateSummary;
  initialStreakSummary?: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    lastActiveDate: Date | null;
    todayActive: boolean;
    nextMilestone: {
      name: string;
      days: number;
      remaining: number;
    } | null;
    signal: SignalStatus;
    streakBroken: boolean;
    previousStreak: number;
  };
  initialComeback?: any;
}

export function RightSideClient({
  user,
  character: initialCharacter,
  initialWorldState,
  initialStreakSummary,
  initialComeback,
}: RightSideClientProps) {
  const { triggerTransition, isTransitioning } = useWorldTransition();
  const [character, setCharacter] = useState<DbCharacter>(initialCharacter);
  const [worldState, setWorldState] = useState<WorldStateSummary | undefined>(initialWorldState);
  const [streakSummary, setStreakSummary] = useState(initialStreakSummary);
  const [activeComeback, setActiveComeback] = useState(initialComeback);
  const [unlockedMilestone, setUnlockedMilestone] = useState<MilestoneDefinition | null>(null);

  // Modals and Highlight states
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [bossDefeatData, setBossDefeatData] = useState<BossDefeatData | null>(null);
  const [highlightedAttribute, setHighlightedAttribute] = useState<string | null>(null);
  const [highlightedArea, setHighlightedArea] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");

  const handleEnterOtherSide = () => {
    triggerTransition("/other-side", "right-to-other");
  };

  const handleProgressionUpdate = (data: ProgressionPayload) => {
    // 1. Update Character
    setCharacter(data.character);

    // 2. Update World State (Corruption, Areas, Boss)
    if (worldState && data.world) {
      const updatedCorruption = data.world.corruptionAfter;
      const updatedIntegrity = data.world.integrityPercent;

      const updatedAreas = worldState.areas.map((area) => {
        let isUnlocked = area.isUnlocked;
        if (updatedCorruption <= area.requiredCorruption) {
          isUnlocked = true;
        }

        let restorationPercent = area.restorationPercent;
        if (data.area && area.areaKey === data.area.areaKey) {
          restorationPercent = data.area.restorationPercent;
        }

        let status: "LOCKED" | "CORRUPTED" | "RECLAIMING" | "RESTORED" = "CORRUPTED";
        if (!isUnlocked) {
          status = "LOCKED";
        } else if (restorationPercent >= 100) {
          status = "RESTORED";
        } else if (restorationPercent > 0) {
          status = "RECLAIMING";
        } else {
          status = "CORRUPTED";
        }

        return {
          ...area,
          isUnlocked,
          restorationPercent,
          status,
        };
      });

      let updatedBoss = worldState.activeBoss;
      if (data.boss) {
        const hpAfter = data.boss.hpAfter;
        const maxHp = data.boss.maxHp || updatedBoss.maxHp;
        const hpPercent = maxHp > 0 ? Math.round((hpAfter / maxHp) * 100) : 0;

        updatedBoss = {
          ...updatedBoss,
          currentHp: hpAfter,
          maxHp,
          isDefeated: data.boss.isDefeated,
          defeatedAt: data.boss.defeatedAt,
          hpPercent,
        };
      }

      setWorldState({
        ...worldState,
        corruption: updatedCorruption,
        integrityPercent: updatedIntegrity,
        areas: updatedAreas,
        activeBoss: updatedBoss,
      });
    }

    // 3. Screen Reader Announcement
    const r = data.rewards;
    const w = data.world;
    const b = data.boss;
    const a = data.area;

    let announceMsg = `Mission cleared! +${r?.xp || 0} XP, +${r?.credits || 0} credits, +${
      r?.attributeIncrease || 0
    } ${r?.attributeLabel || ""}.`;
    if (w?.corruptionReduced) {
      announceMsg += ` Corruption reduced by ${w.corruptionReduced} percent.`;
    }
    if (b?.damageDealt) {
      announceMsg += ` Dealt ${b.damageDealt} damage to ${b.name}.`;
    }
    if (a?.restorationGained) {
      announceMsg += ` Restored ${a.name} by ${a.restorationGained} percent.`;
    }
    setAnnouncement(announceMsg);

    // 4. Attribute Pulse
    if (r?.attribute) {
      setHighlightedAttribute(r.attribute);
      setTimeout(() => setHighlightedAttribute(null), 2500);
    }

    // 5. Area Pulse
    if (a?.areaKey) {
      setHighlightedArea(a.areaKey);
      setTimeout(() => setHighlightedArea(null), 3000);
    }

    // 6. Boss Defeat Overlay Trigger
    if (data.boss?.isDefeated) {
      setBossDefeatData({
        bossName: data.boss.name,
        bossTitle: data.boss.title,
        nextBossName: data.boss.nextBossName,
        corruptionDrop: 10,
        bonusXp: 200,
      });
      setAnnouncement((prev) => `${prev} VICTORY! ${data.boss?.name} has been banished!`);
    }

    // 7. Level Up Overlay Trigger
    if (data.levelUp?.occurred) {
      setLevelUpData({
        previousLevel: data.levelUp.previousLevel,
        newLevel: data.levelUp.newLevel,
        levelsGained: data.levelUp.levelsGained,
        characterName: character.name,
        archetype: character.archetype,
      });
      setAnnouncement((prev) => `${prev} LEVEL UP! Advanced to Level ${data.levelUp?.newLevel}!`);
    }

    // 8. Survival Protocol Telemetry Update
    if (data.streak) {
      const currentStreak = data.streak.currentStreak;
      const longestStreak = data.streak.longestStreak;
      const totalActiveDays = data.streak.totalActiveDays;
      const todayActive = data.streak.todayActive;
      const streakBroken = data.streak.streakBroken;

      const nextMilestoneDef = getNextMilestone(currentStreak);
      const signal = getSignalStrength(currentStreak, todayActive);

      setStreakSummary((prev) => ({
        currentStreak,
        longestStreak,
        totalActiveDays,
        lastActiveDate: new Date(),
        todayActive,
        streakBroken,
        previousStreak: prev?.previousStreak || 0,
        nextMilestone: nextMilestoneDef
          ? {
              name: nextMilestoneDef.milestone.name,
              days: nextMilestoneDef.milestone.requirementValue,
              remaining: nextMilestoneDef.remainingDays,
            }
          : null,
        signal,
      }));

      if (data.streak.streakAdvanced) {
        setAnnouncement(
          (prev) => `${prev} SURVIVAL DAY ${data.streak!.currentStreak} SECURED! THE SIGNAL STRENGTHENS.`
        );
      }
    }

    // 9. Milestone Discovery Overlay
    if (data.milestonesUnlocked && data.milestonesUnlocked.length > 0) {
      const firstNew = data.milestonesUnlocked[0];
      setUnlockedMilestone(firstNew);
      setAnnouncement((prev) => `${prev} NEW DISCOVERY UNLOCKED: ${firstNew.name}!`);
    }

    // 10. Comeback Challenge Status
    if (data.comeback) {
      setActiveComeback(data.comeback);
      if (data.comeback.completed) {
        setAnnouncement((prev) => `${prev} COMEBACK PROTOCOL COMPLETED! Signal Restored!`);
      }
    }
  };

  const currentCorruption = worldState?.corruption ?? 100;

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Cyan Cyber Grid & Dark Navy Ambience */}
      <WorldBackground mode="right-side" />

      {/* Top HUD Navigation Bar */}
      <WorldNavigation currentRealm="right-side" user={user} character={character} />

      {/* Screen Reader Aria-Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Level-Up Cinematic Celebration Modal */}
      <LevelUpOverlay data={levelUpData} onDismiss={() => setLevelUpData(null)} />

      {/* Boss Defeat Cinematic Banishment Modal */}
      <BossDefeatOverlay data={bossDefeatData} onDismiss={() => setBossDefeatData(null)} />

      {/* Phase 7 Milestone Discovery Modal */}
      <MilestoneUnlockOverlay
        milestone={unlockedMilestone}
        onDismiss={() => setUnlockedMilestone(null)}
      />

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* World Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-500/20 pb-6 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan" pulse>
                STABLE REALM
              </Badge>
              <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                ZONE 01: SANCTUARY // RESIDENT: {character.name.toUpperCase()}
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-cyan uppercase">
              THE RIGHT SIDE
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-cyan-200/90 italic tracking-wider mt-1">
              &ldquo;Build your world.&rdquo;
            </p>
          </div>

          {/* Prominent Dimensional Breach Action */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400">
              <AlertTriangle className="w-4 h-4 animate-bounce text-red-500" />
              <span>DIMENSIONAL RIFT DETECTED</span>
            </div>
            <Button
              id="enter-other-side-btn"
              variant="corrupted"
              size="lg"
              glow
              disabled={isTransitioning}
              onClick={handleEnterOtherSide}
              className="border-red-600/90 text-red-300 hover:text-white bg-red-950/40 hover:bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              aria-label="Enter the Other Side dimension"
            >
              <Skull className="w-5 h-5 mr-2 text-red-500 group-hover:text-white" />
              ENTER THE OTHER SIDE
            </Button>
          </div>
        </motion.div>

        {/* Phase 5 World Integrity Meter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <WorldIntegrityMeter corruption={currentCorruption} />
        </motion.div>

        {/* Phase 7 Survival Protocol HUD */}
        {streakSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <SurvivalDashboard
              currentStreak={streakSummary.currentStreak}
              longestStreak={streakSummary.longestStreak}
              totalActiveDays={streakSummary.totalActiveDays}
              todayActive={streakSummary.todayActive}
              signal={streakSummary.signal}
              nextMilestone={streakSummary.nextMilestone}
              comebackChallenge={activeComeback}
              streakBroken={streakSummary.streakBroken}
            />
          </motion.div>
        )}

        {/* Primary Game Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Character Dossier & Attributes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Character Profile Card with Dynamic DB Data */}
            <CharacterCard character={character} />

            {/* Core Attributes Panel with Dynamic Stats */}
            <Card variant="cyan" className="space-y-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-base">CORE ATTRIBUTES</CardTitle>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 uppercase font-semibold">
                    {character.archetype} MATRIX
                  </span>
                </div>
                <CardDescription>REAL-LIFE STATISTICAL RESONANCE</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <AttributeBar
                  character={character}
                  highlightedAttribute={highlightedAttribute}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Mission Deck & World Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Mission Deck with progression updates */}
            <MissionDeck onProgressionUpdate={handleProgressionUpdate} />

            {/* Phase 5 Dimensional Atlas / World Map */}
            {worldState && (
              <WorldMap
                areas={worldState.areas}
                corruption={worldState.corruption}
                highlightedArea={highlightedArea}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* World Status Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-cyan-950/40 bg-black/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE RIGHT SIDE // ZONE 01 [SANCTUARY] // SURVIVOR: {character.name}</div>
          <div className="text-cyan-400/80">CROSS DIMENSIONS VIA PORTAL GATEWAY</div>
        </div>
      </footer>
    </div>
  );
}
