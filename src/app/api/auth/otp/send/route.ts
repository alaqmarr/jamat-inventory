import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { sendEmail, otpTemplate } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const userId = session.user.id;
    const name = session.user.name || "User";

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
      to: email,
      subject: "Your OTP for Password Change",
      html: otpTemplate({ otp, userName: name || "User" }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
