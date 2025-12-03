import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { User } from "@/types";

export async function GET() {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as User[];

    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }: any) => user);

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, role, mobile } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if username exists
    const existingUser = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    const newUser: User = {
      uid: "user-" + Date.now(),
      username,
      name: name || "",
      role,
      createdAt: new Date(),
      // mobile,
    };

    await db
      .collection("users")
      .doc(newUser.uid)
      .set({
        ...newUser,
        password, // In production, hash this!
        mobile: mobile || "",
      });

    return NextResponse.json({ success: true, user: newUser });

    // Send email to admins
    try {
      const adminsSnapshot = await db
        .collection("users")
        .where("role", "==", "ADMIN")
        .get();
      const adminEmails = adminsSnapshot.docs
        .map((doc) => doc.data().email)
        .filter((email) => email);

      if (adminEmails.length > 0) {
        const { newUserTemplate, sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: adminEmails,
          subject: `New User Registered: ${username}`,
          html: newUserTemplate({
            username,
            role,
            email: "", // Email not in body yet, need to extract if present
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send new user email:", emailError);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
