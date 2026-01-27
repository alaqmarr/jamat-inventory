import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // users, events, inventory, logs, ledger, master
    const format = searchParams.get("format") || "json"; // json, excel

    const data: any = {};

    // Helper to fetch RTDB logs
    const fetchLogs = async (filterForLedger = false) => {
      const snap = await rtdb.ref("logs").once("value");
      const logs: any[] = [];
      snap.forEach((child) => {
        const log = { id: child.key, ...child.val() };
        if (filterForLedger) {
          const ledgerActions = [
            "INVENTORY_ADDED",
            "INVENTORY_REMOVED",
            "INVENTORY_RETURNED",
            "INVENTORY_LOSS",
          ];
          if (ledgerActions.includes(log.action)) {
            logs.push(log);
          }
        } else {
          logs.push(log);
        }
      });
      return logs;
    };

    // Fetch Data based on type
    if (type === "users" || type === "master") {
      data.users = await prisma.user.findMany();
    }
    if (type === "events" || type === "master") {
      data.events = await prisma.event.findMany();
    }
    if (type === "inventory" || type === "master") {
      data.inventory = await prisma.inventoryItem.findMany();
    }
    if (type === "logs" || type === "master") {
      data.logs = await fetchLogs(false);
    }
    if (type === "ledger") {
      data.ledger = await fetchLogs(true);
    }
    if (type === "settings" || type === "master") {
      const [halls, caterers] = await Promise.all([
        prisma.hall.findMany(),
        prisma.caterer.findMany(),
      ]);
      data.settings = {
        halls: halls.map((h) => h.name),
        caterers: caterers.map((c) => ({ name: c.name, phone: c.phone })),
      };
    }

    // Return JSON
    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="jamaat_export_${type}_${Date.now()}.json"`,
        },
      });
    }

    // Return Excel
    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      Object.keys(data).forEach((key) => {
        const sheetData = Array.isArray(data[key]) ? data[key] : [data[key]];
        // Flatten objects for Excel if needed
        const cleanedData = sheetData.map((item: any) => {
          const newItem = { ...item };
          Object.keys(newItem).forEach((k) => {
            if (typeof newItem[k] === "object" && newItem[k] !== null) {
              newItem[k] = JSON.stringify(newItem[k]);
            }
          });
          return newItem;
        });

        const ws = XLSX.utils.json_to_sheet(cleanedData);
        XLSX.utils.book_append_sheet(wb, ws, key);
      });

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="jamaat_export_${type}_${Date.now()}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
