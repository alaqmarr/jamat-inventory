import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";
import { Role, ProfileStatus, CrockeryStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let data: any = {};

    // Determine format and parse
    if (file.name.endsWith(".json")) {
      const text = new TextDecoder().decode(buffer);
      data = JSON.parse(text);
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const wb = XLSX.read(buffer, { type: "array" });
      wb.SheetNames.forEach((sheetName) => {
        const rawData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        // Parse JSON strings back to objects if needed
        data[sheetName] = rawData.map((item: any) => {
          const newItem = { ...item };
          Object.keys(newItem).forEach((k) => {
            try {
              if (
                typeof newItem[k] === "string" &&
                (newItem[k].startsWith("{") || newItem[k].startsWith("["))
              ) {
                newItem[k] = JSON.parse(newItem[k]);
              }
            } catch (e) {
              // Ignore parse errors, keep as string
            }
          });
          return newItem;
        });
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 },
      );
    }

    // Helper: Restore Users
    const restoreUsers = async (items: any[]) => {
      for (const item of items) {
        if (!item.username) continue;
        await prisma.user.upsert({
          where: { username: item.username },
          update: {
            name: item.name,
            email: item.email,
            password: item.password,
            role: item.role as Role,
            mobile: item.mobile,
            profileStatus: item.profileStatus as ProfileStatus,
          },
          create: {
            username: item.username,
            name: item.name,
            email: item.email,
            password: item.password,
            role: item.role as Role,
            mobile: item.mobile,
            profileStatus: item.profileStatus as ProfileStatus,
          },
        });
      }
    };

    // Helper: Restore Events
    const restoreEvents = async (items: any[]) => {
      for (const item of items) {
        const eventId = item.id || item.uid;
        if (!eventId) continue;

        const { id, uid, ...eventData } = item;
        // Fix date format
        const occasionDate = new Date(eventData.occasionDate);

        await prisma.event.upsert({
          where: { id: eventId },
          update: {
            ...eventData,
            occasionDate,
          },
          create: {
            id: eventId,
            ...eventData,
            occasionDate,
          },
        });
      }
    };

    // Helper: Restore Inventory
    const restoreInventory = async (items: any[]) => {
      for (const item of items) {
        const itemId = item.id;
        if (!itemId) continue;

        const { id, ...invData } = item;
        await prisma.inventoryItem.upsert({
          where: { id: itemId },
          update: {
            ...invData,
            totalQuantity: Number(invData.totalQuantity),
            availableQuantity: Number(invData.availableQuantity),
          },
          create: {
            id: itemId,
            ...invData,
            totalQuantity: Number(invData.totalQuantity),
            availableQuantity: Number(invData.availableQuantity),
          },
        });
      }
    };

    // Helper: Restore Settings (Halls & Caterers)
    const restoreSettings = async (settingsData: any) => {
      if (!settingsData) return;
      const dataToRestore = Array.isArray(settingsData)
        ? settingsData[0]
        : settingsData;

      if (dataToRestore.halls && Array.isArray(dataToRestore.halls)) {
        for (const hall of dataToRestore.halls) {
          const name = typeof hall === "string" ? hall : hall.name;
          if (name) {
            await prisma.hall.upsert({
              where: { name },
              update: {},
              create: { name },
            });
          }
        }
      }

      if (dataToRestore.caterers && Array.isArray(dataToRestore.caterers)) {
        for (const caterer of dataToRestore.caterers) {
          const name = typeof caterer === "string" ? caterer : caterer.name;
          const phone = typeof caterer === "object" ? caterer.phone : "";

          if (name) {
            await prisma.caterer.upsert({
              where: { name },
              update: { phone },
              create: { name, phone },
            });
          }
        }
      }
    };

    const restoreLogs = async (items: any[]) => {
      if (!items || !Array.isArray(items)) return;
      const updates: any = {};
      items.forEach((item) => {
        if (item.id) {
          const { id, ...logData } = item;
          updates[`logs/${id}`] = logData;
        }
      });
      if (Object.keys(updates).length > 0) {
        await rtdb.ref().update(updates);
      }
    };

    // Execute Restores
    if (data.users && Array.isArray(data.users)) await restoreUsers(data.users);
    if (data.events && Array.isArray(data.events))
      await restoreEvents(data.events);
    if (data.inventory && Array.isArray(data.inventory))
      await restoreInventory(data.inventory);
    if (data.settings) await restoreSettings(data.settings);
    if (data.logs && Array.isArray(data.logs)) await restoreLogs(data.logs);

    return NextResponse.json({ success: true, message: "Restore completed" });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
