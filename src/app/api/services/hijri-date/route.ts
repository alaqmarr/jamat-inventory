import { NextResponse } from "next/server";
import { getMisriDate } from "@/lib/misri-calendar";
import { formatIST } from "@/lib/utils";

// External Hijri Calendar API
const HIJRI_API_URL = "https://hijricalendar.alaqmar.dev/api/hijri";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || searchParams.get("gDate");

  const effectiveDate = dateParam ? dateParam : new Date();
  const formattedDate = formatIST(effectiveDate, "yyyy-MM-dd");

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
      const hijri = getMisriDate(formattedDate);

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
