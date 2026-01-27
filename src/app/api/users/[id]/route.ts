import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Role } from "@/generated/prisma/client";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const userId = params.id;
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
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
  try {
    const params = await props.params;
    const userId = params.id;

    // Prevent deleting the last admin
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (userToDelete?.role === "ADMIN" && adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin" },
        { status: 400 },
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
