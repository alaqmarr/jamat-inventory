import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types";

export async function GET() {
  try {
    const snapshot = await db.collection("inventory").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryItem[];
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, totalQuantity, unit } = body;

    if (!name || !category || totalQuantity === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newItem: Omit<InventoryItem, "id"> = {
      name,
      category,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity),
      unit: unit || "pcs",
    };

    const docRef = await db.collection("inventory").add(newItem);

    // Send email to admins
    try {
      const adminsSnapshot = await db
        .collection("users")
        .where("role", "==", "ADMIN")
        .get();
      const adminEmails = adminsSnapshot.docs
        .map((doc) => doc.data().email)
        .filter((email) => email);

      if (adminEmails.length > 0) {
        const { newItemTemplate, sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: adminEmails,
          subject: `New Inventory Item: ${name}`,
          html: newItemTemplate({
            name,
            category,
            quantity: Number(totalQuantity),
            unit: unit || "pcs",
            userName: "Admin", // Ideally get from session
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send new item email:", emailError);
    }

    return NextResponse.json({ id: docRef.id, ...newItem });
  } catch (error) {
    console.error("Inventory create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
