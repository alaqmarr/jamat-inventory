import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Fetch EventInventory allocations with item names
    const allocations = await prisma.eventInventory.findMany({
      where: { eventId },
      include: {
        item: { select: { name: true } },
      },
    });

    // Transform for client
    const result = allocations.map((alloc) => ({
      id: alloc.id,
      eventId: alloc.eventId,
      itemId: alloc.itemId,
      itemName: alloc.item.name,
      issuedQty: alloc.issuedQty,
      returnedQty: alloc.returnedQty,
      lostQty: alloc.lostQty,
      recoveredQty: alloc.recoveredQty,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching allocations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
