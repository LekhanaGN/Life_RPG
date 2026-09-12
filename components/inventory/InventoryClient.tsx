"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorldBackground } from "@/components/world/WorldBackground";
import { WorldNavigation } from "@/components/world/WorldNavigation";
import { DbCharacter, DbInventoryItem, DbUser } from "@/lib/db/client";
import { SignalConsoleShell } from "@/components/navigation/SignalConsole";
import { ItemRarity, RARITY_CONFIG, EQUIPMENT_SLOTS, EquipmentSlot, isEquippable } from "@/lib/game/items";
import { soundscape } from "@/lib/audio/soundscape";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Zap,
  Cpu,
  Compass,
  Brain,
  Shield,
  Sparkles,
  Key,
  Gamepad2,
  Coins,
  CheckCircle,
  ShoppingBag,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface InventoryClientProps {
  user: DbUser;
  character: DbCharacter;
  initialInventory: DbInventoryItem[];
}

export function InventoryClient({
  user,
  character,
  initialInventory,
}: InventoryClientProps) {
  const [inventory, setInventory] = useState<DbInventoryItem[]>(initialInventory);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const getItemIcon = (iconName?: string) => {
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
        return <Package className="w-5 h-5" />;
    }
  };

  const handleEquip = async (invItem: DbInventoryItem) => {
    if (actionInProgressId || invItem.isEquipped) return;
    setActionInProgressId(invItem.id);
    soundscape.playHover();

    try {
      const res = await fetch(`/api/inventory/${invItem.id}/equip`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundscape.playRestoration();
        const targetSlot = invItem.item?.slot;

        setInventory((prev) =>
          prev.map((item) => {
            if (item.id === invItem.id) {
              return { ...item, isEquipped: true };
            }
            if (targetSlot && item.item?.slot === targetSlot) {
              return { ...item, isEquipped: false };
            }
            return item;
          })
        );
      } else {
        soundscape.playGlitch();
      }
    } catch {
      soundscape.playGlitch();
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleUnequip = async (invItem: DbInventoryItem) => {
    if (actionInProgressId || !invItem.isEquipped) return;
    setActionInProgressId(invItem.id);
    soundscape.playHover();

    try {
      const res = await fetch(`/api/inventory/${invItem.id}/unequip`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        soundscape.playRestoration();
        setInventory((prev) =>
          prev.map((item) =>
            item.id === invItem.id ? { ...item, isEquipped: false } : item
          )
        );
      } else {
        soundscape.playGlitch();
      }
    } catch {
      soundscape.playGlitch();
    } finally {
      setActionInProgressId(null);
    }
  };

  // Find equipped items by slot
  const equippedBySlot = EQUIPMENT_SLOTS.reduce(
    (acc, slotMeta) => {
      const item = inventory.find(
        (inv) => inv.isEquipped && inv.item?.slot === slotMeta.slot
      );
      acc[slotMeta.slot] = item || null;
      return acc;
    },
    {} as Record<EquipmentSlot, DbInventoryItem | null>
  );

  // Filter items
  const filteredItems = inventory.filter((inv) => {
    if (!inv.item) return false;
    if (categoryFilter !== "ALL" && inv.item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <SignalConsoleShell
      user={user}
      character={character}
      realm="right-side"
    >
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Dark Navy Ambience */}
        <WorldBackground mode="right-side" />

      {/* Top HUD Navigation */}
      <WorldNavigation currentRealm="right-side" user={user} character={character} />

      {/* Main Locker Content */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Locker Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b border-cyan-500/20 pb-6 gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                YOUR INVENTORY
              </span>
              <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                TOTAL ITEMS: {inventory.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-black tracking-[0.12em] text-white neon-glow-cyan uppercase">
              INVENTORY
            </h1>
            <p className="font-cinzel text-lg sm:text-xl text-cyan-200/90 italic tracking-wider mt-1">
              &ldquo;Manage your equipped gear and unlocked rewards.&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/arcade"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-cinzel font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>OPEN SHOP</span>
            </Link>

            <div className="px-3 py-2 rounded-xs bg-slate-950 border border-slate-700 text-xs font-mono flex items-center gap-2 text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold">◈ {character.credits}</span>
            </div>
          </div>
        </motion.div>

        {/* Equipped Gear Loadout Grid */}
        <div className="rounded-xs bg-slate-950/80 border border-slate-800 p-5 sm:p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-widest uppercase">
                EQUIPPED GEAR
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-300">
              {Object.values(equippedBySlot).filter(Boolean).length} / {EQUIPMENT_SLOTS.length} SLOTS EQUIPPED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            {EQUIPMENT_SLOTS.map((slotMeta) => {
              const equippedItem = equippedBySlot[slotMeta.slot];
              const itemDef = equippedItem?.item;
              const rarityMeta = itemDef
                ? RARITY_CONFIG[itemDef.rarity as ItemRarity] || RARITY_CONFIG.COMMON
                : null;

              return (
                <div
                  key={slotMeta.slot}
                  className={`rounded-xs border p-3 flex flex-col justify-between transition-all min-h-[140px] ${
                    equippedItem && rarityMeta
                      ? `${rarityMeta.border} ${rarityMeta.bg} shadow-[0_0_12px_rgba(6,182,212,0.15)]`
                      : "border-slate-800/80 bg-slate-900/30"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">
                        {slotMeta.slot}
                      </span>
                      {equippedItem && (
                        <span className="px-1 py-0.2 rounded-[2px] bg-cyan-950 border border-cyan-500/50 text-[8px] font-mono text-cyan-300 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {equippedItem && itemDef ? (
                      <div className="space-y-1">
                        <div className="w-8 h-8 rounded-xs border border-white/20 bg-black/60 flex items-center justify-center text-cyan-300">
                          {getItemIcon(itemDef.icon)}
                        </div>
                        <div className="font-cinzel text-xs font-bold text-white truncate">
                          {itemDef.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          +{itemDef.effectValue} {itemDef.effectType.replace("_BOOST", "")}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center space-y-1">
                        <div className="text-slate-600 font-mono text-[10px]">EMPTY SLOT</div>
                        <div className="text-[9px] font-mono text-slate-500">
                          Equip an item below
                        </div>
                      </div>
                    )}
                  </div>

                  {equippedItem && (
                    <button
                      onClick={() => handleUnequip(equippedItem)}
                      disabled={actionInProgressId === equippedItem.id}
                      className="mt-2 w-full py-1 rounded-[2px] bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-600 text-[10px] font-mono text-slate-300 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      {actionInProgressId === equippedItem.id ? "..." : "UNEQUIP"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vault Items Section */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full border-b border-slate-800">
            {["ALL", "EQUIPMENT", "RELIC", "CONSUMABLE", "COSMETIC"].map((cat) => {
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

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-xs border border-slate-800 bg-slate-950/60">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-cinzel text-base text-slate-300 font-bold tracking-wider">
                NO ITEMS IN THIS CATEGORY
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                Complete missions to earn credits and buy items in the shop.
              </p>
              <Link
                href="/arcade"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-black text-xs font-cinzel font-bold tracking-wider uppercase transition-colors"
              >
                <span>OPEN REWARD SHOP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((invItem) => {
                const item = invItem.item;
                if (!item) return null;
                const rarityMeta = RARITY_CONFIG[item.rarity as ItemRarity] || RARITY_CONFIG.COMMON;
                const canEquip = isEquippable(item);
                const isEquipped = invItem.isEquipped;
                const isProcessing = actionInProgressId === invItem.id;

                return (
                  <motion.div
                    key={invItem.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative rounded-xs border p-4 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : `${rarityMeta.border} ${rarityMeta.bg}`
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-xs border ${rarityMeta.border} bg-black/60 flex items-center justify-center ${rarityMeta.text}`}
                          >
                            {getItemIcon(item.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1 py-0.2 rounded-[2px] text-[8px] font-mono font-bold uppercase border ${rarityMeta.border} ${rarityMeta.text}`}
                              >
                                {item.rarity}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {item.category}
                              </span>
                            </div>
                            <h3 className="font-cinzel text-sm font-bold text-white mt-0.5">
                              {item.name}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded-xs bg-slate-900 border border-slate-700 text-[10px] font-mono text-white font-bold">
                            x{invItem.quantity}
                          </span>
                          {isEquipped && (
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-cyan-950 border border-cyan-400 text-[9px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>EQUIPPED</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                        {item.description}
                      </p>

                      {item.slot && (
                        <div className="text-[10px] font-mono text-cyan-300">
                          SLOT: <span className="font-bold">{item.slot}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    {canEquip && (
                      <div className="pt-3 mt-3 border-t border-white/10">
                        {isEquipped ? (
                          <button
                            onClick={() => handleUnequip(invItem)}
                            disabled={isProcessing}
                            className="w-full py-2 rounded-xs border border-red-800 bg-red-950/40 hover:bg-red-900 text-red-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                          >
                            {isProcessing ? "UNEQUIPPING..." : "UNEQUIP"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(invItem)}
                            disabled={isProcessing}
                            className="w-full py-2 rounded-xs border border-cyan-500 bg-cyan-950/60 hover:bg-cyan-500 hover:text-black text-cyan-300 text-xs font-mono font-bold transition-colors cursor-pointer"
                          >
                            {isProcessing ? "EQUIPPING..." : `EQUIP TO ${item.slot}`}
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 px-6 border-t border-cyan-950/40 bg-black/40 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div>THE OTHER SIDE // Turn real-life goals into missions.</div>
          <div className="text-cyan-400/80">© 2026 THE OTHER SIDE</div>
        </div>
      </footer>
    </div>
  </SignalConsoleShell>
  );
}
