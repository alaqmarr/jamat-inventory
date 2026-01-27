import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const types = await prisma.floorItemType.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch item types" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, width, length, color } = body;

    if (!name || !type || !width || !length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newItem = await prisma.floorItemType.create({
      data: {
        name,
        type,
        width: parseFloat(width),
        length: parseFloat(length),
        color: color || "bg-indigo-100",
      },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create item type" },
      { status: 500 },
    );
  }
}
