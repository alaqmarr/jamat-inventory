import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { Event, InventoryLog } from "@/types";

export const generateEventManifest = (event: Event, logs: InventoryLog[]) => {
  const doc = new jsPDF();

  // -- Header --
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Event Manifest", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${format(new Date(), "PPP p")}`, 14, 26);

  // -- Event Details Box --
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(14, 32, 182, 45, 3, 3, "FD");

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Event Details", 20, 42);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  // Left Column
  doc.text(`Name: ${event.name}`, 20, 50);
  doc.text(`Mobile: ${event.mobile}`, 20, 56);
  doc.text(`Date: ${format(new Date(event.occasionDate), "PPP")}`, 20, 62);
  doc.text(`Time: ${event.occasionTime}`, 20, 68);

  // Right Column
  doc.text(
    `Hall: ${Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}`,
    110,
    50,
  );
  doc.text(`Thaal Count: ${event.thaalCount}`, 110, 56);
  doc.text(`Caterer: ${event.catererName || "N/A"}`, 110, 62);
  doc.text(`Status: ${event.status}`, 110, 68);

  // -- Inventory Table --
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Assigned Inventory", 14, 90);

  // Aggregate logs by item
  const itemStats = itemsFromLogs(logs);

  const tableData = itemStats.map((stat) => [
    stat.name,
    stat.issued.toString(),
    stat.returned > 0 ? stat.returned.toString() : "-",
    stat.deficit === 0 ? "Returned" : `Pending (${stat.deficit})`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [["Item Name", "Issued", "Returned", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600
    alternateRowStyles: { fillColor: [249, 250, 251] }, // Slate-50
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // -- Signature Section --
  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  doc.setDrawColor(150, 150, 150);
  doc.line(14, finalY + 40, 80, finalY + 40); // Line 1
  doc.line(116, finalY + 40, 182, finalY + 40); // Line 2

  doc.setFontSize(10);
  doc.text("Authorized Signature", 14, finalY + 46);
  doc.text("Receiver Signature", 116, finalY + 46);

  // Save
  const fileName = `Manifest_${event.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
};

function itemsFromLogs(logs: InventoryLog[]) {
  const itemMap = new Map<
    string,
    { name: string; issued: number; returned: number; lost: number }
  >();

  logs.forEach((log) => {
    if (!itemMap.has(log.itemId)) {
      itemMap.set(log.itemId, {
        name: log.itemName,
        issued: 0,
        returned: 0,
        lost: 0,
      });
    }
    const entry = itemMap.get(log.itemId)!;
    if (log.action === "ISSUE") entry.issued += log.quantity;
    if (log.action === "RETURN") entry.returned += log.quantity;
    if (log.action === "LOSS") entry.lost += log.quantity;
  });

  return Array.from(itemMap.values()).map((entry) => ({
    ...entry,
    deficit: entry.issued - entry.returned - entry.lost,
  }));
}
