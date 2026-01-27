import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ needsSetup: userCount === 0 });
  } catch (error) {
    console.error("Setup check error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    // Double check if setup is needed
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "System already set up" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { username, password, name, mobile, email } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email: email || null,
        mobile: mobile || null,
        role: "ADMIN" as Role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
