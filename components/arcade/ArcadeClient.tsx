"use client";

import React, { useState } from "react";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { DbCharacter, DbUser, ShopItemView } from "@/lib/db/client";
import { SignalConsoleShell } from "@/components/navigation/SignalConsole";
import { ItemCategory, ItemRarity, RARITY_CONFIG } from "@/lib/game/items";
import { soundscape } from "@/lib/audio/soundscape";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Zap,
  Cpu,
  Compass,
  Brain,
  Shield,
  Sparkles,
  Key,
  ShoppingBag,
  Coins,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export interface ArcadeClientProps {
  user: DbUser;
  character: DbCharacter;
  initialItems: ShopItemView[];
  initialCredits: number;
  initialCorruption: number;
}

export function ArcadeClient({
  user,
  character: initialCharacter,
  initialItems,
  initialCredits,
  initialCorruption,
}: ArcadeClientProps) {
  const [character, setCharacter] = useState<DbCharacter>(initialCharacter);
  const [credits, setCredits] = useState<number>(initialCredits);
  const [items, setItems] = useState<ShopItemView[]>(initialItems);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [rarityFilter, setRarityFilter] = useState<string>("ALL");
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="w-5 h-5" />;
      case "Cpu":
        return <Cpu className="w-5 h-5" />;
      case "Compass":
        return <Compass className="w-5 h-5" />;
      case "Brain":
        return <Brain className="w-5 h-5" />;
      case "Shield":
        return <Shield className="w-5 h-5" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5" />;
      case "Key":
        return <Key className="w-5 h-5" />;
      default:
        return <Gamepad2 className="w-5 h-5" />;
    }
  };

  const handlePurchase = async (item: ShopItemView) => {
    if (purchasingItemId || credits < item.price || !item.isUnlocked) return;

    setPurchasingItemId(item.id);
    soundscape.playHover();

    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        soundscape.playGlitch();
        setToastMessage({
          type: "error",
          text: data.error || "The Arcade dispenser malfunctioned.",
        });
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }

      // Successful purchase
      soundscape.playRestoration();
      const newBal = data.newBalance;
      setCredits(newBal);
      setCharacter((prev) => ({ ...prev, credits: newBal }));

      // Update local item ownership and affordability
      setItems((prev) =>
        prev.map((i) => {
          const isTarget = i.id === item.id;
          return {
            ...i,
            canAfford: newBal >= i.price,
            ownedQuantity: isTarget ? i.ownedQuantity + 1 : i.ownedQuantity,
          };
        })
      );

      setToastMessage({
        type: "success",
        text: `ITEM ACQUIRED: ${item.name} (-${item.price} CREDITS)`,
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      soundscape.playGlitch();
      setToastMessage({
        type: "error",
        text: "Transmission failure contacting The Arcade.",
      });
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setPurchasingItemId(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    if (rarityFilter !== "ALL" && item.rarity !== rarityFilter) return false;
    return true;
  });

  return (
    <SignalConsoleShell
      user={user}
      character={{ ...character, credits }}
      corruption={initialCorruption}
      realm="right-side"
    >
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Dark Navy Cyan Ambience */}
        <WorldBackground mode="right-side" />

      {/* Top HUD Navigation */}
      <WorldNavigation currentRealm="right-side" user={user} character={{ ...character, credits }} />

      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xs border text-xs font-mono font-bold flex items-center gap-2.5 shadow-2xl backdrop-blur-md ${
              toastMessage.type === "success"
                ? "border-emerald-500 bg-emerald-950/90 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "border-red-500 bg-red-950/90 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            }`}
            role="status"
            aria-live="polite"
          >
            {toastMessage.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arcade Terminal */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Terminal Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-500/20 pb-6 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-xs bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                REWARD SHOP
              </span>
              <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                WORLD CORRUPTION: {initialCorruption}%
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-cyan uppercase">
              THE ARCADE
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-amber-200/90 italic tracking-wider mt-1">
              &ldquo;Spend your credits on rewards.&rdquo;
            </p>
          </div>

          {/* Player Credits Ticker */}
          <div className="p-4 rounded-xs bg-slate-950/90 border border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xs bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                YOUR CREDITS
              </div>
              <motion.div
                key={credits}
                initial={{ scale: 1.15, color: "#f59e0b" }}
                animate={{ scale: 1, color: "#fef3c7" }}
                className="text-2xl sm:text-3xl font-orbitron font-extrabold text-amber-200 tracking-wider"
              >
                ◈ {credits.toLocaleString()}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {["ALL", "CONSUMABLE", "EQUIPMENT", "RELIC", "COSMETIC"].map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "ALL ITEMS" : `${cat}S`}
                </button>
              );
            })}
          </div>

          {/* Rarity Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            {["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"].map((rarity) => {
              const isSelected = rarityFilter === rarity;
              return (
                <button
                  key={rarity}
                  onClick={() => setRarityFilter(rarity)}
                  className={`px-2 py-1 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-amber-950/80 border-amber-500 text-amber-300 font-bold"
                      : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {rarity}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredItems.map((item, idx) => {
            const rarityMeta = RARITY_CONFIG[item.rarity as ItemRarity] || RARITY_CONFIG.COMMON;
            const isPurchasing = purchasingItemId === item.id;
            const isLocked = !item.isUnlocked;
            const canAfford = credits >= item.price;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`relative rounded-xs border p-5 flex flex-col justify-between transition-all duration-300 ${
                  isLocked
                    ? "border-slate-800/60 bg-slate-950/40 opacity-60"
                    : `${rarityMeta.border} ${rarityMeta.bg} hover:${rarityMeta.glow} hover:scale-[1.01]`
                }`}
              >
                {/* Top Corner Accents */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/20 pointer-events-none" />

                {/* Card Body */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xs border ${rarityMeta.border} bg-black/60 flex items-center justify-center ${rarityMeta.text}`}
                      >
                        {getItemIcon(item.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono font-bold uppercase border ${rarityMeta.border} ${rarityMeta.text}`}
                          >
                            {item.rarity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-cinzel text-base font-bold text-white tracking-wide mt-0.5">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    {item.slot && (
                      <span className="px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 uppercase">
                        {item.slot} SLOT
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-slate-300 leading-relaxed min-h-[3rem]">
                    {item.description}
                  </p>

                  {/* Item Ownership Tag */}
                  {item.ownedQuantity > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-emerald-950/60 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 font-bold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>OWNED: {item.ownedQuantity}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer / Purchase Action */}
                <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">COST:</span>
                    <span className="text-lg font-orbitron font-extrabold text-amber-300">
                      ◈ {item.price} CREDITS
                    </span>
                  </div>

                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isLocked || !canAfford || isPurchasing}
                    className={`w-full py-2.5 px-4 rounded-xs font-cinzel font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isLocked
                        ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                        : !canAfford
                        ? "bg-red-950/40 border border-red-900/60 text-red-400 cursor-not-allowed"
                        : isPurchasing
                        ? "bg-cyan-950 border border-cyan-500 text-cyan-300 animate-pulse"
                        : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                    }`}
                    aria-label={`Buy ${item.name} for ${item.price} credits`}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>LOCKED (REDUCE CORRUPTION TO {item.requiredCorruption}%)</span>
                      </>
                    ) : !canAfford ? (
                      <>
                        <Coins className="w-3.5 h-3.5 text-red-400" />
                        <span>NOT ENOUGH CREDITS</span>
                      </>
                    ) : isPurchasing ? (
                      <span>BUYING...</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>BUY REWARD</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-cyan-950/40 bg-black/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE OTHER SIDE // Turn real-life goals into missions.</div>
          <div className="text-amber-400/80">© 2026 THE OTHER SIDE</div>
        </div>
      </footer>
    </div>
  </SignalConsoleShell>
  );
}
