import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentRole } from "@/lib/rbac-server";

// ... imports

export async function POST(req: NextRequest) {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, hallId, data, width, length, isPublic } = body;

    if (!name || !hallId || !data || !width || !length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        name,
        hallId,
        data,
        width, // Ensure logic uses same unit (ft)
        length,
        isPublic: isPublic || true, // Default to true for now for ease of sharing
      },
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error("Failed to create floor plan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, data, width, length, isPublic } = body;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updated = await prisma.floorPlan.update({
      where: { id },
      data: {
        name,
        data,
        width,
        length,
        isPublic,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hallId = searchParams.get("hallId");

  // Also allow fetching by ID or Token logic if needed here,
  // but usually single fetch is a separate dynamic route.
  // We'll keep this for list fetching.

  try {
    const whereClause = hallId ? { hallId } : {};
    const plans = await prisma.floorPlan.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      include: { hall: true },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 },
    );
  }
}
