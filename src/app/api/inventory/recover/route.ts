import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/logger";
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

    const { itemId, quantity, eventId, logId } = await req.json();

    if (!itemId || !quantity || !logId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = session.user as any;

    // 1. Update Prisma Inventory (Add back stock) AND EventInventory via transaction
    let originalEventId: string | null = null;

    // First, fetch the original log to get the eventId
    const originalLogSnapshot = await rtdb.ref(`logs/${logId}`).once("value");
    const originalLog = originalLogSnapshot.val();
    originalEventId = originalLog?.details?.eventId || eventId || null;

    try {
      await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
          where: { id: itemId },
        });

        if (!item) {
          throw new Error("Item not found");
        }

        // Update main inventory stock
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: {
            totalQuantity: { increment: quantity },
            availableQuantity: { increment: quantity },
          },
        });

        // Update EventInventory record if this was an event-related loss
        if (originalEventId && originalEventId !== "manual_recovery") {
          await tx.eventInventory.updateMany({
            where: { eventId: originalEventId, itemId },
            data: { recoveredQty: { increment: quantity } },
          });
        }
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

    // 3. Log the recovery action (global recovery log)
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

    // 4. CRITICAL FIX: If original loss was for an event, create a RETURN log for that event
    // This ensures the Event Details page correctly reflects the recovered inventory
    if (eventId && eventId !== "manual_recovery") {
      // Fetch the original log to get event context
      const originalLogSnapshot = await rtdb.ref(`logs/${logId}`).once("value");
      const originalLog = originalLogSnapshot.val();

      if (originalLog?.details?.eventId) {
        // Create a RETURN log specifically for this event so getItemStats() sees it
        await logAction(
          "INVENTORY_RETURNED",
          {
            eventId: originalLog.details.eventId,
            itemId,
            itemName: item?.name || "Unknown Item",
            quantity,
            source: "RECOVERY_FROM_LOST",
            originalLossLogId: logId,
          },
          {
            id: user.id || "unknown",
            name: user.name || "Unknown User",
          },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recovery error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
