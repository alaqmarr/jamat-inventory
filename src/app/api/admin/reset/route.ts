import { NextResponse } from "next/server";
import { db, rtdb, auth as adminAuth } from "@/lib/firebase";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Strict Admin Check
    const user = session?.user as any;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Delete All Events
    const eventsSnapshot = await db.collection("events").get();
    const eventBatch = db.batch();
    eventsSnapshot.docs.forEach((doc) => {
      eventBatch.delete(doc.ref);
    });
    await eventBatch.commit();

    // 2. Delete All Inventory
    const inventorySnapshot = await db.collection("inventory").get();
    const inventoryBatch = db.batch();
    inventorySnapshot.docs.forEach((doc) => {
      inventoryBatch.delete(doc.ref);
    });
    await inventoryBatch.commit();

    // 3. Delete All Users (Except Current Admin)
    const usersSnapshot = await db.collection("users").get();
    const usersBatch = db.batch();
    usersSnapshot.docs.forEach((doc) => {
      if (doc.id !== currentUserId) {
        usersBatch.delete(doc.ref);
      }
    });
    await usersBatch.commit();

    // 4. Wipe RTDB Logs
    await rtdb.ref("logs").remove();
    await rtdb.ref("event_logs").remove();

    return NextResponse.json({
      success: true,
      message: "System reset complete",
    });
  } catch (error) {
    console.error("System reset failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
