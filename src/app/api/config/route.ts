import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rtdb } from "@/lib/firebase"; // Keep fallback or migration if needed

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Try fetching from Prisma first
    const config = await prisma.config.findUnique({
      where: { key: "bookingWindow" },
    });

    let window = 60;
    if (config) {
      window = parseInt(config.value, 10);
    } else {
      // Fallback to RTDB if not in Prisma yet (migration strategy)
      const snapshot = await rtdb.ref("config/bookingWindow").once("value");
      const val = snapshot.val();
      if (val) window = val;
    }

    return NextResponse.json({ bookingWindow: window });
  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingWindow } = body;

    if (typeof bookingWindow !== "number") {
      return NextResponse.json(
        { error: "Invalid window value" },
        { status: 400 },
      );
    }

    // Save to Prisma
    await prisma.config.upsert({
      where: { key: "bookingWindow" },
      update: { value: bookingWindow.toString() },
      create: { key: "bookingWindow", value: bookingWindow.toString() },
    });

    // Sync to RTDB for backward compatibility (optional, but good for safety)
    await rtdb.ref("config/bookingWindow").set(bookingWindow);

    return NextResponse.json({ success: true, bookingWindow });
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
