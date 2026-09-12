import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * POST /api/shop/purchase
 * Executes atomic purchase of an item from The Arcade.
 * Client sends ONLY: { itemId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Access denied. Session expired." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { itemId } = body;

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { success: false, error: "Item identifier required." },
        { status: 400 }
      );
    }

    const result = await db.purchaseItemTransaction(session.userId, itemId.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Purchase rejected." },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Acquired ${result.item?.name} from The Arcade.`,
        newBalance: result.newBalance,
        item: result.item,
        inventoryItem: result.inventoryItem,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Shop Purchase Error]:", error);
    return NextResponse.json(
      { success: false, error: "Arcade transaction dispenser error." },
      { status: 500 }
    );
  }
}
