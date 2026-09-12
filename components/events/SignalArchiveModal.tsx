"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Archive,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DbUserLoreUnlock } from "@/lib/db/client";

interface HistoricalEvent {
  id: string;
  key: string;
  title: string;
  status: string;
  statusLabel: string;
  progress: number;
  requiredProgress: number;
  completedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  rarity: string;
  rewardCredits: number;
  rewardXp: number;
}

interface SignalArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignalArchiveModal({ isOpen, onClose }: SignalArchiveModalProps) {
  const [activeTab, setActiveTab] = useState<"ANOMALIES" | "LORE">("ANOMALIES");
  const [history, setHistory] = useState<HistoricalEvent[]>([]);
  const [loreArchive, setLoreArchive] = useState<DbUserLoreUnlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetch("/api/world/events/history")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data) {
          setHistory(data.data.history || []);
          setLoreArchive(data.data.loreArchive || []);
        }
      })
      .catch((err) => console.error("Failed to load archive history:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Signal Archive and Lore Logs"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-xs bg-slate-950 border border-cyan-900/60 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xs bg-cyan-950/60 border border-cyan-500/50 text-cyan-400">
                <Archive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-cinzel font-bold tracking-widest text-white uppercase">
                  EVENT & STORY ARCHIVE
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  View past challenges and unlocked stories.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Archive"
              className="p-1.5 rounded-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-slate-950 px-4 pt-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("ANOMALIES")}
              className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold transition-colors ${
                activeTab === "ANOMALIES"
                  ? "border-cyan-400 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>PAST CHALLENGES ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LORE")}
              className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 font-bold transition-colors ${
                activeTab === "LORE"
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>UNLOCKED STORIES ({loreArchive.length})</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
                LOADING ARCHIVE...
              </div>
            ) : activeTab === "ANOMALIES" ? (
              history.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-slate-500">
                  NO PAST CHALLENGES YET.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-xs bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-200 tracking-wider">
                          {item.title}
                        </span>
                        <Badge
                          variant={item.status === "COMPLETED" ? "cyan" : "slate"}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {item.statusLabel}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Progress: {item.progress} / {item.requiredProgress} completed
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                      {item.status === "COMPLETED" ? (
                        <span className="text-emerald-400 font-bold">
                          +{item.rewardCredits} CR // +{item.rewardXp} XP
                        </span>
                      ) : (
                        <span className="text-slate-500">EXPIRED</span>
                      )}
                      <span className="text-slate-500 text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : loreArchive.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                NO STORIES UNLOCKED YET.
                <br />
                Complete special challenges to unlock stories.
              </div>
            ) : (
              loreArchive.map((lore) => (
                <div
                  key={lore.id}
                  className="p-4 rounded-xs bg-slate-900/80 border border-purple-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-400 font-bold tracking-wider">
                      {lore.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      SOURCE: {lore.source}
                    </span>
                  </div>
                  <p className="text-xs font-serif italic text-slate-200 leading-relaxed border-l-2 border-purple-500/60 pl-3 py-0.5">
                    &ldquo;{lore.content}&rdquo;
                  </p>
                  <div className="text-[10px] font-mono text-slate-500">
                    UNLOCKED: {new Date(lore.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>ARCHIVE ONLINE</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
