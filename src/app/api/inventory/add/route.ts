import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkComponentAccess } from "@/lib/rbac-server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check inventory-module access (ADMIN bypasses)
    const hasAccess = await checkComponentAccess("inventory-module");
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - No inventory access" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, category, totalQuantity, unit } = body;

    if (!name || !category || totalQuantity === undefined || !unit) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        totalQuantity: Number(totalQuantity),
        availableQuantity: Number(totalQuantity),
        unit,
      },
    });

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
