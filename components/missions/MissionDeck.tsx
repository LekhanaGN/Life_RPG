"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Plus,
  Brain,
  Dumbbell,
  Crosshair,
  Sparkles,
  Users,
  AlertTriangle,
  RotateCcw,
  Layers,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  DbMission,
  MissionCategory,
  CategoryFilter,
  StatusFilter,
  MISSION_CATEGORIES,
} from "@/lib/missions/types";
import { DbCharacter } from "@/lib/db/client";
import { soundscape } from "@/lib/audio/soundscape";
import { MissionCardItem } from "./MissionCardItem";
import { MissionCreateModal } from "./MissionCreateModal";
import { MissionEditModal } from "./MissionEditModal";
import { MissionDetailsModal } from "./MissionDetailsModal";
import { MissionAbandonDialog } from "./MissionAbandonDialog";
import { EvidenceModal } from "./EvidenceModal";
import { FocusProtocolModal } from "../focus/FocusProtocolModal";
import { MissionToast, ToastMessage } from "./MissionToast";

export interface ProgressionPayload {
  character: DbCharacter;
  levelUp?: {
    occurred: boolean;
    previousLevel: number;
    newLevel: number;
    levelsGained: number;
  };
  rewards?: {
    xp: number;
    credits: number;
    attribute: string;
    attributeLabel: string;
    attributeIncrease: number;
  };
  world?: {
    corruptionBefore: number;
    corruptionAfter: number;
    corruptionReduced: number;
    integrityPercent: number;
  };
  boss?: {
    key: string;
    name: string;
    title: string;
    damageDealt: number;
    hpBefore: number;
    hpAfter: number;
    maxHp: number;
    isDefeated: boolean;
    defeatedAt: Date | null;
    nextBossKey?: string | null;
    nextBossName?: string | null;
  };
  area?: {
    areaKey: string;
    name: string;
    restorationGained: number;
    restorationPercent: number;
    isRestored: boolean;
    isUnlocked: boolean;
    newlyUnlockedAreas: string[];
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    streakAdvanced: boolean;
    streakBroken: boolean;
    isFirstDay: boolean;
    todayActive: boolean;
  };
  milestonesUnlocked?: any[];
  comeback?: any;
  survivalSecuredToday?: boolean;
  event?: {
    id: string;
    key: string;
    title: string;
    progress: number;
    requiredProgress: number;
    completed: boolean;
    newlyCompleted: boolean;
    rewardClaimed: boolean;
    rewardCredits: number;
    rewardXp: number;
    corruptionReduced?: number;
    bossDamageDealt?: number;
    loreUnlocked?: any;
    loreSnippet?: string | null;
  } | null;
}

export interface MissionDeckProps {
  onProgressionUpdate?: (data: ProgressionPayload) => void;
}

