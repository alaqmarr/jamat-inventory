import { NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { logAction } from "@/lib/logger";

export async function POST() {
  try {
    const session = await auth();

    if (session?.user) {
      // Log logout action before signing out
      await logAction(
        "USER_LOGOUT",
        { timestamp: new Date().toISOString() },
        {
          id: (session.user as any).id,
          name: session.user.name || "Unknown",
        }
      );
    }

    // Sign out the user
    await signOut({ redirect: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
