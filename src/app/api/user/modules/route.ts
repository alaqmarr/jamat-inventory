import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    // ADMIN has access to all modules
    if (userRole === "ADMIN") {
      const allModules = await prisma.module.findMany({
        select: { id: true },
      });
      return NextResponse.json({
        modules: allModules.map((m) => m.id),
        isAdmin: true,
      });
    }

    // Get user's module access from database
    const access = await prisma.userModuleAccess.findMany({
      where: { userId },
      select: { moduleId: true },
    });

    return NextResponse.json({
      modules: access.map((a) => a.moduleId),
      isAdmin: false,
    });
  } catch (error) {
    console.error("Error fetching module access:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
