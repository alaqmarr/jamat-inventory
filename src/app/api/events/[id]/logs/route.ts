import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = params.id;

    // Fetch logs from 'event_logs/{eventId}'
    // This is efficient and doesn't require indexing
    const logsRef = rtdb.ref(`event_logs/${eventId}`);
    const snapshot = await logsRef.once("value");

    const logs: any[] = [];
    snapshot.forEach((child) => {
      logs.push({ id: child.key, ...child.val() });
    });

    // Sort by timestamp desc (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
