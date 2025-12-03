import { NextResponse } from "next/server";
import { db, rtdb } from "@/lib/firebase";
import { Event } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occasionDate, occasionTime, hall } = body; // hall is string | string[]

    if (!occasionDate || !occasionTime || !hall) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Get Config
    const configSnapshot = await rtdb.ref("config/bookingWindow").once("value");
    const windowMinutes = configSnapshot.val() || 60;

    // 2. Parse Proposed Time
    const proposedDate = new Date(occasionDate);
    // occasionTime is "HH:mm"
    const [hours, minutes] = occasionTime.split(":").map(Number);
    const proposedStart = new Date(proposedDate);
    proposedStart.setHours(hours, minutes, 0, 0);

    const proposedEnd = new Date(
      proposedStart.getTime() + windowMinutes * 60000
    );

    // 3. Query Events for the same day
    const startOfDay = new Date(proposedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(proposedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await db
      .collection("events")
      .where("occasionDate", ">=", startOfDay.toISOString())
      .where("occasionDate", "<=", endOfDay.toISOString())
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];

    // 4. Check Conflicts
    let conflictType: "none" | "hard" | "soft" = "none";
    let conflictMessage = "";

    for (const event of events) {
      // Parse Existing Event Time
      const eventDate = new Date(event.occasionDate);
      // Assuming event.occasionTime is also "HH:mm"
      const [eHours, eMinutes] = event.occasionTime.split(":").map(Number);
      const eventStart = new Date(eventDate); // Use event's date (should be same day)
      eventStart.setHours(eHours, eMinutes, 0, 0);

      const eventEnd = new Date(eventStart.getTime() + windowMinutes * 60000);

      // Check Overlap
      // Overlap if (StartA < EndB) and (EndA > StartB)
      const isOverlap = proposedStart < eventEnd && proposedEnd > eventStart;

      if (isOverlap) {
        // Check Hall Overlap
        const proposedHalls = Array.isArray(hall) ? hall : [hall];
        const eventHalls = Array.isArray(event.hall)
          ? event.hall
          : [event.hall];

        const hasCommonHall = proposedHalls.some((h) => eventHalls.includes(h));

        if (hasCommonHall) {
          conflictType = "hard";
          conflictMessage = `Hall '${proposedHalls.find((h) =>
            eventHalls.includes(h)
          )}' is already booked by ${event.name} at ${event.occasionTime}.`;
          break; // Hard conflict stops everything
        } else {
          // Time overlap but different hall -> Soft conflict
          // We only set soft if we haven't found a hard conflict yet (which we haven't, or we'd have broken)
          // But we might want to keep the *first* soft conflict message or overwrite?
          // Let's overwrite for now, or keep first.
          if (conflictType === "none") {
            conflictType = "soft";
            conflictMessage = `Another event (${event.name}) is scheduled at ${event.occasionTime} in a different hall.`;
          }
        }
      }
    }

    return NextResponse.json({ conflictType, conflictMessage });
  } catch (error) {
    console.error("Conflict check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
