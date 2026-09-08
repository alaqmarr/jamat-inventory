import { describe, it } from "node:test";
import assert from "node:assert";
import {
  formatIST,
  getISTDayBounds,
  parseISTEventDateTime,
  isEventLocked,
  getISTDate,
  IST_TIMEZONE,
} from "../src/lib/utils.ts";
import { getMisriDate } from "../src/lib/misri-calendar.ts";

/**
 * Adversarial Challenger 1 Test Suite
 * Comprehensive Stress-Testing: Timezones, Boundaries, Formats, and Conflict Intervals
 */

describe("Adversarial Stress Suite: Host Timezone Invariance & Boundary Rigor", () => {
  // ---------------------------------------------------------------------------
  // 1. Host Timezone Invariance
  // ---------------------------------------------------------------------------
  describe("Host Timezone Invariance", () => {
    it("should format dates identically regardless of server host timezone", () => {
      // Benchmark instant: 2026-03-14 18:30:00.000 UTC = 2026-03-15 00:00:00.000 IST
      const epochMs = 1773513000000;
      const dateObj = new Date(epochMs);
      const isoStr = "2026-03-14T18:30:00.000Z";

      assert.strictEqual(formatIST(epochMs, "yyyy-MM-dd HH:mm:ss"), "2026-03-15 00:00:00");
      assert.strictEqual(formatIST(dateObj, "yyyy-MM-dd HH:mm:ss"), "2026-03-15 00:00:00");
      assert.strictEqual(formatIST(isoStr, "yyyy-MM-dd HH:mm:ss"), "2026-03-15 00:00:00");
      assert.strictEqual(formatIST(dateObj, "EEEE"), "Sunday");
      assert.strictEqual(formatIST(dateObj, "yyyyMMdd"), "20260315");
    });

    it("should compute getISTDayBounds with absolute UTC precision across host environments", () => {
      // For any date in IST, startOfDay must be (Date.UTC(y, m, d) - 5.5h) and endOfDay = start + 24h - 1ms
      const testDates = ["2026-01-01", "2026-06-15", "2026-12-31"];

      for (const dateStr of testDates) {
        const { startOfDay, endOfDay } = getISTDayBounds(dateStr);

        // Verification 1: Span must be exactly 86,399,999 ms (24 hours - 1 ms)
        assert.strictEqual(
          endOfDay.getTime() - startOfDay.getTime(),
          86399999,
          `Span for ${dateStr} must be exactly 24h - 1ms`
        );

        // Verification 2: Formatted in IST, start must be 00:00:00.000 and end must be 23:59:59.999
        assert.strictEqual(formatIST(startOfDay, "yyyy-MM-dd HH:mm:ss.SSS"), `${dateStr} 00:00:00.000`);
        assert.strictEqual(formatIST(endOfDay, "yyyy-MM-dd HH:mm:ss.SSS"), `${dateStr} 23:59:59.999`);
      }
    });

    it("should parse IST event times to identical absolute UTC instants regardless of host TZ", () => {
      // 2026-07-20 at 19:30 IST
      // 19:30 IST - 5:30 = 14:00 UTC
      const parsed = parseISTEventDateTime("2026-07-20", "19:30");
      assert.strictEqual(parsed.toISOString(), "2026-07-20T14:00:00.000Z");

      // With 12-hour format: "07:30 PM"
      const parsed12 = parseISTEventDateTime("2026-07-20", "07:30 PM");
      assert.strictEqual(parsed12.toISOString(), "2026-07-20T14:00:00.000Z");
    });

    it("should compute Misri date anchored strictly to IST midnight, avoiding host midnight drift", () => {
      // 1 minute before IST midnight: 2026-03-14 18:29:00 UTC -> 2026-03-14 in IST
      const beforeMidnight = new Date("2026-03-14T18:29:00.000Z");
      const misriBefore = getMisriDate(beforeMidnight);

      // 1 minute after IST midnight: 2026-03-14 18:31:00 UTC -> 2026-03-15 in IST
      const afterMidnight = new Date("2026-03-14T18:31:00.000Z");
      const misriAfter = getMisriDate(afterMidnight);

      // Must advance by exactly 1 day in the Misri calendar
      assert.strictEqual(
        misriAfter.day - misriBefore.day === 1 || misriAfter.day === 1,
        true,
        "Misri calendar must advance day at IST midnight"
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Critical Boundary Dates
  // ---------------------------------------------------------------------------
  describe("Critical Boundary Dates (Leap Years, Month & Year Rollovers)", () => {
    it("should correctly handle leap year 2024-02-29 and 2028-02-29", () => {
      // 2024 is a leap year
      const leap2024 = getISTDayBounds("2024-02-29");
      assert.strictEqual(formatIST(leap2024.startOfDay, "yyyy-MM-dd"), "2024-02-29");
      assert.strictEqual(formatIST(leap2024.endOfDay, "yyyy-MM-dd"), "2024-02-29");
      assert.strictEqual(leap2024.startOfDay.toISOString(), "2024-02-28T18:30:00.000Z");
      assert.strictEqual(leap2024.endOfDay.toISOString(), "2024-02-29T18:29:59.999Z");

      // 2028 is a leap year
      const leap2028 = getISTDayBounds("2028-02-29");
      assert.strictEqual(formatIST(leap2028.startOfDay, "yyyy-MM-dd"), "2028-02-29");
      assert.strictEqual(leap2028.endOfDay.toISOString(), "2028-02-29T18:29:59.999Z");

      // Parse time on leap day
      const parsedLeapTime = parseISTEventDateTime("2024-02-29", "23:59");
      assert.strictEqual(formatIST(parsedLeapTime, "yyyy-MM-dd HH:mm"), "2024-02-29 23:59");
    });

    it("should maintain seamless continuity without gaps or overlaps across non-leap Feb 28 -> Mar 1", () => {
      // 2025 non-leap: Feb 28 -> March 1
      const feb28_2025 = getISTDayBounds("2025-02-28");
      const mar01_2025 = getISTDayBounds("2025-03-01");

      assert.strictEqual(
        feb28_2025.endOfDay.getTime() + 1,
        mar01_2025.startOfDay.getTime(),
        "Seamless millisecond continuity from 2025-02-28 23:59:59.999 to 2025-03-01 00:00:00.000"
      );

      // 2026 non-leap: Feb 28 -> March 1
      const feb28_2026 = getISTDayBounds("2026-02-28");
      const mar01_2026 = getISTDayBounds("2026-03-01");

      assert.strictEqual(
        feb28_2026.endOfDay.getTime() + 1,
        mar01_2026.startOfDay.getTime(),
        "Seamless millisecond continuity from 2026-02-28 23:59:59.999 to 2026-03-01 00:00:00.000"
      );
    });

    it("should maintain seamless continuity across 31-day and 30-day month boundaries", () => {
      // March 31 -> April 1
      const mar31 = getISTDayBounds("2026-03-31");
      const apr01 = getISTDayBounds("2026-04-01");
      assert.strictEqual(mar31.endOfDay.getTime() + 1, apr01.startOfDay.getTime());

      // April 30 -> May 1
      const apr30 = getISTDayBounds("2026-04-30");
      const may01 = getISTDayBounds("2026-05-01");
      assert.strictEqual(apr30.endOfDay.getTime() + 1, may01.startOfDay.getTime());
    });

    it("should correctly handle year rollover and prevent 1-year rollback across Dec 31 -> Jan 1", () => {
      // Dec 31 at 23:59 IST
      const dec31 = parseISTEventDateTime("2025-12-31", "23:59");
      assert.strictEqual(formatIST(dec31, "yyyy-MM-dd HH:mm"), "2025-12-31 23:59");
      assert.strictEqual(formatIST(dec31, "yyyyMMdd"), "20251231");
      assert.strictEqual(formatIST(dec31, "EEEE"), "Wednesday");

      // Jan 01 at 00:01 IST (in UTC this is 2025-12-31 18:31:00Z)
      const jan01 = parseISTEventDateTime("2026-01-01", "00:01");
      assert.strictEqual(jan01.toISOString(), "2025-12-31T18:31:00.000Z");
      assert.strictEqual(formatIST(jan01, "yyyy-MM-dd HH:mm"), "2026-01-01 00:01");
      assert.strictEqual(formatIST(jan01, "yyyyMMdd"), "20260101");
      assert.strictEqual(formatIST(jan01, "EEEE"), "Thursday");

      // Boundary bounds continuity
      const dec31Bounds = getISTDayBounds("2025-12-31");
      const jan01Bounds = getISTDayBounds("2026-01-01");
      assert.strictEqual(dec31Bounds.endOfDay.getTime() + 1, jan01Bounds.startOfDay.getTime());
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Edge-Case Time Inputs
  // ---------------------------------------------------------------------------
  describe("Edge-Case Time Inputs Parsing", () => {
    it("should parse 24-hour boundary time strings accurately", () => {
      const midnight = parseISTEventDateTime("2026-05-10", "00:00");
      assert.strictEqual(formatIST(midnight, "HH:mm"), "00:00");

      const noon = parseISTEventDateTime("2026-05-10", "12:00");
      assert.strictEqual(formatIST(noon, "HH:mm"), "12:00");

      const endOfDay = parseISTEventDateTime("2026-05-10", "23:59");
      assert.strictEqual(formatIST(endOfDay, "HH:mm"), "23:59");

      // Single digit hour
      const singleHour = parseISTEventDateTime("2026-05-10", "9:05");
      assert.strictEqual(formatIST(singleHour, "HH:mm"), "09:05");
    });

    it("should parse 12-hour strings with varying casing, spacing, and delimiters", () => {
      const cases: [string, string][] = [
        ["12:00 AM", "00:00"],
        ["12:00 PM", "12:00"],
        ["12:30 AM", "00:30"],
        ["12:30 PM", "12:30"],
        ["1:00 AM", "01:00"],
        ["1:00 PM", "13:00"],
        ["7:30 pm", "19:30"],
        ["7:30 PM", "19:30"],
        ["07:30pm", "19:30"],
        ["11:59PM", "23:59"],
        [" 1:05 am ", "01:05"],
      ];

      for (const [input, expectedTime] of cases) {
        const res = parseISTEventDateTime("2026-05-10", input);
        assert.strictEqual(
          formatIST(res, "HH:mm"),
          expectedTime,
          `Failed parsing '${input}': expected ${expectedTime}, got ${formatIST(res, "HH:mm")}`
        );
      }
    });

    it("should handle invalid, null, undefined, and empty strings gracefully without NaN or throwing", () => {
      const fallbackCases = [
        "",
        "   ",
        null,
        undefined,
        "invalid",
        "NA",
        "na",
        "random_string",
      ];

      for (const input of fallbackCases) {
        const res = parseISTEventDateTime("2026-05-10", input as any);
        assert.ok(!isNaN(res.getTime()), `parseISTEventDateTime should return a valid Date for input: ${input}`);
        // Falls back to 00:00:00 IST
        assert.strictEqual(formatIST(res, "HH:mm"), "00:00");
      }
    });

    it("should document out-of-range 24h inputs (e.g. 25:00) behavior without unhandled exceptions", () => {
      // "25:00" is matched by /^(\d{1,2}):(\d{2})/ and passed to Date.UTC, rolling over 25 hours into next day
      const res = parseISTEventDateTime("2026-05-10", "25:00");
      assert.ok(!isNaN(res.getTime()), "Should produce a valid Date");
      // Rolls over 25 hours from 2026-05-10 00:00 IST -> 2026-05-11 01:00 IST
      assert.strictEqual(formatIST(res, "yyyy-MM-dd HH:mm"), "2026-05-11 01:00");
    });

    it("should formatIST handle null, undefined, empty, and invalid dates safely", () => {
      assert.strictEqual(formatIST(null, "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST(undefined, "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST("", "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST("invalid-date-string", "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST(new Date("invalid"), "yyyy-MM-dd"), "");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Conflict Detection Intervals, 3-Hour Buffers & Boundary Minute Overlaps
  // ---------------------------------------------------------------------------
  describe("Conflict Detection Intervals & Buffer Logic", () => {
    // Configurable conflict evaluator matching route semantics
    function evaluateConflictWithBuffer(
      proposed: { date: string; time: string; hall: string | string[] },
      existing: { date: string; time: string; hall: string | string[]; name: string }[],
      bufferMinutes: number = 120, // Default 2 hours
      durationMinutes: number = 60 // Default 1 hour
    ) {
      const proposedHalls = Array.isArray(proposed.hall) ? proposed.hall : [proposed.hall];
      const bypassHalls = ["na", "others", "house", "self"];
      if (proposedHalls.some((h) => bypassHalls.includes(h.toLowerCase().trim()))) {
        return { conflictType: "none", message: "" };
      }

      const proposedStart = parseISTEventDateTime(proposed.date, proposed.time);
      const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000);
      const proposedEffectiveStart = new Date(proposedStart.getTime() - bufferMinutes * 60000);

      let conflictType: "none" | "soft" | "hard" = "none";
      let conflictMessage = "";

      for (const event of existing) {
        const eventHalls = Array.isArray(event.hall) ? event.hall : [event.hall];
        const commonHalls = proposedHalls.filter((h) => eventHalls.includes(h));
        if (commonHalls.length === 0) continue;

        const eventStart = parseISTEventDateTime(event.date, event.time);
        const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60000);
        const eventEffectiveStart = new Date(eventStart.getTime() - bufferMinutes * 60000);

        // Check 1: Hard Overlap (Events directly intersect: [start, end) intervals)
        const isHardOverlap = proposedStart < eventEnd && proposedEnd > eventStart;

        // Check 2: Buffer Overlap
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

    it("should distinguish exact adjacent events (0m gap) from 1-minute hard overlap", () => {
      // Existing event: 10:00 - 11:00 (60 mins)
      const existing = [
        { date: "2026-08-10", time: "10:00", hall: "Maimoon Hall", name: "Event A" },
      ];

      // Scenario A: Proposed starts EXACTLY when existing ends at 11:00
      // [10:00, 11:00) and [11:00, 12:00) do NOT hard-overlap!
      const backToBack = { date: "2026-08-10", time: "11:00", hall: "Maimoon Hall" };
      const resA = evaluateConflictWithBuffer(backToBack, existing, 120, 60);
      assert.notStrictEqual(resA.conflictType, "hard", "Back-to-back events must NOT be a hard conflict");
      assert.strictEqual(resA.conflictType, "soft", "Back-to-back events must trigger buffer alert");

      // Scenario B: Proposed starts 1 minute BEFORE existing ends (10:59)
      // [10:00, 11:00) and [10:59, 11:59) overlap by 1 minute -> HARD CONFLICT
      const overlap1Min = { date: "2026-08-10", time: "10:59", hall: "Maimoon Hall" };
      const resB = evaluateConflictWithBuffer(overlap1Min, existing, 120, 60);
      assert.strictEqual(resB.conflictType, "hard", "1-minute overlap must trigger HARD CONFLICT");
    });

    it("should test conflict evaluation with a 3-hour (180 minute) buffer setting", () => {
      // Existing event: 12:00 - 13:00 (duration 60m)
      const existing = [
        { date: "2026-08-10", time: "12:00", hall: "Maimoon Hall", name: "Noon Banquet" },
      ];

      // Case 1: Proposed at 15:30 (Existing ends at 13:00; 15:30 is 2.5h later -> within 3h buffer)
      const proposedWithin3h = { date: "2026-08-10", time: "15:30", hall: "Maimoon Hall" };
      const res1 = evaluateConflictWithBuffer(proposedWithin3h, existing, 180, 60);
      assert.strictEqual(res1.conflictType, "soft", "Must detect buffer conflict within 3-hour window");

      // Case 2: Proposed at 16:00 (Existing ends at 13:00; 16:00 is exactly 3.0h later -> no overlap)
      const proposedAt3hBoundary = { date: "2026-08-10", time: "16:00", hall: "Maimoon Hall" };
      const res2 = evaluateConflictWithBuffer(proposedAt3hBoundary, existing, 180, 60);
      assert.strictEqual(res2.conflictType, "none", "Exactly at 3-hour boundary should be clear");

      // Case 3: Proposed at 08:30 (Proposed ends at 09:30; 09:30 is 2.5h before 12:00 -> within 3h buffer)
      const proposedBefore3h = { date: "2026-08-10", time: "08:30", hall: "Maimoon Hall" };
      const res3 = evaluateConflictWithBuffer(proposedBefore3h, existing, 180, 60);
      assert.strictEqual(res3.conflictType, "soft", "Must detect buffer conflict before event within 3h");

      // Case 4: Proposed at 08:00 (Proposed ends at 09:00; 09:00 is exactly 3.0h before 12:00 -> no overlap)
      const proposedClearBefore = { date: "2026-08-10", time: "08:00", hall: "Maimoon Hall" };
      const res4 = evaluateConflictWithBuffer(proposedClearBefore, existing, 180, 60);
      assert.strictEqual(res4.conflictType, "none", "Clear of 3-hour buffer before event");
    });

    it("should correctly detect midnight spanning overlaps and buffers across day boundaries", () => {
      // Existing: Day 1 at 23:30 (ends at 00:30 on Day 2)
      const existing = [
        { date: "2026-08-10", time: "23:30", hall: "Maimoon Hall", name: "Late Vigil" },
      ];

      // Proposed on Day 2 at 00:15 (during 23:30-00:30 interval) -> HARD CONFLICT
      const crossMidnightHard = { date: "2026-08-11", time: "00:15", hall: "Maimoon Hall" };
      const resHard = evaluateConflictWithBuffer(crossMidnightHard, existing, 120, 60);
      assert.strictEqual(resHard.conflictType, "hard", "Spanning midnight should detect HARD CONFLICT");

      // Proposed on Day 2 at 01:30 (1 hour after Late Vigil ends -> within 2h buffer) -> SOFT CONFLICT
      const crossMidnightSoft = { date: "2026-08-11", time: "01:30", hall: "Maimoon Hall" };
      const resSoft = evaluateConflictWithBuffer(crossMidnightSoft, existing, 120, 60);
      assert.strictEqual(resSoft.conflictType, "soft", "Buffer crossing midnight should detect SOFT CONFLICT");

      // Proposed on Day 2 at 03:00 (2.5 hours after Late Vigil ends -> clear of 2h buffer) -> NONE
      const crossMidnightClear = { date: "2026-08-11", time: "03:00", hall: "Maimoon Hall" };
      const resClear = evaluateConflictWithBuffer(crossMidnightClear, existing, 120, 60);
      assert.strictEqual(resClear.conflictType, "none", "Events outside buffer across midnight should have NO CONFLICT");
    });

    it("should handle multi-hall arrays and partial overlaps correctly", () => {
      const existing = [
        { date: "2026-08-10", time: "18:00", hall: ["Maimoon Hall", "Qutbi Hall"], name: "Grand Gathering" },
      ];

      // Proposed in only one overlapping hall
      const proposed1 = { date: "2026-08-10", time: "18:30", hall: "Maimoon Hall" };
      const res1 = evaluateConflictWithBuffer(proposed1, existing, 120, 60);
      assert.strictEqual(res1.conflictType, "hard");

      // Proposed in non-overlapping hall
      const proposed2 = { date: "2026-08-10", time: "18:30", hall: "Najmi Hall" };
      const res2 = evaluateConflictWithBuffer(proposed2, existing, 120, 60);
      assert.strictEqual(res2.conflictType, "none");

      // Proposed in multiple halls with only 1 overlap
      const proposed3 = { date: "2026-08-10", time: "18:30", hall: ["Najmi Hall", "Qutbi Hall"] };
      const res3 = evaluateConflictWithBuffer(proposed3, existing, 120, 60);
      assert.strictEqual(res3.conflictType, "hard");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Dashboard 3-Hour Buffer Logic
  // ---------------------------------------------------------------------------
  describe("Dashboard 3-Hour Buffer Filtering", () => {
    it("should filter out events completed more than 3 hours ago when viewing Today", () => {
      // Simulated dashboard filtering function matching dashboard-client.tsx
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

      const events = [
        // Event A: started 4 hours ago (completed > 3h ago)
        { id: "1", time: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
        // Event B: started 2.5 hours ago (within 3h buffer)
        { id: "2", time: new Date(now.getTime() - 2.5 * 60 * 60 * 1000) },
        // Event C: happening now
        { id: "3", time: new Date(now.getTime()) },
        // Event D: upcoming in 2 hours
        { id: "4", time: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      ];

      const visibleEvents = events.filter((e) => e.time >= threeHoursAgo);

      assert.strictEqual(visibleEvents.length, 3, "Only events within 3 hours or in future should remain visible");
      assert.strictEqual(visibleEvents[0].id, "2");
      assert.strictEqual(visibleEvents[1].id, "3");
      assert.strictEqual(visibleEvents[2].id, "4");
    });
  });
});
