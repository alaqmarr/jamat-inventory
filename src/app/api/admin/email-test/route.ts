import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  sendEmail,
  otpTemplate,
  newEventTemplate,
  newItemTemplate,
  inventoryUpdateTemplate,
  newUserTemplate,
  errorTemplate,
} from "@/lib/email";

// Mock Data Generators
const getMockData = (template: string, userName: string) => {
  switch (template) {
    case "otp":
      return {
        html: otpTemplate({ otp: "782943", userName }),
        subject: "Password Reset Request",
      };
    case "new_event":
      return {
        html: newEventTemplate({
          name: "Ali Asghar",
          mobile: "+1234567890",
          occasionDate: new Date().toISOString(),
          occasionTime: "19:30",
          hall: ["Main Hall", "Dining Area"],
          thaalCount: 150,
        }),
        subject: "New Event Booking: Ali Asghar",
      };
    case "inventory_update":
      return {
        html: inventoryUpdateTemplate({
          userName,
          itemName: "Crystal Glasses",
          quantity: 50,
          action: "ISSUE",
          eventId: "EVT-2024-001",
          newBalance: 150,
        }),
        subject: "Inventory Alert: Items Issued",
      };
    case "new_item":
      return {
        html: newItemTemplate({
          name: "Golden Chafing Dish",
          category: "Catering",
          quantity: 12,
          unit: "sets",
          userName,
        }),
        subject: "New Item Added: Golden Chafing Dish",
      };
    case "new_user":
      return {
        html: newUserTemplate({
          username: "new_admin_user",
          email: "admin@example.com",
          role: "ADMIN",
        }),
        subject: "Welcome to Jamaat Inventory",
      };
    case "system_error":
      return {
        html: errorTemplate({
          source: "Database Sync",
          error: "Connection timeout after 5000ms",
          context: "Syncing users collection to Neon DB",
        }),
        subject: "System Error: Database Sync",
      };
    default:
      return { html: "<p>Unknown Template</p>", subject: "Test" };
  }
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    // if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Assuming admin check is done or relying on session presence for now for test
    const userName = session?.user?.name || "Test User";
    const email = session?.user?.email || "test@example.com";

    const { action, template, email: targetEmail } = await req.json();

    const { html, subject } = getMockData(template, userName);

    if (action === "preview") {
      // Templates now return full HTML with inline styles, so we render directly.
      return NextResponse.json({ html });
    } else if (action === "send") {
      const result = await sendEmail({
        to: targetEmail || email, // Send to self if no target
        subject: `[TEST] ${subject}`,
        html: html, // sendEmail will wrap this
      });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
