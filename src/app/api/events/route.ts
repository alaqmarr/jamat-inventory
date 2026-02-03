import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CrockeryStatus } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    let whereClause = {};

    if (date) {
      // Parse the input date string safely
      const targetDate = new Date(date);

      if (!isNaN(targetDate.getTime())) {
        // Create start and end of day in UTC roughly corresponding to the query
        // If date is YYYY-MM-DD, we want that full day in IST.
        // Let's use date-fns-tz or just simple ISO range if strict.
        // Simpler: Just match the date part of the string if possible?
        // Database stores DateTime.

        // Let's assume input 'date' is YYYY-MM-DD.
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Adjust for potential timezone offsets of the server environment
        // If we want specific IST day:
        // We can use the Prisma date filtering more broadly or handle it:
        whereClause = {
          occasionDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        };
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { occasionDate: "asc" },
    });

    // Transform dates to ISO strings for compatibility
    const formattedEvents = events.map((event) => ({
      ...event,
      occasionDate: event.occasionDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // RBAC: Only ADMIN and MANAGER can create events
  const session = await auth();
  const user = session?.user as any;
  const role = user?.role;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const {
      mobile,
      name,
      email,
      occasionDate,
      occasionTime,
      description,
      hall,
      catererName,
      catererPhone,
      thaalCount,
      sarkariThaalSet,
      extraChilamchiLota,
      tablesAndChairs,
      bhaiSaabIzzan,
      benSaabIzzan,
      mic,
      crockeryRequired,
      thaalForDevri,
      paat,
      masjidLight,
      acStartTime,
      partyTime,
      decorations,
      gasCount,
      menu,
      eventType,
      hallCounts,
    } = body;

    // Basic validation
    if (!mobile || !name || !occasionDate || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(occasionDate);

    // Generate meaningful event ID: YYYYMMDD-mobile-occasion
    const { slugify } = await import("@/lib/utils");
    const { format } = await import("date-fns");
    const dateStr = format(parsedDate, "yyyyMMdd");
    const occasionSlug = slugify(description).slice(0, 30);
    const eventId = `${dateStr}-${mobile}-${occasionSlug}`;

    const newEvent = await prisma.event.create({
      data: {
        id: eventId,
        mobile,
        name,
        email: email || null,
        occasionDate: parsedDate,
        occasionDay: parsedDate.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        occasionTime: occasionTime || "",
        description,
        hall: Array.isArray(hall) ? hall : [hall],
        catererName: catererName || "",
        catererPhone: catererPhone || "",
        thaalCount: Number(thaalCount) || 0,
        sarkariThaalSet: Number(sarkariThaalSet) || 0,
        extraChilamchiLota: Number(extraChilamchiLota) || 0,
        tablesAndChairs: Number(tablesAndChairs) || 0,
        bhaiSaabIzzan: Boolean(bhaiSaabIzzan),
        benSaabIzzan: Boolean(benSaabIzzan),
        mic: Boolean(mic),
        crockeryRequired: Boolean(crockeryRequired),
        crockeryStatus: crockeryRequired
          ? ("PENDING" as CrockeryStatus)
          : ("NOT_REQUIRED" as CrockeryStatus),
        thaalForDevri: Boolean(thaalForDevri),
        paat: Boolean(paat),
        masjidLight: Boolean(masjidLight),
        acStartTime: acStartTime || null,
        partyTime: partyTime || null,
        decorations: Boolean(decorations),
        gasCount: gasCount ? Number(gasCount) : null,
        menu: menu || null,
        eventType: eventType || "PRIVATE",
        hallCounts: hallCounts || null,
        createdById: user.id || null,
      },
    });

    // Send email to admins and booker
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const adminEmails = admins
        .map((a) => a.email)
        .filter((e): e is string => !!e);

      if (adminEmails.length > 0 || email) {
        const { newEventTemplate, sendEmail } = await import("@/lib/email");
        const { generatePdf, eventPdfTemplate } = await import("@/lib/pdf");

        // Prepare event data for PDF
        const eventDataForPdf = {
          ...newEvent,
          occasionDate: newEvent.occasionDate.toISOString(),
          createdAt: newEvent.createdAt.toISOString(),
          updatedAt: newEvent.updatedAt.toISOString(),
        };

        // Generate PDF
        let pdfBuffer: Buffer | undefined;
        try {
          const pdfHtml = eventPdfTemplate(eventDataForPdf as any);
          pdfBuffer = await generatePdf(pdfHtml);
        } catch (pdfError) {
          console.error("Failed to generate PDF:", pdfError);
        }

        const attachments = pdfBuffer
          ? [
              {
                filename: `Event_${name.replace(/\s+/g, "_")}_${occasionDate}.pdf`,
                content: pdfBuffer,
              },
            ]
          : undefined;

        // Send to Admins
        if (adminEmails.length > 0) {
          await sendEmail({
            to: adminEmails,
            subject: `New Event: ${name}`,
            html: newEventTemplate({
              name,
              mobile,
              occasionDate,
              occasionTime,
              hall: Array.isArray(hall) ? hall.join(", ") : hall,
              thaalCount: Number(thaalCount),
            }),
            attachments,
          });
        }

        // Send to Booker
        if (email) {
          await sendEmail({
            to: email,
            subject: `Booking Confirmation: ${name}`,
            html: newEventTemplate({
              name,
              mobile,
              occasionDate,
              occasionTime,
              hall: Array.isArray(hall) ? hall.join(", ") : hall,
              thaalCount: Number(thaalCount),
            }),
            attachments,
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send new event email:", emailError);
    }

    // Return with formatted dates
    return NextResponse.json(
      {
        ...newEvent,
        occasionDate: newEvent.occasionDate.toISOString(),
        createdAt: newEvent.createdAt.toISOString(),
        updatedAt: newEvent.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