export function MissionDeck({ onProgressionUpdate }: MissionDeckProps) {
  const [missions, setMissions] = useState<DbMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [survivalSecuredToday, setSurvivalSecuredToday] = useState<boolean>(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<DbMission | null>(null);
  const [selectedMissionForEdit, setSelectedMissionForEdit] = useState<DbMission | null>(null);
  const [selectedMissionForAbandon, setSelectedMissionForAbandon] = useState<DbMission | null>(null);
  const [selectedMissionForEvidence, setSelectedMissionForEvidence] = useState<DbMission | null>(null);
  const [selectedMissionForFocus, setSelectedMissionForFocus] = useState<DbMission | null>(null);
  const [verifiedMissionIds, setVerifiedMissionIds] = useState<Set<string>>(new Set());
  const [evidenceSubmittedMissionIds, setEvidenceSubmittedMissionIds] = useState<Set<string>>(new Set());

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info" | "event", message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch missions from API
  const fetchMissions = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await fetch("/api/missions", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        setIsError(true);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      const loaded = data.missions || [];
      setMissions(loaded);
      const isSecured = loaded.some((m: DbMission) => m.isCompletedToday);
      if (isSecured) {
        setSurvivalSecuredToday(true);
      }
    } catch (err) {
      console.error("[MissionDeck Fetch Error]:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Handle mission creation
  const handleMissionCreated = (newMission: DbMission) => {
    setMissions((prev) => [newMission, ...prev]);
    addToast("success", "MISSION CREATED");
  };

  // Handle mission update
  const handleMissionUpdated = (updated: DbMission) => {
    setMissions((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    if (selectedMissionForDetails?.id === updated.id) {
      setSelectedMissionForDetails(updated);
    }
    addToast("success", "MISSION UPDATED");
  };

  const handleEvidenceSubmitted = (m: DbMission) => {
    setEvidenceSubmittedMissionIds((prev) => new Set([...prev, m.id]));
    addToast("info", `EVIDENCE RECEIVED: Signal Integrity 70% attached to "${m.title}".`);
  };

  const handleSessionVerified = (m: DbMission) => {
    setVerifiedMissionIds((prev) => new Set([...prev, m.id]));
    addToast("info", `SESSION VERIFIED: Signal Integrity 91% attached to "${m.title}".`);
  };

  // Handle complete mission with multi-stage Phase 5 & 7 feedback
  const handleCompleteMission = async (targetMission: DbMission) => {
    soundscape.playHover();
    try {
      const res = await fetch(`/api/missions/${targetMission.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        soundscape.playGlitch();
        addToast(
          "error",
          data.error || "The Other Side resisted your action. Mission completion rejected."
        );
        return;
      }

      // 1. Audio and feedback toast sequence
      soundscape.playRestoration();

      const r = data.rewards;
      const w = data.world;
      const b = data.boss;
      const a = data.area;

      let feedbackMsg = `MISSION CLEARED: +${r.xp} XP | +${r.credits} CR | ${r.attributeLabel} +${r.attributeIncrease}`;
      if (w?.corruptionReduced) {
        feedbackMsg += ` | CORRUPTION -${w.corruptionReduced}%`;
      }
      if (b?.damageDealt) {
        feedbackMsg += ` | ${b.name} -${b.damageDealt} HP`;
      }
      if (a?.restorationGained) {
        feedbackMsg += ` | ${a.name} +${a.restorationGained}%`;
      }
      if (data.streak?.streakAdvanced) {
        feedbackMsg += ` | SURVIVAL DAY ${data.streak.currentStreak} SECURED`;
      }

      addToast("success", feedbackMsg);

      // Trigger Anomaly event toast if event was affected
      if (data.event) {
        if (data.event.newlyCompleted) {
          addToast(
            "event",
            `ANOMALY CONTAINED: ${data.event.title} (+${data.event.rewardCredits} CR | +${data.event.rewardXp} XP)`
          );
        } else if (data.event.progress > 0) {
          addToast(
            "event",
            `EVENT PROGRESS: ${data.event.title} [${data.event.progress}/${data.event.requiredProgress}]`
          );
        }
      }

      // 2. Mark survival secured today immediately
      setSurvivalSecuredToday(true);

      // 3. Update local mission status
      setMissions((prev) =>
        prev.map((m) =>
          m.id === targetMission.id
            ? {
                ...m,
                ...data.mission,
                isCompletedToday: true,
                status: data.mission.status || m.status,
              }
            : m
        )
      );

      // 4. Notify parent with complete progression telemetry
      if (onProgressionUpdate && data.character) {
        onProgressionUpdate({
          character: data.character,
          levelUp: data.levelUp,
          rewards: data.rewards,
          world: data.world,
          boss: data.boss,
          area: data.area,
          streak: data.streak,
          milestonesUnlocked: data.milestonesUnlocked,
          comeback: data.comeback,
          survivalSecuredToday: true,
          event: data.event,
        });
      }
    } catch (err) {
      soundscape.playGlitch();
      addToast("error", "The Other Side resisted your action. Network anomaly.");
    }
  };

  // Handle abandon/delete
  const handleConfirmAbandon = async (targetMission: DbMission) => {
    setSelectedMissionForAbandon(null);
    if (selectedMissionForDetails?.id === targetMission.id) {
      setSelectedMissionForDetails(null);
    }

    const previousMissions = [...missions];
    setMissions((prev) => prev.filter((m) => m.id !== targetMission.id));
    addToast("success", "MISSION ABANDONED");

    try {
      const res = await fetch(`/api/missions/${targetMission.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setMissions(previousMissions);
        addToast("error", "THE OTHER SIDE REJECTED THE CHANGE.");
      }
    } catch (err) {
      setMissions(previousMissions);
      addToast("error", "THE OTHER SIDE REJECTED THE CHANGE.");
    }
  };

  // Split into Active vs Completed
  const { activeMissions, completedMissions } = useMemo(() => {
    const active: DbMission[] = [];
    const completed: DbMission[] = [];

    missions.forEach((m) => {
      const isDone = m.status === "COMPLETED" || m.isCompletedToday;
      if (isDone) {
        completed.push(m);
      } else if (m.status === "ACTIVE") {
        active.push(m);
      } else if (m.status === "ARCHIVED") {
        completed.push(m);
      }
    });

    return { activeMissions: active, completedMissions: completed };
  }, [missions]);

  // Client-side filtering & sorting
  const displayedMissions = useMemo(() => {
    const baseList = activeSection === "ACTIVE" ? activeMissions : completedMissions;

    return baseList
      .filter((mission) => {
        if (categoryFilter !== "ALL" && mission.category !== categoryFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [activeSection, activeMissions, completedMissions, categoryFilter]);

  const getCategoryIcon = (cat: MissionCategory) => {
    switch (cat) {
      case "MIND":
        return <Brain className="w-3 h-3" />;
      case "BODY":
        return <Dumbbell className="w-3 h-3" />;
      case "FOCUS":
        return <Crosshair className="w-3 h-3" />;
      case "SPIRIT":
        return <Sparkles className="w-3 h-3" />;
      case "CONNECTION":
        return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className="relative w-full rounded-xs bg-slate-950/70 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-md transition-all">
      {/* HUD Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xs bg-slate-900 border border-slate-700 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-white text-lg font-cinzel font-bold tracking-widest uppercase">
                MISSION DECK
              </h3>
              <span className="px-2 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold">
                {activeMissions.length} ACTIVE
              </span>
              {survivalSecuredToday ? (
                <span className="px-2.5 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-400/80 text-[10px] font-mono text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                  TODAY&apos;S SURVIVAL: SECURED ✓
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-xs bg-amber-950/60 border border-amber-500/60 text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                  TODAY&apos;S SURVIVAL: NOT SECURED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400">
              Execute daily objectives to train attributes and gain XP.
            </p>
          </div>
        </div>

        {/* Primary CTA: Create Mission */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-cinzel font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] cursor-pointer self-start sm:self-center"
          aria-label="Forge new mission protocol"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>NEW MISSION</span>
        </button>
      </div>

      {/* Sub-header: Active / Completed Section Toggle */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection("ACTIVE")}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "ACTIVE"
                ? "bg-cyan-950/80 border border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>TODAY&apos;S MISSIONS ({activeMissions.length})</span>
          </button>

          <button
            onClick={() => setActiveSection("COMPLETED")}
            className={`px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "COMPLETED"
                ? "bg-emerald-950/80 border border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>COMPLETED ({completedMissions.length})</span>
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-2.5 py-1 rounded-xs text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-cyan-950 border border-cyan-500/80 text-cyan-300 font-bold"
                : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            ALL
          </button>

          {(Object.keys(MISSION_CATEGORIES) as MissionCategory[]).map((cat) => {
            const meta = MISSION_CATEGORIES[cat];
            const isSelected = categoryFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xs text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                  isSelected
                    ? `${meta.borderColor} ${meta.bgColor} ${meta.textColor} font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)]`
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200"
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mission List Area */}
      <div className="pt-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-24 rounded-xs bg-slate-900/40 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3 rounded-xs border border-red-900/50 bg-red-950/20">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto animate-bounce" />
            <div className="font-cinzel text-base text-red-300 font-bold tracking-wider">
              TRANSMISSION INTERRUPTED
            </div>
            <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
              Failed to retrieve mission dossier from the dimensional archive.
            </p>
            <button
              onClick={fetchMissions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETRY TRANSMISSION</span>
            </button>
          </div>
        ) : displayedMissions.length === 0 ? (
          <div className="p-10 text-center space-y-3 rounded-xs border border-slate-800/80 bg-slate-900/30">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-cinzel text-base text-slate-300 font-bold tracking-wider">
              {activeSection === "ACTIVE"
                ? "NO ACTIVE MISSIONS IN THIS SECTOR"
                : "NO COMPLETED MISSIONS YET"}
            </div>
            <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
              {activeSection === "ACTIVE"
                ? "Forge a new objective to begin your daily real-world growth."
                : "Complete active missions to log your historical achievements."}
            </p>
            {activeSection === "ACTIVE" && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xs bg-cyan-950/60 border border-cyan-500/60 text-cyan-300 hover:text-white hover:bg-cyan-500 text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>CREATE FIRST MISSION</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {displayedMissions.map((mission) => (
                <MissionCardItem
                  key={mission.id}
                  mission={mission}
                  onView={(m) => setSelectedMissionForDetails(m)}
                  onEdit={(m) => setSelectedMissionForEdit(m)}
                  onAbandon={(m) => setSelectedMissionForAbandon(m)}
                  onComplete={handleCompleteMission}
                  onStartFocus={(m) => setSelectedMissionForFocus(m)}
                  onSubmitEvidence={(m) => setSelectedMissionForEvidence(m)}
                  hasEvidenceSubmitted={evidenceSubmittedMissionIds.has(mission.id)}
                  hasFocusVerified={verifiedMissionIds.has(mission.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toast Feedback Stack */}
      <MissionToast toasts={toasts} onDismiss={dismissToast} />

      {/* Create Mission Modal */}
      <MissionCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleMissionCreated}
      />

      {/* Edit Mission Modal */}
      <MissionEditModal
        mission={selectedMissionForEdit}
        isOpen={!!selectedMissionForEdit}
        onClose={() => setSelectedMissionForEdit(null)}
        onUpdated={handleMissionUpdated}
      />

      {/* View Mission Details Modal */}
      <MissionDetailsModal
        mission={selectedMissionForDetails}
        isOpen={!!selectedMissionForDetails}
        onClose={() => setSelectedMissionForDetails(null)}
        onEdit={(m) => {
          setSelectedMissionForDetails(null);
          setSelectedMissionForEdit(m);
        }}
        onAbandon={(m) => {
          setSelectedMissionForDetails(null);
          setSelectedMissionForAbandon(m);
        }}
      />

      {/* Abandon Confirmation Dialog */}
      <MissionAbandonDialog
        mission={selectedMissionForAbandon}
        isOpen={!!selectedMissionForAbandon}
        onClose={() => setSelectedMissionForAbandon(null)}
        onConfirm={handleConfirmAbandon}
      />

      {/* Evidence Submission Modal */}
      <EvidenceModal
        mission={selectedMissionForEvidence}
        isOpen={!!selectedMissionForEvidence}
        onClose={() => setSelectedMissionForEvidence(null)}
        onEvidenceSubmitted={handleEvidenceSubmitted}
        onProceedToComplete={(m) => {
          setSelectedMissionForEvidence(null);
          handleCompleteMission(m);
        }}
      />

      {/* Focus Protocol Modal */}
      <FocusProtocolModal
        mission={selectedMissionForFocus}
        isOpen={!!selectedMissionForFocus}
        onClose={() => setSelectedMissionForFocus(null)}
        onSessionVerified={handleSessionVerified}
        onProceedToComplete={(m) => {
          setSelectedMissionForFocus(null);
          handleCompleteMission(m);
        }}
      />
    </div>
  );
}
