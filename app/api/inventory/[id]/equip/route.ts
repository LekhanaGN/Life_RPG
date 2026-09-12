import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/inventory/[id]/equip
 * Equips an inventory item into its designated slot.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: inventoryItemId } = await params;
    if (!inventoryItemId) {
      return NextResponse.json(
        { success: false, error: "Inventory item ID required." },
        { status: 400 }
      );
    }

    const result = await db.equipInventoryItem(session.userId, inventoryItemId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to equip item." },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item equipped to gear slot.",
        equippedItem: result.equippedItem,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Equip Error]:", error);
    return NextResponse.json(
      { success: false, error: "Equipment matrix synchronization failure." },
      { status: 500 }
    );
  }
}
