"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ARCHETYPES, ArchetypeId } from "@/lib/game/archetypes";
import { createCharacterAction } from "@/lib/auth/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { soundscape } from "@/lib/audio/soundscape";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Brain,
  Dumbbell,
  Target,
  Sparkles,
  HeartHandshake,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ARCHETYPE_ICONS: Record<ArchetypeId, React.ElementType> = {
  EXPLORER: Compass,
  SCHOLAR: Brain,
  WARRIOR: Dumbbell,
  STRATEGIST: Target,
};

const STAT_CONFIG = [
  { id: "mind", label: "MIND", icon: Brain, color: "text-blue-400 bg-blue-500", glow: "shadow-[0_0_6px_#3b82f6]" },
  { id: "body", label: "BODY", icon: Dumbbell, color: "text-emerald-400 bg-emerald-500", glow: "shadow-[0_0_6px_#10b981]" },
  { id: "focus", label: "FOCUS", icon: Target, color: "text-cyan-400 bg-cyan-500", glow: "shadow-[0_0_6px_#06b6d4]" },
  { id: "spirit", label: "SPIRIT", icon: Sparkles, color: "text-amber-400 bg-amber-500", glow: "shadow-[0_0_6px_#f59e0b]" },
  { id: "connection", label: "CONNECTION", icon: HeartHandshake, color: "text-purple-400 bg-purple-500", glow: "shadow-[0_0_6px_#a855f7]" },
];

export function CharacterCreationForm({ defaultUsername }: { defaultUsername?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultUsername || "");
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeId>("EXPLORER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentArchetype = ARCHETYPES[selectedArchetype];
  const IconComponent = ARCHETYPE_ICONS[selectedArchetype];

  const handleSelectArchetype = (id: ArchetypeId) => {
    setSelectedArchetype(id);
    soundscape.playHover();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please designate a Survivor Name.");
      return;
    }

    if (name.trim().length < 2 || name.trim().length > 24) {
      setError("Survivor Name must be between 2 and 24 characters.");
      return;
    }

    setLoading(true);
    soundscape.playHover();

    try {
      const res = await createCharacterAction({
        name: name.trim(),
        archetype: selectedArchetype,
      });

      if (!res.success) {
        soundscape.playGlitch();
        setError(res.error || "Failed to forge survivor matrix.");
        setLoading(false);
      } else {
        soundscape.playRestoration();
        router.push(res.redirectUrl || "/right-side");
      }
    } catch (err) {
      soundscape.playGlitch();
      setError("Network anomaly during character creation. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-950/80 border border-red-600 rounded-xs flex items-start gap-3 text-sm font-mono text-red-200 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Top Section: Survivor Name Input & Live Dossier Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Name Input Card */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <Card variant="default" className="h-full border-cyan-500/40 bg-black/80 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-white text-lg">YOUR CHARACTER</CardTitle>
                </div>
                <Badge variant="cyan">STEP 01</Badge>
              </div>
              <CardDescription>
                CHOOSE YOUR CHARACTER NAME
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <label
                  htmlFor="survivor-name-input"
                  className="block text-xs font-mono uppercase tracking-widest text-cyan-300"
                >
                  CHARACTER NAME
                </label>
                <input
                  id="survivor-name-input"
                  type="text"
                  required
                  maxLength={24}
                  placeholder="e.g. ARIA, ATLAS, VALKYRIE..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-950/90 border-2 border-cyan-500/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/50 rounded-xs text-base sm:text-lg font-cinzel font-bold tracking-widest text-cyan-100 placeholder:text-slate-600 outline-none transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                />
                <p className="text-[11px] font-mono text-slate-400">
                  This is the name you&apos;ll use across both worlds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Character Dossier Preview */}
        <div className="lg:col-span-6">
          <Card variant="cyan" glow className="h-full border-cyan-500/60 bg-slate-950/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                  CHARACTER PREVIEW
                </span>
                <Badge variant="cyan" pulse>
                  READY
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xs border-2 border-cyan-400 bg-cyan-950/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
                  <IconComponent className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-cinzel text-xl font-black text-white tracking-widest uppercase">
                    {name.trim() || "NEW PLAYER"}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-orbitron text-xs font-bold text-cyan-300">
                      LEVEL 01
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider">
                      {currentArchetype.name}
                    </span>
                  </div>
                </div>
              </div>

              <blockquote className="p-2.5 rounded-xs bg-black/60 border border-slate-800 text-xs font-mono text-slate-300 italic">
                &ldquo;{currentArchetype.flavorQuote}&rdquo;
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Middle Section: Choose Your Path (4 Archetypes) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-widest text-white">
              CHOOSE YOUR CLASS
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Your class determines your starting stats.
            </p>
          </div>
          <Badge variant="slate">STEP 02: CLASS</Badge>
        </div>

        {/* 4 Archetype Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(ARCHETYPES) as ArchetypeId[]).map((key) => {
            const arch = ARCHETYPES[key];
            const isSelected = selectedArchetype === key;
            const ArchetypeIcon = ARCHETYPE_ICONS[key];

            return (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectArchetype(key)}
                className={cn(
                  "relative text-left p-4 rounded-xs border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                  isSelected
                    ? "bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900/40 opacity-80 hover:opacity-100"
                )}
              >
                {/* Selection Indicator Pill */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/50">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    SELECTED
                  </div>
                )}

                {/* Card Header */}
                <div className="space-y-2">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xs border flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        : "border-slate-700 bg-slate-900 text-slate-400"
                    )}
                  >
                    <ArchetypeIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="font-cinzel text-lg font-black tracking-widest text-white">
                      {arch.name}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300 font-medium">
                      {arch.tagline}
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                    {arch.description}
                  </p>
                </div>

                {/* Starting Attributes Preview */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 w-full">
                  <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    STARTING STATS
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    <div className="flex justify-between bg-black/50 px-2 py-1 rounded-xs border border-slate-900">
                      <span className="text-blue-400">MIND</span>
                      <span className="text-white font-bold">{arch.attributes.mind}</span>
                    </div>
                    <div className="flex justify-between bg-black/50 px-2 py-1 rounded-xs border border-slate-900">
                      <span className="text-emerald-400">BODY</span>
                      <span className="text-white font-bold">{arch.attributes.body}</span>
                    </div>
                    <div className="flex justify-between bg-black/50 px-2 py-1 rounded-xs border border-slate-900">
                      <span className="text-cyan-400">FOCUS</span>
                      <span className="text-white font-bold">{arch.attributes.focus}</span>
                    </div>
                    <div className="flex justify-between bg-black/50 px-2 py-1 rounded-xs border border-slate-900">
                      <span className="text-amber-400">SPIRIT</span>
                      <span className="text-white font-bold">{arch.attributes.spirit}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Attribute Breakdown & Action Confirmation */}
      <Card variant="default" className="border-cyan-500/30 bg-black/70">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-cinzel text-lg font-bold text-white tracking-wider">
                READY TO BEGIN
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Character <strong className="text-cyan-300">{name || "Your Character"}</strong> [{selectedArchetype}] is ready to enter the game.
            </p>
          </div>

          <Button
            id="onboarding-submit-btn"
            type="submit"
            variant="portal-cyan"
            size="xl"
            glow
            disabled={loading}
            className="w-full md:w-auto px-10 tracking-[0.2em] font-extrabold text-white border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-cyan-200" />
                CREATING CHARACTER...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                START PLAYING
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
