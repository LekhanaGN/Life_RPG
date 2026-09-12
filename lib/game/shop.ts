// THE OTHER SIDE - Centralized Shop & Economy Engine (Phase 6)
// Authoritative catalog unlock rules, purchase validation, and currency checks.

import { ItemDefinition } from "./items";

export interface PurchaseValidationResult {
  eligible: boolean;
  reason?: string;
  statusCode?: number;
}

/**
 * Checks whether an item is unlocked in the Arcade for a player with the given world corruption
 */
export function isItemUnlockedByCorruption(
  item: { requiredCorruption: number },
  currentCorruption: number
): boolean {
  return currentCorruption <= item.requiredCorruption;
}

/**
 * Authoritative purchase eligibility validator
 */
export function validatePurchaseEligibility(params: {
  credits: number;
  itemPrice: number;
  isActive: boolean;
  requiredCorruption: number;
  currentCorruption: number;
}): PurchaseValidationResult {
  if (!params.isActive) {
    return {
      eligible: false,
      reason: "Item is currently decommissioned from the Arcade archive.",
      statusCode: 400,
    };
  }

  if (params.currentCorruption > params.requiredCorruption) {
    return {
      eligible: false,
      reason: `Dimensional barrier locked. Reduce World Corruption to ≤ ${params.requiredCorruption}% to unlock this item.`,
      statusCode: 403,
    };
  }

  if (params.credits < params.itemPrice) {
    return {
      eligible: false,
      reason: `Insufficient Credits (◈). You need ${params.itemPrice} Credits but have ${params.credits}.`,
      statusCode: 400,
    };
  }

  return { eligible: true };
}
