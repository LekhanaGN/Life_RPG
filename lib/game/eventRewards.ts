// THE OTHER SIDE - Centralized Event Rewards Coordinator (Phase 8)
// Server-authoritative calculation of event completion bonuses, corruption impacts, boss strikes, and lore.

import { WorldEventTemplate, getLoreDefinition, LoreLogDefinition } from "./worldEvents";

export interface EventRewardBreakdown {
  credits: number;
  xp: number;
  corruptionReduction: number;
  bossDamage: number;
  lore?: LoreLogDefinition;
}

/**
 * Resolves the full reward bundle for completing a world event.
 * Ensures lore is included only if provided and not previously unlocked.
 */
export function calculateEventReward(
  eventTemplate: WorldEventTemplate,
  alreadyUnlockedLoreKeys: Set<string> = new Set()
): EventRewardBreakdown {
  let lore: LoreLogDefinition | undefined = undefined;

  if (eventTemplate.loreId && !alreadyUnlockedLoreKeys.has(eventTemplate.loreId)) {
    lore = getLoreDefinition(eventTemplate.loreId);
  }

  return {
    credits: eventTemplate.rewardCredits,
    xp: eventTemplate.rewardXp,
    corruptionReduction: Math.abs(eventTemplate.corruptionChange),
    bossDamage: eventTemplate.bossDamageBonus,
    lore,
  };
}
