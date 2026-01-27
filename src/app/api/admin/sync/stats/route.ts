import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parallel fetch for speed
    const [
      prismaUsers,
      prismaEvents,
      prismaInventory,
      prismaHalls,
      prismaCaterers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.inventoryItem.count(),
      prisma.hall.count(),
      prisma.caterer.count(),
    ]);

    // Firestore Counts using Aggregation (efficient)
    const [fsUsers, fsEvents, fsInventory] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("events").count().get(),
      db.collection("inventory").count().get(),
    ]);

    // Master Data in Firestore is commonly a single doc 'settings/masterData' with arrays
    // So we need to fetch that doc to count halls/caterers
    const masterDoc = await db.collection("settings").doc("masterData").get();
    const masterData = masterDoc.data() || {};
    const fsHalls = Array.isArray(masterData.halls)
      ? masterData.halls.length
      : 0;
    const fsCaterers = Array.isArray(masterData.caterers)
      ? masterData.caterers.length
      : 0;

    return NextResponse.json({
      neon: {
        users: prismaUsers,
        events: prismaEvents,
        inventory: prismaInventory,
        halls: prismaHalls,
        caterers: prismaCaterers,
      },
      firestore: {
        users: fsUsers.data().count,
        events: fsEvents.data().count,
        inventory: fsInventory.data().count,
        halls: fsHalls,
        caterers: fsCaterers,
      },
    });
  } catch (error) {
    console.error("Sync stats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
