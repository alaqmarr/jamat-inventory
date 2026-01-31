import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch from EventInventory where lostQty > recoveredQty (database as source of truth)
    const lostAllocations = await prisma.eventInventory.findMany({
      where: {
        lostQty: { gt: 0 },
      },
      include: {
        item: { select: { id: true, name: true } },
        event: { select: { id: true, name: true } },
      },
    });

    // Filter to only include items with remaining lost quantity
    const itemsWithLoss = lostAllocations
      .filter((alloc) => alloc.lostQty > alloc.recoveredQty)
      .map((alloc) => ({
        id: alloc.id,
        eventId: alloc.eventId,
        eventName: alloc.event.name,
        itemId: alloc.itemId,
        itemName: alloc.item.name,
        lostQty: alloc.lostQty,
        recoveredQty: alloc.recoveredQty,
        remainingQty: alloc.lostQty - alloc.recoveredQty,
        // For compatibility with existing client component:
        details: {
          itemId: alloc.itemId,
          quantity: alloc.lostQty,
          eventId: alloc.eventId,
          itemName: alloc.item.name,
        },
        remainingQuantity: alloc.lostQty - alloc.recoveredQty,
        userName: "System",
        timestamp: Date.now(),
        action: "INVENTORY_LOSS",
      }));

    // Sort by remaining quantity desc (most urgent first)
    itemsWithLoss.sort((a, b) => b.remainingQty - a.remainingQty);

    console.log(
      `[API] Found ${itemsWithLoss.length} lost item allocations from EventInventory`,
    );

    return NextResponse.json(itemsWithLoss);
  } catch (error) {
    console.error("Fetch lost items error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
