import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as firestore, rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // 1. Auth Check (Admin Only)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Verify Role from DB for security
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const userId = user.id;

    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    // 2. Verify OTP
    const otpDoc = await firestore.collection("otps").doc(userId).get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    const otpData = otpDoc.data();
    if (otpData?.otp !== otp) {
      // Increment attempts?
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (Date.now() > otpData?.expiresAt) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // OTP Verified - Delete OTP to prevent reuse
    await firestore.collection("otps").doc(userId).delete();

    // 3. Perform System Reset
    // Transactional Data Deletion

    // A. Delete All Events
    await prisma.event.deleteMany({});

    // B. Reset Inventory Available Quantities
    // We need to set availableQuantity = totalQuantity for ALL items.
    // This can be done via raw query or iteration. Iteration is safer for middleware but slower.
    // Raw query is faster: "UPDATE inventory_items SET availableQuantity = totalQuantity"
    // Prisma executeRaw is good here.
    // Note: If using SQLite/Postgres.
    await prisma.$executeRaw`UPDATE "inventory_items" SET "availableQuantity" = "totalQuantity"`;

    // C. Delete Firebase Logs
    // Deleting collections in Firestore is tricky (recurisve).
    // Use a recursive delete helper or just delete known paths.
    // Paths: 'logs', 'event_logs'.

    // Helper to delete collection
    const deleteCollection = async (
      collectionPath: string,
      batchSize: number = 50,
    ) => {
      const collectionRef = firestore.collection(collectionPath);
      const query = collectionRef.orderBy("__name__").limit(batchSize);

      return new Promise((resolve, reject) => {
        deleteQueryBatch(firestore, query, resolve).catch(reject);
      });
    };

    async function deleteQueryBatch(db: any, query: any, resolve: any) {
      const snapshot = await query.get();

      const batchSize = snapshot.size;
      if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
      });
    }

    await deleteCollection("logs");
    await deleteCollection("event_logs");
    await deleteCollection("events");

    // D. Delete Realtime Database Logs (Ledger)
    await rtdb.ref("logs").remove();
    await rtdb.ref("event_logs").remove();

    // Also delete any other transactional collections if they exist (e.g. notifications?)

    // 4. Audit Log
    await firestore.collection("logs").add({
      action: "SYSTEM_RESET",
      module: "SYSTEM",
      timestamp: new Date().toISOString(),
      details: {
        performedBy: session.user.name,
        userId: session.user.id,
      },
      searchable: `SYSTEM_RESET ${session.user.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "System reset complete",
    });
  } catch (error) {
    console.error("System Reset Failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
