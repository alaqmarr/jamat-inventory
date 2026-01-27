import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, mobile, skip } = await req.json();
    const userId = session.user.id;

    const updates: any = {};
    if (skip) {
      updates.profileStatus = "SKIPPED" as ProfileStatus;
    } else {
      if (email) updates.email = email;
      if (mobile) updates.mobile = mobile;
      updates.profileStatus = "COMPLETED" as ProfileStatus;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
