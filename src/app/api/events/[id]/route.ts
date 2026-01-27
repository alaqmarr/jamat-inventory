import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rtdb } from "@/lib/firebase";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Format dates for compatibility
    return NextResponse.json({
      ...event,
      occasionDate: event.occasionDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const body = await req.json();

    // Remove id and timestamps from body
    const { id, createdAt, updatedAt, ...updateFields } = body;

    // Handle date conversion if occasionDate is provided
    const updateData: any = { ...updateFields };
    if (updateFields.occasionDate) {
      updateData.occasionDate = new Date(updateFields.occasionDate);
      updateData.occasionDay = new Date(
        updateFields.occasionDate,
      ).toLocaleDateString("en-US", {
        weekday: "long",
      });
    }

    // Handle hall array
    if (updateFields.hall && !Array.isArray(updateFields.hall)) {
      updateData.hall = [updateFields.hall];
    }

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    // Check for inventory logs in RTDB (keeping for real-time)
    const logsSnapshot = await rtdb
      .ref("logs")
      .orderByChild("details/eventId")
      .equalTo(eventId)
      .once("value");

    const logsData = logsSnapshot.val();
    const logCount = logsData ? Object.keys(logsData).length : 0;

    if (logCount > 0 && !force) {
      return NextResponse.json(
        {
          error: "Related data exists",
          related: ["Inventory Logs"],
          count: logCount,
        },
        { status: 409 },
      );
    }

    // Delete logs if they exist (cascading delete from RTDB)
    if (logsData && force) {
      const deletePromises = Object.keys(logsData).map((key) =>
        rtdb.ref(`logs/${key}`).remove(),
      );
      await Promise.all(deletePromises);
    }

    // Delete the event from PostgreSQL
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
