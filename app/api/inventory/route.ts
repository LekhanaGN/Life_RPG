import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * GET /api/inventory
 * Returns player's personal inventory sorted by rarity and acquisition.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Access denied to survivor locker." },
        { status: 401 }
      );
    }

    const [inventory, character] = await Promise.all([
      db.findInventoryByUserId(session.userId),
      db.findCharacterByUserId(session.userId),
    ]);

    return NextResponse.json(
      {
        success: true,
        credits: character?.credits || 0,
        inventory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Inventory Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load survivor inventory locker." },
      { status: 500 }
    );
  }
}
