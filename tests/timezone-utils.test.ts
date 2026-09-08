import { describe, it } from "node:test";
import assert from "node:assert";
import {
  IST_TIMEZONE,
  formatIST,
  getISTDayBounds,
  parseISTEventDateTime,
  isEventLocked,
  getISTDate,
} from "../src/lib/utils.ts";

describe("Timezone Utilities (Asia/Kolkata Standard)", () => {
  it("should define canonical IST timezone as Asia/Kolkata", () => {
    assert.strictEqual(IST_TIMEZONE, "Asia/Kolkata");
  });

  describe("formatIST", () => {
    it("should format UTC midnight correctly to the corresponding IST date", () => {
      // 2026-03-14 18:30:00 UTC is exactly 2026-03-15 00:00:00 IST
      const utcDate = new Date("2026-03-14T18:30:00.000Z");
      assert.strictEqual(formatIST(utcDate, "yyyy-MM-dd"), "2026-03-15");
      assert.strictEqual(formatIST(utcDate, "EEEE"), "Sunday");
      assert.strictEqual(formatIST(utcDate, "hh:mm a"), "12:00 AM");
    });

    it("should format evening UTC time correctly without day rollover bug", () => {
      // 2026-03-15 13:30:00 UTC is 2026-03-15 19:00:00 IST (7:00 PM)
      const eveDate = new Date("2026-03-15T13:30:00.000Z");
      assert.strictEqual(formatIST(eveDate, "yyyy-MM-dd"), "2026-03-15");
      assert.strictEqual(formatIST(eveDate, "EEEE"), "Sunday");
      assert.strictEqual(formatIST(eveDate, "hh:mm a"), "07:00 PM");
    });

    it("should handle ISO strings, epoch milliseconds, and Date objects", () => {
      const iso = "2026-01-28T00:00:00.000Z";
      assert.strictEqual(formatIST(iso, "yyyy-MM-dd"), "2026-01-28");

      const ms = new Date("2026-01-28T00:00:00.000Z").getTime();
      assert.strictEqual(formatIST(ms, "yyyy-MM-dd"), "2026-01-28");
    });

    it("should return empty string for null, undefined, or invalid date inputs", () => {
      assert.strictEqual(formatIST(null, "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST(undefined, "yyyy-MM-dd"), "");
      assert.strictEqual(formatIST("invalid-date-string", "yyyy-MM-dd"), "");
    });
  });

  describe("getISTDayBounds", () => {
    it("should compute exact UTC interval for an IST calendar day", () => {
      const { startOfDay, endOfDay } = getISTDayBounds("2026-03-15");

      // 00:00:00.000 IST on March 15 = 2026-03-14 18:30:00.000 UTC
      assert.strictEqual(startOfDay.toISOString(), "2026-03-14T18:30:00.000Z");
      // 23:59:59.999 IST on March 15 = 2026-03-15 18:29:59.999 UTC
      assert.strictEqual(endOfDay.toISOString(), "2026-03-15T18:29:59.999Z");

      // Interval must span exactly 24 hours minus 1 ms
      const duration = endOfDay.getTime() - startOfDay.getTime();
      assert.strictEqual(duration, 24 * 60 * 60 * 1000 - 1);
    });

    it("should compute bounds when passed a Date object", () => {
      const d = new Date("2026-03-15T00:00:00.000Z");
      const { startOfDay, endOfDay } = getISTDayBounds(d);
      assert.strictEqual(startOfDay.toISOString(), "2026-03-14T18:30:00.000Z");
      assert.strictEqual(endOfDay.toISOString(), "2026-03-15T18:29:59.999Z");
    });

    it("should correctly handle month boundaries (e.g. Feb 28 to March 1)", () => {
      const { startOfDay, endOfDay } = getISTDayBounds("2026-03-01");
      assert.strictEqual(startOfDay.toISOString(), "2026-02-28T18:30:00.000Z");
      assert.strictEqual(endOfDay.toISOString(), "2026-03-01T18:29:59.999Z");
    });
  });

  describe("parseISTEventDateTime", () => {
    it("should parse 24-hour time strings correctly", () => {
      // 19:00 IST on 2026-03-15 = 13:30 UTC
      const parsed = parseISTEventDateTime("2026-03-15", "19:00");
      assert.strictEqual(parsed.toISOString(), "2026-03-15T13:30:00.000Z");
    });

    it("should parse 12-hour AM/PM time strings correctly", () => {
      // 07:00 PM IST on 2026-03-15 = 13:30 UTC
      const pm = parseISTEventDateTime("2026-03-15", "07:00 PM");
      assert.strictEqual(pm.toISOString(), "2026-03-15T13:30:00.000Z");

      // 09:30 AM IST on 2026-03-15 = 04:00 UTC
      const am = parseISTEventDateTime("2026-03-15", "09:30 AM");
      assert.strictEqual(am.toISOString(), "2026-03-15T04:00:00.000Z");
    });

    it("should handle single digit hours and varying AM/PM spacing", () => {
      const t1 = parseISTEventDateTime("2026-03-15", "8:15 AM");
      assert.strictEqual(t1.toISOString(), "2026-03-15T02:45:00.000Z");

      const t2 = parseISTEventDateTime("2026-03-15", "8:15PM");
      assert.strictEqual(t2.toISOString(), "2026-03-15T14:45:00.000Z");
    });

    it("should handle noon (12:00 PM) and midnight (12:00 AM) correctly", () => {
      const noon = parseISTEventDateTime("2026-03-15", "12:00 PM");
      assert.strictEqual(noon.toISOString(), "2026-03-15T06:30:00.000Z");

      const midnight = parseISTEventDateTime("2026-03-15", "12:00 AM");
      assert.strictEqual(midnight.toISOString(), "2026-03-14T18:30:00.000Z");
    });

    it("should fallback gracefully to 00:00 IST for empty or missing times", () => {
      const parsed = parseISTEventDateTime("2026-03-15", "");
      assert.strictEqual(parsed.toISOString(), "2026-03-14T18:30:00.000Z");
    });
  });

  describe("isEventLocked", () => {
    it("should return false if event ended less than 48 hours ago", () => {
      // Event ended 30 hours ago
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
      const isLocked = isEventLocked(thirtyHoursAgo, "18:00");
      assert.strictEqual(isLocked, false);
    });

    it("should return true if event ended more than 48 hours ago", () => {
      // Event ended 50 hours ago
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
      const isLocked = isEventLocked(fiftyHoursAgo, "18:00");
      assert.strictEqual(isLocked, true);
    });

    it("should avoid premature locking by combining date and occasionTime", () => {
      // An event today at 8:00 PM: If checked right now, it should definitely NOT be locked
      const now = new Date();
      const todayStr = formatIST(now, "yyyy-MM-dd");
      assert.strictEqual(isEventLocked(todayStr, "20:00"), false);
    });

    it("should return true at exactly 48 hours post-event boundary", () => {
      const RealDate = globalThis.Date;
      // 2026-03-15 20:00 IST = 2026-03-15T14:30:00.000Z
      // Exactly 48 hours later = 2026-03-17T14:30:00.000Z (diff = 172800000 ms)
      const t48h = new RealDate("2026-03-17T14:30:00.000Z").getTime();
      try {
        const MockDate = class extends RealDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(t48h);
            } else {
              // @ts-ignore
              super(...args);
            }
          }
          static override now() {
            return t48h;
          }
        };
        globalThis.Date = MockDate as any;
        assert.strictEqual(isEventLocked("2026-03-15", "20:00"), true);
      } finally {
        globalThis.Date = RealDate;
      }
    });

    it("should return false at 47 hours and 59 minutes post-event", () => {
      const RealDate = globalThis.Date;
      // 47 hours and 59 minutes after 2026-03-15 20:00 IST = 2026-03-17T14:29:00.000Z
      const t47h59m = new RealDate("2026-03-17T14:29:00.000Z").getTime();
      try {
        const MockDate = class extends RealDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(t47h59m);
            } else {
              // @ts-ignore
              super(...args);
            }
          }
          static override now() {
            return t47h59m;
          }
        };
        globalThis.Date = MockDate as any;
        assert.strictEqual(isEventLocked("2026-03-15", "20:00"), false);
      } finally {
        globalThis.Date = RealDate;
      }
    });

    it("should return false for evening event (20:00 IST) evaluated at 00:00 IST on Day 3 (28 hours post-event)", () => {
      const RealDate = globalThis.Date;
      // Day 3 00:00:00 IST = 2026-03-16T18:30:00.000Z (28 hours after March 15 20:00 IST)
      const t28h = new RealDate("2026-03-16T18:30:00.000Z").getTime();
      try {
        const MockDate = class extends RealDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(t28h);
            } else {
              // @ts-ignore
              super(...args);
            }
          }
          static override now() {
            return t28h;
          }
        };
        globalThis.Date = MockDate as any;
        assert.strictEqual(isEventLocked("2026-03-15", "20:00"), false);
      } finally {
        globalThis.Date = RealDate;
      }
    });

    it("should return false for null or undefined eventDate", () => {
      assert.strictEqual(isEventLocked(null), false);
      assert.strictEqual(isEventLocked(undefined), false);
    });
  });

  describe("getISTDate", () => {
    it("should return a zoned date without artificial millisecond drift", () => {
      const d = new Date("2026-03-15T00:00:00.000Z");
      const ist = getISTDate(d);
      assert.ok(!isNaN(ist.getTime()));
    });
  });
});
