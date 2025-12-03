import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, name, email, mobile, password } = await req.json();

    // Only Admin can update other users
    const user = session.user as any;
    if (userId && userId !== session.user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetId = userId || session.user.id;
    const updates: any = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (mobile) updates.mobile = mobile;
    if (password) updates.password = password; // In a real app, hash this!

    await db.collection("users").doc(targetId).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
