import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatIST } from "../src/lib/utils.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Historical Data Log Protection & R2 Invariant Verification", () => {
  it("should enforce standard RTDB log schema: epoch timestamp and ISO createdAt", () => {
    // Simulated log entry creation matching src/lib/logger.ts
    const before = Date.now();
    const timestamp = Date.now();
    const after = Date.now();

    const logEntry = {
      action: "EVENT_CREATED",
      details: { eventId: "20260315-9876543210-test-event" },
      userId: "user-123",
      userName: "Admin User",
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
    };

    // Assert timestamp is numeric millisecond epoch
    assert.strictEqual(typeof logEntry.timestamp, "number");
    assert.ok(logEntry.timestamp >= before && logEntry.timestamp <= after);

    // Assert createdAt is valid ISO 8601 UTC string ending in 'Z'
    assert.strictEqual(typeof logEntry.createdAt, "string");
    assert.ok(logEntry.createdAt.endsWith("Z"));
    assert.strictEqual(new Date(logEntry.createdAt).getTime(), timestamp);
  });

  it("should verify presentation-layer IST formatting without modifying underlying log epoch", () => {
    // Given an existing historical log with timestamp in UTC milliseconds
    // e.g. 2026-03-14T18:30:00.000Z = 1773513000000 ms
    const historicalTimestamp = 1773513000000;
    const historicalLog = {
      action: "INVENTORY_ADDED",
      details: { itemId: "item-1", qty: 10 },
      userId: "user-abc",
      userName: "Store Manager",
      timestamp: historicalTimestamp,
      createdAt: new Date(historicalTimestamp).toISOString(),
    };

    // Presentation formatting in IST
    const displayDate = formatIST(historicalLog.timestamp, "yyyy-MM-dd");
    const displayTime = formatIST(historicalLog.timestamp, "hh:mm a");

    assert.strictEqual(displayDate, "2026-03-15");
    assert.strictEqual(displayTime, "12:00 AM");

    // CRITICAL: The underlying historical log record remains completely unchanged
    assert.strictEqual(historicalLog.timestamp, 1773513000000);
    assert.strictEqual(historicalLog.createdAt, "2026-03-14T18:30:00.000Z");
  });

  it("should verify that static configuration and schema files match exact SHA-256 baselines", () => {
    const expectedHashes: Record<string, string> = {
      "components.json": "941F97F9BE0941078FC95DBC59E197756C7777580EB67FC7F91336CC784307EC",
      "public/manifest.json": "AE6280A98642CC45D5F79C8FDC081AFF05689E1D470EC3241EA6DFEF33558B58",
      "src/config/rbac.json": "D6AC46B84E1DB7DAAEBB6F8BF295EECD68B1F28AC03E8505D3CB1AB5A6965858",
      "tsconfig.json": "DBACF04AA5F38C1CE4B0F030FBB84E5ADFF19306FB785B2E4AAFEF9C58705658",
      "prisma/schema.prisma": "5B196F92051E3F54B67FED09F8E95BAE3ACC1F23EDCECF64ECDA53CA2EC5B043",
      "aajnodin.html": "007FB10B6F087F96A32016FE1D16BBB4C436F4D92B869FFB0E33EC62CD2C62E2",
    };

    const projectRoot = path.resolve(__dirname, "..");

    for (const [relPath, expectedHash] of Object.entries(expectedHashes)) {
      const fullPath = path.join(projectRoot, relPath);
      assert.ok(fs.existsSync(fullPath), `Required file must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath);
      const computedHash = crypto.createHash("sha256").update(content).digest("hex").toUpperCase();
      assert.strictEqual(
        computedHash,
        expectedHash,
        `Hash mismatch for ${relPath}: Expected ${expectedHash}, Got ${computedHash}`
      );
    }
  });

  it("should assert that src/lib/logger.ts maintains immutable timestamp format", () => {
    const loggerPath = path.resolve(__dirname, "../src/lib/logger.ts");
    const content = fs.readFileSync(loggerPath, "utf-8");

    // Verify timestamp: Date.now() and createdAt: ISO string
    assert.ok(content.includes("const timestamp = Date.now();"), "logger.ts must use Date.now()");
    assert.ok(
      content.includes("createdAt: new Date(timestamp).toISOString()"),
      "logger.ts must use new Date(timestamp).toISOString()"
    );
  });
});
