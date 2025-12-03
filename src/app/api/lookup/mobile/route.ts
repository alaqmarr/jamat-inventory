import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get("mobile");

  if (!mobile || mobile.length < 10) {
    return NextResponse.json(
      { error: "Invalid mobile number" },
      { status: 400 }
    );
  }

  try {
    // Search in 'events' collection for past bookings with this mobile
    // Or 'users' if we store guests there.
    // The requirement says "if user mobile number exists already, fetch the name".
    // We'll search in 'events' for the most recent name associated with this mobile.

    const eventsSnapshot = await db
      .collection("events")
      .where("mobile", "==", mobile)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!eventsSnapshot.empty) {
      const data = eventsSnapshot.docs[0].data();
      return NextResponse.json({ name: data.name });
    }

    // Also check 'users' collection just in case
    const usersSnapshot = await db
      .collection("users")
      .where("mobile", "==", mobile)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const data = usersSnapshot.docs[0].data();
      return NextResponse.json({ name: data.name });
    }

    return NextResponse.json({ name: null });
  } catch (error) {
    console.error("Mobile lookup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
