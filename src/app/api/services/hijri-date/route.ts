import { NextResponse } from "next/server";
import { getMisriDate } from "@/lib/misri-calendar";
import { format } from "date-fns";

// External Hijri Calendar API
const HIJRI_API_URL = "https://hijricalendar.alaqmar.dev/api/hijri";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || searchParams.get("gDate");

  let date: Date;
  if (dateParam) {
    // Parse "YYYY-MM-DD" as UTC Midnight
    date = new Date(dateParam);
  } else {
    // Default to Today IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    // Create UTC date mirroring the IST components
    date = new Date(
      Date.UTC(
        istTime.getUTCFullYear(),
        istTime.getUTCMonth(),
        istTime.getUTCDate(),
        12,
        0,
        0,
      ),
    );
  }

  // Format date as IST for external API (YYYY-MM-DD)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  const formattedDate = format(istDate, "yyyy-MM-dd");

  try {
    // Try external API first
    const externalRes = await fetch(`${HIJRI_API_URL}?date=${formattedDate}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (externalRes.ok) {
      const externalData = await externalRes.json();

      // Return data in the same format as before
      return NextResponse.json({
        hijri: externalData.hijri || externalData.formattedEn,
        arabic: externalData.arabic || externalData.formattedAr,
        // Pass through additional data if available
        ...externalData,
      });
    }

    // If external API failed, fall back to local calculation
    console.warn("External Hijri API failed, using local calculation");
    throw new Error("External API failed");
  } catch (error) {
    // Fallback to local calculation
    try {
      const hijri = getMisriDate(date);

      return NextResponse.json({
        hijri: hijri.formattedEn,
        arabic: hijri.formattedAr,
        source: "local_fallback",
      });
    } catch (localError) {
      console.error("Hijri Calculation Error:", localError);
      return NextResponse.json(
        { error: "Failed to calculate Hijri date" },
        { status: 500 },
      );
    }
  }
}
