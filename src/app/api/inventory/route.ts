import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const role = user?.role;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, totalQuantity, unit } = body;

    if (!name || !category || totalQuantity === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Generate meaningful ID from slugified name
    const { slugify } = await import("@/lib/utils");
    const itemId = slugify(name);

    // Check for duplicate
    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Item with this name already exists" },
        { status: 400 },
      );
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        id: itemId,
        name,
        category,
        totalQuantity: Number(totalQuantity),
        availableQuantity: Number(totalQuantity),
        unit: unit || "pcs",
      },
    });

    // Send email to admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const adminEmails = admins
        .map((a) => a.email)
        .filter((email): email is string => !!email);

      if (adminEmails.length > 0) {
        const { newItemTemplate, sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: adminEmails,
          subject: `New Inventory Item: ${name}`,
          html: newItemTemplate({
            name,
            category,
            quantity: Number(totalQuantity),
            unit: unit || "pcs",
            userName: "Admin",
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send new item email:", emailError);
    }

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Inventory create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
