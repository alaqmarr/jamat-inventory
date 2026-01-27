import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { prisma } from "@/lib/db";

// Increase duration for sync operation
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collections } = await req.json();
    const results: any = {};
    const batchLimit = 400;

    const commitBatch = async (batch: any) => {
      await batch.commit();
      return db.batch(); // Return new batch
    };

    // 1. Sync Users
    if (collections.includes("users")) {
      const users = await prisma.user.findMany();
      let batch = db.batch();
      let count = 0;

      for (const u of users) {
        const ref = db.collection("users").doc(u.id);
        const data = {
          uid: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          mobile: u.mobile,
          role: u.role,
          profileStatus: u.profileStatus,
          password: u.password, // This will be the hashed password
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
        batch.set(ref, data, { merge: true });
        count++;
        if (count % batchLimit === 0) batch = await commitBatch(batch);
      }
      if (count % batchLimit !== 0) await batch.commit();
      results.users = count;
    }

    // 2. Sync Events
    if (collections.includes("events")) {
      const events = await prisma.event.findMany();
      let batch = db.batch();
      let count = 0;

      for (const e of events) {
        const ref = db.collection("events").doc(e.id);
        const data = {
          ...e,
          id: e.id,
          occasionDate: e.occasionDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        };
        batch.set(ref, data, { merge: true });
        count++;
        if (count % batchLimit === 0) batch = await commitBatch(batch);
      }
      if (count % batchLimit !== 0) await batch.commit();
      results.events = count;
    }

    // 3. Sync Inventory
    if (collections.includes("inventory")) {
      const items = await prisma.inventoryItem.findMany();
      let batch = db.batch();
      let count = 0;

      for (const i of items) {
        const ref = db.collection("inventory").doc(i.id);
        const data = {
          ...i,
          id: i.id,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        };
        batch.set(ref, data, { merge: true });
        count++;
        if (count % batchLimit === 0) batch = await commitBatch(batch);
      }
      if (count % batchLimit !== 0) await batch.commit();
      results.inventory = count;
    }

    // 4. Sync Settings
    if (collections.includes("settings")) {
      const [halls, caterers] = await Promise.all([
        prisma.hall.findMany(),
        prisma.caterer.findMany(),
      ]);

      const settingsRef = db.collection("settings").doc("masterData");
      await settingsRef.set(
        {
          halls: halls.map((h) => ({ id: h.id, name: h.name })),
          caterers: caterers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          })),
        },
        { merge: true },
      );

      results.settings = { halls: halls.length, caterers: caterers.length };
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Sync Neon=>Firestore Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
