import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/logger";
import { rtdb } from "@/lib/firebase"; // Keep for RTDB logs if logAction uses it
import { InventoryItem } from "@/generated/prisma/client";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (
      !session?.user ||
      (userRole !== "ADMIN" && userRole !== "MANAGER" && userRole !== "STAFF")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const eventId = params.id;
    const body = await req.json();
    const { itemId, quantity, action } = body; // action: 'ISSUE' | 'RETURN' | 'LOSS'

    if (!itemId || !quantity || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      let newAvailable = item.availableQuantity;
      let newTotal = item.totalQuantity;

      // Calculate new available quantity
      if (action === "ISSUE") {
        if (newAvailable < quantity) {
          throw new Error("Insufficient stock");
        }
        newAvailable -= quantity;
      } else if (action === "RETURN") {
        newAvailable += quantity;
        // Prevent returning more than total? Assuming logic holds.
        if (newAvailable > newTotal) {
          // Safe guard:
          newAvailable = Math.min(newAvailable, newTotal);
        }
      } else if (action === "FOUND") {
        // Recovered item: Adds back to Total (undo loss) AND Available (back in stock)
        newTotal += quantity;
        newAvailable += quantity;
      }

      // Handle LOSS (Permanent reduction)
      if (action === "LOSS") {
        // Logic: If lost, it's removed from Total.
        // If it was "Issued" then "Lost", it doesn't return to Available.
        // If it was "Available" then "Lost", it reduces Available.
        // Usually this API implies dealing with *issued* items for an event?
        // Or generic changes? The code before "LOSS" reduced `totalQuantity`.
        // And "LOSS" didn't change `available`?
        // Previous code: `updates.totalQuantity = ... - quantity`.
        // And `newAvailable` was calculated based on ISSUE/RETURN logic ONLY.
        // So if action is LOSS, we reduce Total. Does it affect Available?
        // If I lose an item from the shelf, Available goes down.
        // If I lose an item that was issued, Available is ALREADY down.
        // Let's assume this is reporting loss linked to an event (issued item lost).
        // So Available stays down (don't return it), and Total goes down.

        newTotal -= quantity;
        // Ensure we don't end up with Total < Available (impossible if we don't touch available, but safer)
        if (newTotal < newAvailable) {
          newAvailable = newTotal;
        }
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          availableQuantity: newAvailable,
          totalQuantity: newTotal,
        },
      });

      return updatedItem;
    });

    // Logging (Side Effect outside transaction to not block/fail data integrity if log fails, or keep inside?)
    // Keeping inside is safer but logAction might be slow. Outside is standard for non-critical logs.

    // Determine log action name
    let logActionType: any = "SYSTEM_ACTION";
    if (action === "ISSUE") logActionType = "INVENTORY_REMOVED";
    else if (action === "RETURN" || action === "FOUND")
      logActionType = "INVENTORY_RETURNED";
    else if (action === "LOSS") logActionType = "INVENTORY_LOSS";

    await logAction(
      logActionType,
      {
        eventId,
        itemId,
        itemName: result.name,
        quantity,
        action,
        newBalance: result.availableQuantity,
      },
      {
        id: (session.user as any).id || "unknown",
        name: session.user.name || "Unknown User",
      },
    );

    // Send email to admins for LOSS (Async, don't await blocking response)
    if (action === "LOSS") {
      // ... Reimplement email logic if needed, or skip for now if simplified
      // The original code imported from "@/lib/email".
      // Preserving it:
      try {
        // We can use prisma to find admins
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
        const adminEmails = admins
          .map((u) => u.email)
          .filter(Boolean) as string[];

        if (adminEmails.length > 0) {
          const { inventoryUpdateTemplate, sendEmail } =
            await import("@/lib/email");
          await sendEmail({
            to: adminEmails,
            subject: `ALERT: Inventory LOSS Reported - ${result.name}`,
            html: inventoryUpdateTemplate({
              userName: session.user.name || "Unknown",
              itemName: result.name,
              quantity,
              action,
              eventId,
              newBalance: result.availableQuantity,
            }),
          });
        }
      } catch (e) {
        console.error("Email failed", e);
      }
    }

    return NextResponse.json({
      success: true,
      newAvailable: result.availableQuantity,
    });
  } catch (error: any) {
    console.error("Event inventory update error:", error);
    const msg =
      error.message === "Insufficient stock" ||
      error.message === "Item not found"
        ? error.message
        : "Internal Server Error";
    const status =
      error.message === "Insufficient stock" ||
      error.message === "Item not found"
        ? 400
        : 500;

    return NextResponse.json({ error: msg }, { status });
  }
}
