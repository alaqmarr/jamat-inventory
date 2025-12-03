import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { sendEmail, otpTemplate } from "@/lib/email";
import { User } from "@/types";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Find user by username
    const userSnapshot = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data() as User;
    const userId = userDoc.id;

    if (!userData.email) {
      return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in Firestore
    await db.collection("otps").doc(userId).set({
      otp,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
    });

    // Send Email
    await sendEmail({
      to: userData.email,
      subject: "Password Reset OTP",
      html: otpTemplate({ otp, userName: userData.name || userData.username }),
    });

    // Mask email for privacy
    const maskedEmail = userData.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return NextResponse.json({ success: true, email: maskedEmail });
  } catch (error) {
    console.error("Failed to init forgot password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
