import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const userId = params.id;
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    await db.collection("users").doc(userId).update({ role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const userId = params.id;

    // Prevent deleting the last admin? Logic can be added here.

    await db.collection("users").doc(userId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
