"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { XPBar } from "@/components/character/XPBar";
import { DbCharacter } from "@/lib/db/client";
import { Flame, Coins, ShieldCheck, User } from "lucide-react";

export interface CharacterCardProps {
  character?: DbCharacter | null;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const characterName = character?.name || "ARIA";
  const archetype = character?.archetype || "EXPLORER";
  const level = character?.level ?? 1;
  const xp = character?.xp ?? 0;
  const maxXp = 100;
  const credits = character?.credits ?? 0;

  return (
    <Card variant="cyan" glow className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm border-2 border-cyan-500/80 bg-slate-900/90 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-lg tracking-widest font-cinzel">
                  &ldquo;{characterName}&rdquo;
                </CardTitle>
                <Badge variant="cyan" pulse>
                  ACTIVE
                </Badge>
              </div>
              <CardDescription className="font-mono text-cyan-300/80 text-xs tracking-wider">
                ARCHETYPE: {archetype}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/40 rounded-xs text-right">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                RANK
              </div>
              <div className="text-sm font-orbitron font-extrabold text-cyan-200">
                LEVEL {level < 10 ? `0${level}` : level}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* XP Progression Bar */}
        <XPBar currentXp={xp} maxXp={maxXp} level={level} />

        {/* Survival Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/90 p-3 rounded-xs flex items-center gap-3">
            <div className="p-2 rounded-xs bg-amber-950/40 border border-amber-600/40 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">
                SURVIVAL STREAK
              </div>
              <div className="font-orbitron text-base font-bold text-amber-300">
                0 DAYS
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/90 p-3 rounded-xs flex items-center gap-3">
            <div className="p-2 rounded-xs bg-cyan-950/40 border border-cyan-600/40 text-cyan-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">
                CREDITS
              </div>
              <div className="font-orbitron text-base font-bold text-cyan-300">
                {credits}
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800/90 p-3 rounded-xs flex items-center gap-3">
            <div className="p-2 rounded-xs bg-emerald-950/40 border border-emerald-600/40 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">
                SHIELD INTEGRITY
              </div>
              <div className="font-orbitron text-base font-bold text-emerald-300">
                100%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
