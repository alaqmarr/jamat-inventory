import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");

  if (!mobile || mobile.length < 10) {
    return NextResponse.json(
      { error: "Invalid mobile number" },
      { status: 400 },
    );
  }

  try {
    // Search in 'events'
    const lastEvent = await prisma.event.findFirst({
      where: { mobile },
      orderBy: { createdAt: "desc" },
    });

    if (lastEvent) {
      return NextResponse.json({ name: lastEvent.name });
    }

    // Check 'users'
    const user = await prisma.user.findFirst({
      where: { mobile },
    });

    if (user) {
      return NextResponse.json({ name: user.name });
    }

    return NextResponse.json({ name: null });
  } catch (error) {
    console.error("Mobile lookup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
