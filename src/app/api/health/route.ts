import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: {
    database: {
      status: "connected" | "error";
      latencyMs: number;
      error?: string;
    };
    rtdb: { status: "connected" | "error"; latencyMs: number; error?: string };
  } = {
    database: { status: "error", latencyMs: 0 },
    rtdb: { status: "error", latencyMs: 0 },
  };

  // Test Postgres (KB) connectivity
  try {
    const startDb = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const endDb = performance.now();
    results.database = {
      status: "connected",
      latencyMs: Math.round(endDb - startDb),
    };
  } catch (error: any) {
    results.database = {
      status: "error",
      latencyMs: 0,
      error: error.message || "Connection failed",
    };
  }

  // Test RTDB connectivity
  try {
    const startRtdb = performance.now();
    // Read a dummy path to force a network round-trip (or at least DB access)
    // .info/connected is often local state.
    await rtdb.ref("_health_check").once("value");
    const endRtdb = performance.now();

    // Ensure at least 1ms to show connectivity if it's extremely fast but successful
    const latency = Math.max(1, Math.round(endRtdb - startRtdb));

    results.rtdb = {
      status: "connected",
      latencyMs: latency,
    };
  } catch (error: any) {
    results.rtdb = {
      status: "error",
      latencyMs: 0,
      error: error.message || "Connection failed",
    };
  }

  return NextResponse.json(results);
}
