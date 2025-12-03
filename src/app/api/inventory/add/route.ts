import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, totalQuantity, unit } = body;

    if (!name || !category || totalQuantity === undefined || !unit) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newItem: Omit<InventoryItem, "id"> = {
      name,
      category,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity),
      unit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("inventory").add(newItem);

    return NextResponse.json({
      success: true,
      item: { id: docRef.id, ...newItem },
    });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
