import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otp, newPassword } = await req.json();
    const userId = session.user.id;

    if (!otp || !newPassword) {
      return NextResponse.json(
        { error: "OTP and new password are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpDoc = await db.collection("otps").doc(userId).get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const otpData = otpDoc.data();

    if (!otpData || otpData.otp !== otp) {
      // Increment attempts
      await db
        .collection("otps")
        .doc(userId)
        .update({
          attempts: (otpData?.attempts || 0) + 1,
        });
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (Date.now() > otpData.expiresAt) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Update Password
    await db.collection("users").doc(userId).update({
      password: newPassword, // In a real app, hash this!
    });

    // Delete used OTP
    await db.collection("otps").doc(userId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
