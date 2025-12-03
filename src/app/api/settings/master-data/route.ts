import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await db.collection("settings").doc("masterData").get();
    const data = doc.exists ? doc.data() : { halls: [], caterers: [] };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, value } = body; // type: 'hall' | 'caterer', value: string

    if (!type || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const docRef = db.collection("settings").doc("masterData");
    const doc = await docRef.get();
    const data = doc.exists ? doc.data() : { halls: [], caterers: [] };

    let updates: any = {};

    if (type === "hall") {
      const halls = data?.halls || [];
      if (!halls.includes(value)) {
        updates.halls = [...halls, value];
      }
    } else if (type === "caterer") {
      const caterers = data?.caterers || [];
      // Value is expected to be { name, phone }
      const newCaterer = value;
      const exists = caterers.some(
        (c: any) => (typeof c === "string" ? c : c.name) === newCaterer.name
      );

      if (!exists) {
        updates.caterers = [...caterers, newCaterer];
      }
    }

    if (Object.keys(updates).length > 0) {
      await docRef.set(updates, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const docRef = db.collection("settings").doc("masterData");
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ success: true });
    }

    const data = doc.data();
    let updates: any = {};

    if (type === "hall") {
      updates.halls = (data?.halls || []).filter((h: string) => h !== value);
    } else if (type === "caterer") {
      // Value is the name of the caterer to remove
      updates.caterers = (data?.caterers || []).filter(
        (c: any) => (typeof c === "string" ? c : c.name) !== value
      );
    }

    await docRef.set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete master data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
