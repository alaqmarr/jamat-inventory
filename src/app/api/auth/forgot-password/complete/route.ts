import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { username, otp, newPassword } = await req.json();

    if (!username || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Username, OTP, and new password are required" },
        { status: 400 }
      );
    }

    // Find user by username to get ID
    const userSnapshot = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userSnapshot.docs[0].id;

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
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
