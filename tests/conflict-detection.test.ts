import { describe, it } from "node:test";
import assert from "node:assert";
import { parseISTEventDateTime } from "../src/lib/utils.ts";

describe("Conflict & Buffer Detection Logic", () => {
  const BUFFER_MINUTES = 120; // 2 hours
  const EVENT_DURATION_MINUTES = 60; // 1 hour default

  // Helper conflict evaluator modeling the check-conflict route logic
  function evaluateConflict(
    proposed: { date: string; time: string; hall: string | string[] },
    existing: { date: string; time: string; hall: string | string[]; name: string }[]
  ) {
    const proposedHalls = Array.isArray(proposed.hall) ? proposed.hall : [proposed.hall];
    const bypassHalls = ["na", "others", "house", "self"];
    if (proposedHalls.some((h) => bypassHalls.includes(h.toLowerCase().trim()))) {
      return { conflictType: "none", message: "" };
    }

    const proposedStart = parseISTEventDateTime(proposed.date, proposed.time);
    const proposedEnd = new Date(proposedStart.getTime() + EVENT_DURATION_MINUTES * 60000);
    const proposedEffectiveStart = new Date(proposedStart.getTime() - BUFFER_MINUTES * 60000);

    let conflictType: "none" | "soft" | "hard" = "none";
    let conflictMessage: string | null = null;

    for (const event of existing) {
      const eventHalls = Array.isArray(event.hall) ? event.hall : [event.hall];
      const commonHalls = proposedHalls.filter((h) => eventHalls.includes(h));
      if (commonHalls.length === 0) continue;

      const eventStart = parseISTEventDateTime(event.date, event.time);
      const eventEnd = new Date(eventStart.getTime() + EVENT_DURATION_MINUTES * 60000);
      const eventEffectiveStart = new Date(eventStart.getTime() - BUFFER_MINUTES * 60000);

      const isHardOverlap = proposedStart < eventEnd && proposedEnd > eventStart;
      const isBufferOverlap = proposedEffectiveStart < eventEnd && proposedEnd > eventEffectiveStart;

      if (isHardOverlap) {
        return {
          conflictType: "hard",
          message: `HARD CONFLICT: ${commonHalls.join(", ")} is booked by "${event.name}" (${event.time}).`,
        };
      } else if (isBufferOverlap && conflictType !== "hard") {
        conflictType = "soft";
        conflictMessage = `BUFFER CONFLICT: ${commonHalls.join(", ")} buffer overlaps with "${event.name}".`;
      }
    }

    return { conflictType, message: conflictMessage };
  }

  it("should detect HARD conflict when times directly overlap in the same hall", () => {
    const proposed = { date: "2026-03-15", time: "19:00", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "19:30", hall: "Maimoon Hall", name: "Ziafat" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "hard");
    assert.ok(result.message.includes("HARD CONFLICT"));
  });

  it("should detect SOFT buffer conflict within 2 hours before event start", () => {
    // Proposed: 19:00 (Buffer starts at 17:00)
    // Existing: 16:30 - 17:30 (Ends at 17:30, which overlaps with the 17:00-19:00 buffer window)
    const proposed = { date: "2026-03-15", time: "19:00", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "16:30", hall: "Maimoon Hall", name: "Majlis" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "soft");
    assert.ok(result.message.includes("BUFFER CONFLICT"));
  });

  it("should detect NO conflict when events are separated by more than 2 hours buffer", () => {
    // Proposed: 19:00 (Buffer starts at 17:00)
    // Existing: 14:00 - 15:00 (Ends at 15:00, safely clear of 17:00 buffer)
    const proposed = { date: "2026-03-15", time: "19:00", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "14:00", hall: "Maimoon Hall", name: "Lunch" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "none");
  });

  it("should detect NO conflict when different halls are booked at the same time", () => {
    const proposed = { date: "2026-03-15", time: "19:00", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "19:00", hall: "Qutbi Hall", name: "Dinner" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "none");
  });

  it("should bypass conflict checks for virtual locations (house, na, self, others)", () => {
    const proposed = { date: "2026-03-15", time: "19:00", hall: "house" };
    const existing = [
      { date: "2026-03-15", time: "19:00", hall: "house", name: "Private Gathering" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "none");
  });

  it("should accurately evaluate across 12-hour and 24-hour mixed time formats", () => {
    // Proposed in 12h: "07:00 PM"
    // Existing in 24h: "19:00"
    const proposed = { date: "2026-03-15", time: "07:00 PM", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "19:00", hall: "Maimoon Hall", name: "Overlapping Dinner" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "hard");
  });

  it("should correctly detect buffer conflicts spanning midnight", () => {
    // Proposed: 00:30 on March 16 (Buffer starts at 22:30 on March 15)
    // Existing: 22:00 - 23:00 on March 15 (Ends at 23:00 on March 15)
    const proposed = { date: "2026-03-16", time: "00:30", hall: "Maimoon Hall" };
    const existing = [
      { date: "2026-03-15", time: "22:00", hall: "Maimoon Hall", name: "Late Night Program" },
    ];

    const result = evaluateConflict(proposed, existing);
    assert.strictEqual(result.conflictType, "soft");
  });
});
