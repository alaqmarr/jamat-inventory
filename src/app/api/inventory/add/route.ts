import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
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
