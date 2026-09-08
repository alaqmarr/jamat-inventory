import { describe, it } from "node:test";
import assert from "node:assert";
import { getMisriDate, MISRI_MONTH_NAMES_EN } from "../src/lib/misri-calendar.ts";

describe("Misri Calendar Algorithm & Timezone Anchoring", () => {
  it("should convert benchmark date 28 Jan 2026 to 10 Shaban 1447H", () => {
    const result = getMisriDate("2026-01-28");
    assert.strictEqual(result.day, 10);
    assert.strictEqual(result.month, 8); // Shaban is 8th month
    assert.strictEqual(result.year, 1447);
    assert.strictEqual(result.monthNameEn, "Shaban-ul-Karim");
    assert.strictEqual(result.formattedEn, "10th Shaban-ul-Karim 1447");
    assert.strictEqual(result.dayAr, "١٠");
    assert.strictEqual(result.yearAr, "١٤٤٧");
  });

  it("should produce identical Misri dates whether input is string or Date", () => {
    const fromString = getMisriDate("2026-01-28");
    const fromDate = getMisriDate(new Date("2026-01-28T00:00:00.000Z"));
    const fromISTMidnight = getMisriDate(new Date("2026-01-27T18:30:00.000Z"));

    assert.strictEqual(fromString.formattedEn, "10th Shaban-ul-Karim 1447");
    assert.strictEqual(fromDate.formattedEn, fromString.formattedEn);
    assert.strictEqual(fromISTMidnight.formattedEn, fromString.formattedEn);
  });

  it("should correctly handle start of month (1st of Ramadan)", () => {
    // Shaban 1447 has 29 days (even month, month 8).
    // If 10 Shaban is 28 Jan 2026, 29 Shaban is 28 Jan + 19 days = 16 Feb 2026.
    // 1 Ramadan 1447 should be 17 Feb 2026.
    const ramadanStart = getMisriDate("2026-02-17");
    assert.strictEqual(ramadanStart.day, 1);
    assert.strictEqual(ramadanStart.month, 9);
    assert.strictEqual(ramadanStart.monthNameEn, "Ramadan-ul-Moazzam");
    assert.strictEqual(ramadanStart.formattedEn, "1st Ramadan-ul-Moazzam 1447");
  });

  it("should correctly handle month boundaries (29th vs 30th days)", () => {
    // Moharram (1st month) has 30 days
    // Safar (2nd month) has 29 days
    // Rabi-1 (3rd month) has 30 days
    assert.strictEqual(MISRI_MONTH_NAMES_EN[0], "Moharram-ul-Haraam");
    assert.strictEqual(MISRI_MONTH_NAMES_EN[1], "Safar-ul-Muzaffar");
    assert.strictEqual(MISRI_MONTH_NAMES_EN[7], "Shaban-ul-Karim");
    assert.strictEqual(MISRI_MONTH_NAMES_EN[8], "Ramadan-ul-Moazzam");
    assert.strictEqual(MISRI_MONTH_NAMES_EN[11], "Zilhaj-il-Haraam");
  });

  it("should format Arabic text accurately with Eastern Arabic numerals", () => {
    const result = getMisriDate("2026-01-28");
    assert.strictEqual(result.monthNameAr, "شعبان الكريم");
    assert.strictEqual(result.formattedAr, "١٠ شعبان الكريم ١٤٤٧");
  });
});
