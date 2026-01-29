"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getEventsForExport(startDate: Date, endDate: Date) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        occasionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        occasionDate: "asc",
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform for Export if needed, or just return raw
    // Return raw for client-side formatting
    return events;
  } catch (error) {
    console.error("Export Fetch Error", error);
    throw new Error("Failed to fetch export data");
  }
}
