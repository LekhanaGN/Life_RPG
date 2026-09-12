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
} from "lucide-react";
import {
  DbMission,
  MissionCategory,
  CategoryFilter,
  StatusFilter,
  MISSION_CATEGORIES,
} from "@/lib/missions/types";
import { MissionCardItem } from "./MissionCardItem";
import { MissionCreateModal } from "./MissionCreateModal";
import { MissionEditModal } from "./MissionEditModal";
import { MissionDetailsModal } from "./MissionDetailsModal";
import { MissionAbandonDialog } from "./MissionAbandonDialog";
import { MissionToast, ToastMessage } from "./MissionToast";

export function MissionDeck() {
  const [missions, setMissions] = useState<DbMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<DbMission | null>(null);
  const [selectedMissionForEdit, setSelectedMissionForEdit] = useState<DbMission | null>(null);
  const [selectedMissionForAbandon, setSelectedMissionForAbandon] = useState<DbMission | null>(null);

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
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
      setMissions(data.missions || []);
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
    // Also update detail modal if open
    if (selectedMissionForDetails?.id === updated.id) {
      setSelectedMissionForDetails(updated);
    }
    addToast("success", "MISSION UPDATED");
  };

  // Handle optimistic abandon/delete
  const handleConfirmAbandon = async (targetMission: DbMission) => {
    // 1. Close dialog
    setSelectedMissionForAbandon(null);
    if (selectedMissionForDetails?.id === targetMission.id) {
      setSelectedMissionForDetails(null);
    }

    // 2. Optimistic UI update: remove card immediately with animation
    const previousMissions = [...missions];
    setMissions((prev) => prev.filter((m) => m.id !== targetMission.id));
    addToast("success", "MISSION ABANDONED");

    // 3. Confirm with server
    try {
      const res = await fetch(`/api/missions/${targetMission.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Rollback on rejection
        setMissions(previousMissions);
        addToast("error", "THE OTHER SIDE REJECTED THE CHANGE.");
      }
    } catch (err) {
      // Rollback on network failure
      setMissions(previousMissions);
      addToast("error", "THE OTHER SIDE REJECTED THE CHANGE.");
    }
  };

  // Client-side filtering & sorting
  const filteredMissions = useMemo(() => {
    return missions
      .filter((mission) => {
        // Category filter
        if (categoryFilter !== "ALL" && mission.category !== categoryFilter) {
          return false;
        }
        // Status filter
        if (statusFilter !== "ALL" && mission.status !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Active missions first
        if (a.status !== b.status) {
          return a.status === "ACTIVE" ? -1 : 1;
        }
        // 2. Due date soonest
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        // 3. Recently created
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [missions, categoryFilter, statusFilter]);

  const activeCount = useMemo(
    () => missions.filter((m) => m.status === "ACTIVE").length,
    [missions]
  );

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
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-cinzel font-bold tracking-widest uppercase">
                TODAY&apos;S MISSIONS
              </h3>
              <span className="px-2 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-600/70 text-[10px] font-mono text-cyan-300 font-bold tracking-wider">
                {activeCount} ACTIVE
              </span>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-0.5">
              Anchor your reality through real-world execution.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="self-start sm:self-center flex items-center gap-2 px-5 py-2 rounded-xs bg-cyan-950/50 hover:bg-cyan-500 border-2 border-cyan-500 hover:border-cyan-300 text-cyan-200 hover:text-black font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ NEW MISSION</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="py-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
              categoryFilter === "ALL"
                ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            ALL
          </button>

          {(Object.keys(MISSION_CATEGORIES) as MissionCategory[]).map((catKey) => {
            const cat = MISSION_CATEGORIES[catKey];
            const isSelected = categoryFilter === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setCategoryFilter(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                  isSelected
                    ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} font-bold ring-1 ring-cyan-400/40`
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {getCategoryIcon(catKey)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Toggle Filter */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-slate-900/80 p-0.5 rounded-xs border border-slate-800">
          {(["ACTIVE", "ARCHIVED", "ALL"] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-xs text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-800 text-cyan-300 font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-5">
        {/* Loading State: Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-4 rounded-xs bg-slate-900/40 border border-slate-800/80 animate-pulse space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-800 rounded-xs w-1/3" />
                  <div className="h-4 bg-slate-800 rounded-xs w-16" />
                </div>
                <div className="h-3 bg-slate-800/60 rounded-xs w-2/3" />
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-4 bg-slate-800 rounded-xs w-14" />
                  <div className="h-4 bg-slate-800 rounded-xs w-14" />
                  <div className="h-4 bg-slate-800 rounded-xs w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State: SIGNAL LOST */}
        {!isLoading && isError && (
          <div className="py-12 px-4 text-center rounded-xs bg-red-950/20 border border-red-900/40 space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h4 className="font-cinzel text-lg font-bold text-red-200 tracking-widest uppercase">
                SIGNAL LOST
              </h4>
              <p className="text-xs font-mono text-slate-400">
                We couldn&apos;t reach your missions. Dimensional interference detected.
              </p>
            </div>
            <button
              onClick={fetchMissions}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono uppercase tracking-wider text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}

        {/* Empty State 1: Zero Missions in Database */}
        {!isLoading && !isError && missions.length === 0 && (
          <div className="py-14 px-4 text-center rounded-xs bg-slate-900/30 border border-dashed border-cyan-500/30 space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="font-cinzel text-xl font-black text-white tracking-[0.15em] uppercase neon-glow-cyan">
                THE WORLD IS QUIET.
              </h4>
              <p className="text-xs font-mono text-cyan-300/90 tracking-wide">
                You have no missions yet.
              </p>
              <p className="text-xs font-cinzel italic text-slate-400 tracking-wide">
                &ldquo;Every journey begins with a first step.&rdquo;
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xs bg-cyan-950/60 hover:bg-cyan-500 border-2 border-cyan-500 hover:border-cyan-300 text-cyan-200 hover:text-black font-orbitron font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ CREATE FIRST MISSION</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State 2: Missions exist but filter matches zero */}
        {!isLoading && !isError && missions.length > 0 && filteredMissions.length === 0 && (
          <div className="py-10 px-4 text-center rounded-xs bg-slate-900/20 border border-slate-800 space-y-2">
            <div className="font-orbitron text-sm font-semibold uppercase tracking-wider text-slate-400">
              NO RESONANCE DETECTED
            </div>
            <p className="text-xs font-mono text-slate-500">
              No missions found matching the selected filter ({categoryFilter} / {statusFilter}).
            </p>
            <button
              onClick={() => {
                setCategoryFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-2 text-xs font-mono text-cyan-400 hover:underline uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Mission List */}
        {!isLoading && !isError && filteredMissions.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMissions.map((mission) => (
                <MissionCardItem
                  key={mission.id}
                  mission={mission}
                  onView={(m) => setSelectedMissionForDetails(m)}
                  onEdit={(m) => setSelectedMissionForEdit(m)}
                  onAbandon={(m) => setSelectedMissionForAbandon(m)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Lore Status */}
      <div className="pt-4 mt-5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
        <span>SORT ORDER: ACTIVE &gt; DUE SOON &gt; RECENT</span>
        <span>THE OTHER SIDE // MISSION DECK V1.0</span>
      </div>

      {/* Modals & Dialogs */}
      <MissionCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleMissionCreated}
      />

      <MissionEditModal
        mission={selectedMissionForEdit}
        isOpen={!!selectedMissionForEdit}
        onClose={() => setSelectedMissionForEdit(null)}
        onUpdated={handleMissionUpdated}
      />

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

      <MissionAbandonDialog
        mission={selectedMissionForAbandon}
        isOpen={!!selectedMissionForAbandon}
        onClose={() => setSelectedMissionForAbandon(null)}
        onConfirm={handleConfirmAbandon}
      />

      {/* Toast Notifications */}
      <MissionToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
