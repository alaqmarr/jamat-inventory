import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caterers = await prisma.caterer.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(caterers);
  } catch (error) {
    console.error("Caterers GET Error:", error);
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

    const { name, phone } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newItem = await prisma.caterer.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || "",
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Caterers POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, phone } = await req.json();
    if (!id || !name?.trim())
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    await prisma.caterer.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Caterers PUT Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await req.json();

    await prisma.caterer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Caterers DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
