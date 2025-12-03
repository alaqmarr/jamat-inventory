import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch logs from RTDB
    // For a full ledger, we might want to paginate or limit.
    // Let's limit to the last 500 transactions for now to avoid performance issues.
    const logsRef = rtdb.ref("logs");
    const snapshot = await logsRef.limitToLast(500).once("value");

    const logs: any[] = [];
    snapshot.forEach((child) => {
      logs.push({ id: child.key, ...child.val() });
    });

    // Sort by timestamp desc (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch ledger:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
