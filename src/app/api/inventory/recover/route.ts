import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quantity, eventId, logId } = await req.json();

    if (!itemId || !quantity || !logId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = session.user as any;

    // 1. Update Prisma Inventory (Add back stock) via transaction
    try {
      await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
          where: { id: itemId },
        });

        if (!item) {
          throw new Error("Item not found");
        }

        await tx.inventoryItem.update({
          where: { id: itemId },
          data: {
            totalQuantity: { increment: quantity },
            availableQuantity: { increment: quantity },
          },
        });
      });
    } catch (err: any) {
      if (err.message === "Item not found") {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      throw err;
    }

    // 2. Update RTDB Log (Handle Partial Recovery)
    const logRef = rtdb.ref(`logs/${logId}`);

    await logRef.transaction((currentLog) => {
      if (currentLog) {
        const originalQty = currentLog.details?.quantity || 0;
        const previousRecovered = currentLog.recoveredQuantity || 0;
        const newRecovered = previousRecovered + quantity;

        // Update recovered count
        currentLog.recoveredQuantity = newRecovered;

        // Check if fully recovered
        if (newRecovered >= originalQty) {
          currentLog.isRecovered = true;
        } else {
          // Ensure isRecovered is false if still partial
          currentLog.isRecovered = false;
        }

        return currentLog;
      }
      return currentLog; // Abort if log doesn't exist
    });

    // 3. Log the recovery action
    // Need item name for log
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { name: true },
    });

    await logAction(
      "INVENTORY_RETURNED",
      {
        eventId: eventId || "manual_recovery",
        itemId,
        itemName: item?.name || "Unknown Item",
        quantity,
        recoveredFromLogId: logId,
        note: `Recovered ${quantity} from Lost Items`,
      },
      {
        id: user.id || "unknown",
        name: user.name || "Unknown User",
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recovery error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
