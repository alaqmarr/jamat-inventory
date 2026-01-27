import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { prisma } from "@/lib/db";
import { Role, ProfileStatus } from "@/generated/prisma/client";

// Increase duration for sync operation
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collections } = await req.json(); // ['users', 'events', 'inventory', 'settings']
    const results: any = {};

    // 1. Sync Users
    if (collections.includes("users")) {
      const snap = await db.collection("users").get();
      let count = 0;
      for (const doc of snap.docs) {
        const u = doc.data();
        if (!u.username) continue;

        await prisma.user.upsert({
          where: { username: u.username },
          update: {
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            role: (u.role as Role) || "STAFF",
            profileStatus: (u.profileStatus as ProfileStatus) || "COMPLETED",
            password: u.password || "legacy_hash", // Keep legacy or default
          },
          create: {
            id: u.uid || doc.id,
            username: u.username,
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            role: (u.role as Role) || "STAFF",
            profileStatus: (u.profileStatus as ProfileStatus) || "COMPLETED",
            password: u.password || "legacy_hash",
            createdAt: u.createdAt
              ? new Date(
                  u.createdAt.toDate ? u.createdAt.toDate() : u.createdAt,
                )
              : new Date(),
          },
        });
        count++;
      }
      results.users = count;
    }

    // 2. Sync Events
    if (collections.includes("events")) {
      const snap = await db.collection("events").get();
      let count = 0;
      for (const doc of snap.docs) {
        const e = doc.data();
        await prisma.event.upsert({
          where: { id: doc.id },
          update: {
            name: e.name,
            mobile: e.mobile,
            email: e.email,
            occasionDate: new Date(e.occasionDate),
            occasionDay: e.occasionDay,
            occasionTime: e.occasionTime,
            description: e.description || "",
            hall: Array.isArray(e.hall) ? e.hall : [e.hall].filter(Boolean),
            catererName: e.catererName || "",
            catererPhone: e.catererPhone || "",
            thaalCount: Number(e.thaalCount || 0),
            sarkariThaalSet: Number(e.sarkariThaalSet || 0),
            bhaiSaabIzzan: Boolean(e.bhaiSaabIzzan),
            benSaabIzzan: Boolean(e.benSaabIzzan),
            extraChilamchiLota: Number(e.extraChilamchiLota || 0),
            tablesAndChairs: Number(e.tablesAndChairs || 0),
            mic: Boolean(e.mic),
            crockeryRequired: Boolean(e.crockeryRequired),
            thaalForDevri: Boolean(e.thaalForDevri),
            paat: Boolean(e.paat),
            masjidLight: Boolean(e.masjidLight),
            crockeryStatus: e.crockeryStatus || "NOT_REQUIRED",
            acStartTime: e.acStartTime,
            partyTime: e.partyTime,
            decorations: Boolean(e.decorations),
            gasCount: Number(e.gasCount || 0),
            menu: e.menu,
            status: e.status || "BOOKED",
          },
          create: {
            id: doc.id,
            name: e.name,
            mobile: e.mobile,
            email: e.email,
            occasionDate: new Date(e.occasionDate),
            occasionDay: e.occasionDay,
            occasionTime: e.occasionTime,
            description: e.description || "",
            hall: Array.isArray(e.hall) ? e.hall : [e.hall].filter(Boolean),
            catererName: e.catererName || "",
            catererPhone: e.catererPhone || "",
            thaalCount: Number(e.thaalCount || 0),
            sarkariThaalSet: Number(e.sarkariThaalSet || 0),
            bhaiSaabIzzan: Boolean(e.bhaiSaabIzzan),
            benSaabIzzan: Boolean(e.benSaabIzzan),
            extraChilamchiLota: Number(e.extraChilamchiLota || 0),
            tablesAndChairs: Number(e.tablesAndChairs || 0),
            mic: Boolean(e.mic),
            crockeryRequired: Boolean(e.crockeryRequired),
            thaalForDevri: Boolean(e.thaalForDevri),
            paat: Boolean(e.paat),
            masjidLight: Boolean(e.masjidLight),
            crockeryStatus: e.crockeryStatus || "NOT_REQUIRED",
            acStartTime: e.acStartTime,
            partyTime: e.partyTime,
            decorations: Boolean(e.decorations),
            gasCount: Number(e.gasCount || 0),
            menu: e.menu,
            status: e.status || "BOOKED",
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          },
        });
        count++;
      }
      results.events = count;
    }

    // 3. Sync Inventory
    if (collections.includes("inventory")) {
      const snap = await db.collection("inventory").get();
      let count = 0;
      for (const doc of snap.docs) {
        const i = doc.data();
        await prisma.inventoryItem.upsert({
          where: { id: doc.id },
          update: {
            name: i.name,
            category: i.category,
            totalQuantity: Number(i.totalQuantity),
            availableQuantity: Number(i.availableQuantity),
            unit: i.unit || "pcs",
          },
          create: {
            id: doc.id,
            name: i.name,
            category: i.category,
            totalQuantity: Number(i.totalQuantity),
            availableQuantity: Number(i.availableQuantity),
            unit: i.unit || "pcs",
          },
        });
        count++;
      }
      results.inventory = count;
    }

    // 4. Sync Settings
    if (collections.includes("settings")) {
      const doc = await db.collection("settings").doc("masterData").get();
      if (doc.exists) {
        const data = doc.data() || {};

        // Halls
        if (data.halls && Array.isArray(data.halls)) {
          let hCount = 0;
          for (const h of data.halls) {
            const name = typeof h === "string" ? h : h.name;
            if (name) {
              await prisma.hall.upsert({
                where: { name },
                update: {},
                create: { name },
              });
              hCount++;
            }
          }
          results.halls = hCount;
        }

        // Caterers
        if (data.caterers && Array.isArray(data.caterers)) {
          let cCount = 0;
          for (const c of data.caterers) {
            const name = typeof c === "string" ? c : c.name;
            const phone = typeof c === "object" ? c.phone : "";
            if (name) {
              await prisma.caterer.upsert({
                where: { name },
                update: { phone },
                create: { name, phone },
              });
              cCount++;
            }
          }
          results.caterers = cCount;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Sync Firestore=>Neon Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
