"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Compass, Sparkles, CheckCircle2 } from "lucide-react";

interface MissionPreview {
  id: string;
  title: string;
  category: "mind" | "body" | "focus" | "spirit" | "connection";
  xp: number;
  credits: number;
  difficulty: "minor" | "standard";
}

const SAMPLE_MISSIONS: MissionPreview[] = [
  {
    id: "m-1",
    title: "Morning Solar Alignment (15m Sunlight & Walk)",
    category: "body",
    xp: 25,
    credits: 10,
    difficulty: "minor",
  },
  {
    id: "m-2",
    title: "Focus Bastion (45m Deep Work Without Feeds)",
    category: "focus",
    xp: 50,
    credits: 20,
    difficulty: "standard",
  },
  {
    id: "m-3",
    title: "Cognitive Fortification (Read 10 Pages)",
    category: "mind",
    xp: 25,
    credits: 10,
    difficulty: "minor",
  },
];

export function MissionCard() {
  const [createdFeedback, setCreatedFeedback] = useState(false);

  const handleCreateClick = () => {
    setCreatedFeedback(true);
    setTimeout(() => setCreatedFeedback(false), 3000);
  };

  return (
    <Card variant="default" className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xs bg-slate-900 border border-slate-700 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-lg tracking-widest font-cinzel">
                TODAY&apos;S MISSIONS
              </CardTitle>
              <CardDescription>
                Your journey begins here.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="portal-cyan"
            size="sm"
            onClick={handleCreateClick}
            className="self-start sm:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            CREATE FIRST MISSION
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {createdFeedback && (
          <div className="p-3 bg-cyan-950/70 border border-cyan-500/80 rounded-xs text-xs font-mono text-cyan-200 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>[MISSION DECK READY]: Real-time mission creation activates in Phase 2. Prototype templates loaded below.</span>
          </div>
        )}

        {/* Missions Listing / Teaser Deck */}
        <div className="space-y-2.5">
          {SAMPLE_MISSIONS.map((mission) => (
            <div
              key={mission.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-xs transition-all duration-200 gap-2.5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-600 hover:text-cyan-400 cursor-not-allowed">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200 tracking-wide font-sans">
                    {mission.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="cyan">{mission.category}</Badge>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      +{mission.xp} XP
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      +{mission.credits} CREDITS
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-700 text-slate-400 uppercase">
                  READY
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-xs font-mono text-slate-400 tracking-wider">
          COMPLETE MISSIONS TO PUSH BACK THE SPREAD OF THE OTHER SIDE
        </div>
      </CardContent>
    </Card>
  );
}
