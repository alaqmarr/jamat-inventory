import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    // Strict Admin Only
    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        profileStatus: true,
        createdAt: true,
      },
    });

    // Map id to uid for compatibility with frontend
    const safeUsers = users.map((user) => ({
      uid: user.id,
      ...user,
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    // Strict Admin Only
    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, password, name, role, mobile } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 },
      );
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name: name || "",
        role,
        mobile: mobile || "",
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
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
        const { newUserTemplate, sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: adminEmails,
          subject: `New User Registered: ${username}`,
          html: newUserTemplate({
            username,
            role,
            email: "",
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send new user email:", emailError);
    }

    return NextResponse.json({
      success: true,
      user: { uid: newUser.id, ...newUser },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
