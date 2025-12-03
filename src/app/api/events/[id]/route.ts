import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { Event } from "@/types";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = params.id;

    const docRef = db.collection("events").doc(eventId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventData = {
      id: docSnap.id,
      ...docSnap.data(),
    } as Event;

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const body = await req.json();

    // Remove id from body if present
    delete body.id;
    delete body.createdAt;

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("events").doc(eventId).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
