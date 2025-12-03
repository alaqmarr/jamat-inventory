import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/logger";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const eventId = params.id;
    const body = await req.json();
    const { itemId, quantity, action } = body; // action: 'ISSUE' | 'RETURN' | 'LOSS'

    if (!itemId || !quantity || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const itemRef = db.collection("inventory").doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const itemData = itemDoc.data() as InventoryItem;
    let newAvailable = itemData.availableQuantity;

    // Calculate new available quantity
    if (action === "ISSUE") {
      if (newAvailable < quantity) {
        return NextResponse.json(
          { error: "Insufficient stock" },
          { status: 400 }
        );
      }
      newAvailable -= quantity;
    } else if (action === "RETURN") {
      newAvailable += quantity;
    }
    // For LOSS, we don't change available if it was already issued.
    // If we are reporting loss from *stock* (not issued), then we reduce available.
    // But usually loss is reported after issue.
    // Let's assume LOSS means "It was issued, but now it's gone".
    // So we don't return it to available.
    // However, we should probably update the total quantity to reflect the permanent loss.

    await db.runTransaction(async (t) => {
      const updates: any = { availableQuantity: newAvailable };

      if (action === "LOSS") {
        updates.totalQuantity = (itemData.totalQuantity || 0) - quantity;
      }

      t.update(itemRef, updates);
    });

    // Log the action to RTDB
    await logAction(
      action === "ISSUE"
        ? "INVENTORY_REMOVED"
        : action === "RETURN"
        ? "INVENTORY_RETURNED"
        : "INVENTORY_LOSS",
      {
        eventId,
        itemId,
        itemName: itemData.name,
        quantity,
        action,
        newBalance: newAvailable,
      },
      {
        id: session.user.id || "unknown",
        name: session.user.name || "Unknown User",
      }
    );

    // Send email to admins for LOSS
    if (action === "LOSS") {
      try {
        const adminsSnapshot = await db
          .collection("users")
          .where("role", "==", "ADMIN")
          .get();
        const adminEmails = adminsSnapshot.docs.map((doc) => doc.data().email);

        if (adminEmails.length > 0) {
          const { inventoryUpdateTemplate, sendEmail } = await import(
            "@/lib/email"
          );
          await sendEmail({
            to: adminEmails,
            subject: `ALERT: Inventory LOSS Reported - ${itemData.name}`,
            html: inventoryUpdateTemplate({
              userName: session.user.name || "Unknown",
              itemName: itemData.name,
              quantity,
              action,
              eventId,
              newBalance: newAvailable,
            }),
          });
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return NextResponse.json({ success: true, newAvailable });
  } catch (error) {
    console.error("Event inventory update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
