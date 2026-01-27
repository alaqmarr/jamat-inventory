import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 },
      );
    }

    // Transform items for Prisma
    const prismaItems = items.map((item: any) => ({
      name: item.name,
      category: item.category,
      totalQuantity: Number(item.totalQuantity),
      availableQuantity: Number(item.totalQuantity),
      unit: item.unit,
    }));

    const result = await prisma.inventoryItem.createMany({
      data: prismaItems,
    });

    return NextResponse.json({
      message: "Bulk upload successful",
      count: result.count,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
