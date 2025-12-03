import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 }
      );
    }

    const batch = db.batch();
    const inventoryRef = db.collection("inventory");

    items.forEach((item: any) => {
      const docRef = inventoryRef.doc();
      const newItem: Omit<InventoryItem, "id"> = {
        name: item.name,
        category: item.category,
        totalQuantity: Number(item.totalQuantity),
        availableQuantity: Number(item.totalQuantity), // Initially all available
        unit: item.unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(docRef, newItem);
    });

    await batch.commit();

    return NextResponse.json({
      message: "Bulk upload successful",
      count: items.length,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
