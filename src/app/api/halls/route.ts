import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const halls = await prisma.hall.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(halls);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch halls" },
      { status: 500 },
    );
  }
}

// Allow updating hall dimensions
import { NextRequest } from "next/server";
import { getCurrentRole } from "@/lib/rbac-server";

export async function PATCH(req: NextRequest) {
  const role = await getCurrentRole();
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, width, length } = body;

    const hall = await prisma.hall.update({
      where: { id },
      data: { width, length },
    });

    return NextResponse.json(hall);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update hall" },
      { status: 500 },
    );
  }
}
