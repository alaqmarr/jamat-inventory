import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, rtdb } from "@/lib/firebase";
import * as XLSX from "xlsx";

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
        { status: 400 }
      );
    }

    // Restore Data
    const restoreCollection = async (col: string, items: any[]) => {
      if (!items || !Array.isArray(items)) return;
      const batch = db.batch();
      let count = 0;

      for (const item of items) {
        if (!item.id && !item.uid) continue; // Need an ID
        const id = item.id || item.uid;
        // Remove id from data to avoid duplication if it's in the body
        const { id: _, uid: __, ...docData } = item;

        const docRef = db.collection(col).doc(id);
        batch.set(docRef, docData, { merge: true });
        count++;

        // Commit batches of 500
        if (count >= 400) {
          await batch.commit();
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
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

    const restoreSettings = async (settingsData: any) => {
      if (!settingsData) return;
      // If it's an array (from Excel), take the first item or merge
      const dataToRestore = Array.isArray(settingsData)
        ? settingsData[0]
        : settingsData;
      await db
        .collection("settings")
        .doc("masterData")
        .set(dataToRestore, { merge: true });
    };

    // Execute Restores
    if (data.users) await restoreCollection("users", data.users);
    if (data.events) await restoreCollection("events", data.events);
    if (data.inventory) await restoreCollection("inventory", data.inventory);
    if (data.logs) await restoreLogs(data.logs);
    if (data.settings) await restoreSettings(data.settings);

    return NextResponse.json({ success: true, message: "Restore completed" });
  } catch (error) {
    console.error("Restore failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
