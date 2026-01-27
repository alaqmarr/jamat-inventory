import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";
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
    await prisma.event.deleteMany({});

    // 2. Delete All Inventory
    await prisma.inventoryItem.deleteMany({});

    // 3. Delete All Users (Except Current Admin)
    await prisma.user.deleteMany({
      where: {
        id: {
          not: currentUserId,
        },
      },
    });

    // 3b. Delete Settings (Halls/Caterers) - Reset to clean state?
    // Maybe keep them? The original implementation didn't seem to reset settings explicitly
    // but the restore function overwrites them.
    // Let's assume reset wipes core data but settings might ideally stay?
    // Original code: Didn't explicitly delete "settings" collection in the reset script shown above (lines 20-45).
    // It only deleted events, inventory, and users.
    // So I will stick to that.

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
      { status: 500 },
    );
  }
}
