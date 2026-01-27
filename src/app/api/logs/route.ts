import { NextResponse } from "next/server";
import { rtdb } from "@/lib/firebase";

import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role as Role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await rtdb
      .ref("logs")
      .orderByChild("timestamp")
      .limitToLast(100)
      .once("value");
    const logs = snapshot.val();

    // Convert object to array and reverse (newest first)
    const logsArray = logs
      ? Object.entries(logs)
          .map(([id, data]: [string, any]) => ({ id, ...data }))
          .reverse()
      : [];

    return NextResponse.json(logsArray);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
