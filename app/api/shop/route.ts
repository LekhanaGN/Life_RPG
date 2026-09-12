import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

/**
 * GET /api/shop
 * Returns available Arcade catalog items with current user's credits and unlock status.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Access denied to The Arcade. Unauthenticated." },
        { status: 401 }
      );
    }

    const { items, credits, corruption } = await db.findShopItems(session.userId);

    return NextResponse.json(
      {
        success: true,
        credits,
        corruption,
        items,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Shop Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load Arcade terminal archives." },
      { status: 500 }
    );
  }
}
