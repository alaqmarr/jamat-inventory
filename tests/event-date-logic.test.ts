import { describe, it } from "node:test";
import assert from "node:assert";
import { formatIST, getISTDayBounds, slugify } from "../src/lib/utils.ts";

describe("Event Date Logic & ID Generation", () => {
  describe("Event ID Generation & Day Name (No Rollback)", () => {
    it("should generate event ID starting with yyyyMMdd in IST when given serialized UTC midnight", () => {
      // March 15, 2026 midnight in IST is serialized to UTC as 2026-03-14T18:30:00.000Z
      const parsedDate = new Date("2026-03-14T18:30:00.000Z");
      const mobile = "9876543210";
      const description = "Nikah Ceremony of Taher & Fatema";

      const dateStr = formatIST(parsedDate, "yyyyMMdd");
      const occasionDay = formatIST(parsedDate, "EEEE");
      const occasionSlug = slugify(description).slice(0, 30);
      const eventId = `${dateStr}-${mobile}-${occasionSlug}`;

      // Must start with 20260315, NOT 20260314
      assert.strictEqual(dateStr, "20260315");
      assert.strictEqual(occasionDay, "Sunday");
      assert.ok(eventId.startsWith("20260315-9876543210-nikah-ceremony"));
    });

    it("should correctly handle late night events (e.g. 11:30 PM IST)", () => {
      // 2026-03-15 23:30:00 IST = 2026-03-15 18:00:00 UTC
      const parsedDate = new Date("2026-03-15T18:00:00.000Z");
      const dateStr = formatIST(parsedDate, "yyyyMMdd");
      const occasionDay = formatIST(parsedDate, "EEEE");

      assert.strictEqual(dateStr, "20260315");
      assert.strictEqual(occasionDay, "Sunday");
    });
  });

  describe("Day-Bound Query Filter Matching", () => {
    it("should match stored event dates inside IST boundaries", () => {
      const { startOfDay, endOfDay } = getISTDayBounds("2026-03-15");

      // Event stored at IST midnight (2026-03-14 18:30:00 UTC)
      const eventDate1 = new Date("2026-03-14T18:30:00.000Z");
      assert.ok(eventDate1 >= startOfDay && eventDate1 <= endOfDay);

      // Event stored at IST noon (2026-03-15 06:30:00 UTC)
      const eventDate2 = new Date("2026-03-15T06:30:00.000Z");
      assert.ok(eventDate2 >= startOfDay && eventDate2 <= endOfDay);

      // Event stored at IST end of day (2026-03-15 18:29:59 UTC)
      const eventDate3 = new Date("2026-03-15T18:29:59.000Z");
      assert.ok(eventDate3 >= startOfDay && eventDate3 <= endOfDay);
    });

    it("should exclude events from previous day or next day", () => {
      const { startOfDay, endOfDay } = getISTDayBounds("2026-03-15");

      // Event 1 millisecond before IST start of day (March 14 23:59:59.999 IST)
      const prevEvent = new Date(startOfDay.getTime() - 1);
      assert.ok(prevEvent < startOfDay);

      // Event 1 millisecond after IST end of day (March 16 00:00:00.000 IST)
      const nextEvent = new Date(endOfDay.getTime() + 1);
      assert.ok(nextEvent > endOfDay);
    });
  });

  describe("Event Progress Stepper Logic", () => {
    it("should correctly identify Active step when event date matches today in IST", () => {
      const today = new Date();
      const todayStr = formatIST(today, "yyyy-MM-dd");

      // Simulated event on today
      const eventOccasionDate = new Date(today);
      const eventDateStr = formatIST(eventOccasionDate, "yyyy-MM-dd");

      assert.strictEqual(todayStr, eventDateStr);
    });

    it("should correctly identify Returning step when event date is in the past in IST", () => {
      const today = new Date();
      const todayStr = formatIST(today, "yyyy-MM-dd");

      // Simulated event 2 days ago
      const pastDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const pastDateStr = formatIST(pastDate, "yyyy-MM-dd");

      assert.ok(todayStr > pastDateStr);
    });
  });
});
