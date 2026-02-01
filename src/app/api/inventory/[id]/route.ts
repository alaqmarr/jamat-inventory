import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkComponentAccess } from "@/lib/rbac-server";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check inventory-module access first (ADMIN bypasses)
    const hasAccess = await checkComponentAccess("inventory-module");
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - No inventory access" },
        { status: 403 },
      );
    }

    // Layer 2: Role check
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, totalQuantity, unit } = body;

    // Fetch current item to determine quantity difference
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Calculate difference if totalQuantity is provided
    let newAvailable = currentItem.availableQuantity;
    let newTotal = currentItem.totalQuantity;

    if (totalQuantity !== undefined) {
      const newTotalNum = Number(totalQuantity);
      if (!isNaN(newTotalNum)) {
        const diff = newTotalNum - currentItem.totalQuantity;
        newTotal = newTotalNum;
        newAvailable = currentItem.availableQuantity + diff;

        // Prevent negative available quantity?
        if (newAvailable < 0) newAvailable = 0;
      }
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name: name || undefined, // only update if provided
        category: category || undefined,
        unit: unit || undefined,
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Failed to update inventory item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check inventory-module access first (ADMIN bypasses)
    const hasAccess = await checkComponentAccess("inventory-module");
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - No inventory access" },
        { status: 403 },
      );
    }

    // Layer 2: Role check
    if (userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for dependencies? Prisma will throw if FK constraints prevent deletion without Cascade.
    // Assuming simple deletion is desired.
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2003") {
      // Foreign key constraint failed
      return NextResponse.json(
        {
          error:
            "Cannot delete item. It is referenced by existing events/logs.",
        },
        { status: 409 },
      );
    }
    console.error("Failed to delete inventory item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
