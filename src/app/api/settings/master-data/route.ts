import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch halls and caterers from separate tables
    const [halls, caterers] = await Promise.all([
      prisma.hall.findMany({ orderBy: { name: "asc" } }),
      prisma.caterer.findMany({ orderBy: { name: "asc" } }),
    ]);

    // Return in expected format for compatibility
    return NextResponse.json({
      halls: halls.map((h) => h.name),
      caterers: caterers.map((c) => ({ name: c.name, phone: c.phone })),
    });
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (type === "hall") {
      // value is a string (hall name)
      const existing = await prisma.hall.findUnique({
        where: { name: value },
      });

      if (!existing) {
        await prisma.hall.create({
          data: { name: value },
        });
      }
    } else if (type === "caterer") {
      // value is { name, phone }
      const existing = await prisma.caterer.findUnique({
        where: { name: value.name },
      });

      if (!existing) {
        await prisma.caterer.create({
          data: {
            name: value.name,
            phone: value.phone || "",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (type === "hall") {
      await prisma.hall.deleteMany({
        where: { name: value },
      });
    } else if (type === "caterer") {
      await prisma.caterer.deleteMany({
        where: { name: value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
