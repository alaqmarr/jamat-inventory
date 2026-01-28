import { format } from "date-fns";

const toArabicNumerals = (str: string) => {
  return str.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};

const MONTH_MAP: Record<string, string> = {
  muharram: "محرم الحرام",
  safar: "صفر المظفر",
  "rabi-ul-awwal": "ربيع الأول",
  "rabi-ul-akhar": "ربيع الآخر",
  "jumada-al-ula": "جمادى الأولى",
  "jumada-al-ukhra": "جمادى الآخرة",
  rajab: "رجب الأصب",
  shabaan: "شعبان الكريم",
  ramadan: "رمضان المعظم",
  shawwal: "شوال المكرم",
  zilqad: "ذو القعدة الحرام",
  zilhaj: "ذو الحجة الحرام",
};

// Helper to fuzzy match month names from AajNoDin
const getArabicMonth = (englishName: string) => {
  const lower = englishName.toLowerCase();
  if (lower.includes("muharram")) return MONTH_MAP["muharram"];
  if (lower.includes("safar")) return MONTH_MAP["safar"];
  if (lower.includes("rabi") && lower.includes("awwal"))
    return MONTH_MAP["rabi-ul-awwal"];
  if (
    lower.includes("rabi") &&
    (lower.includes("akhar") || lower.includes("thani"))
  )
    return MONTH_MAP["rabi-ul-akhar"];
  if (lower.includes("jumada") && lower.includes("ula"))
    return MONTH_MAP["jumada-al-ula"];
  if (
    lower.includes("jumada") &&
    (lower.includes("ukhra") || lower.includes("thani"))
  )
    return MONTH_MAP["jumada-al-ukhra"];
  if (lower.includes("rajab")) return MONTH_MAP["rajab"];
  if (lower.includes("shabaan")) return MONTH_MAP["shabaan"];
  if (lower.includes("ramadan")) return MONTH_MAP["ramadan"];
  if (lower.includes("shawwal")) return MONTH_MAP["shawwal"];
  if (lower.includes("zilqad") || lower.includes("dhul-qad"))
    return MONTH_MAP["zilqad"];
  if (lower.includes("zilhaj") || lower.includes("dhul-hijj"))
    return MONTH_MAP["zilhaj"];
  return englishName; // Fallback
};

export interface HijriDate {
  english: string;
  arabic: string;
}

export async function getHijriDate(
  date: Date | string,
): Promise<HijriDate | null> {
  try {
    const dateStr =
      typeof date === "string" ? date : format(date, "yyyy-MM-dd");
    // Ensure we handle the format correctly if a full ISO string is passed
    const formattedDate = dateStr.includes("T")
      ? format(new Date(dateStr), "yyyy-MM-dd")
      : dateStr;

    const targetUrl = `https://aajnodin.com/?gdate=${formattedDate}`;
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour to avoid spamming
    });

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(
      /<span class="hdrDateDay">\s*<strong>(.*?)<\/strong>\s*<\/span>/i,
    );

    if (match && match[1]) {
      let hijriEn = match[1]
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Parse for Arabic translation
      // Expected format: "10th Shabaan-ul-Karim 1447"
      const dateParts = hijriEn.match(
        /^(\d+)(?:st|nd|rd|th)?\s+(.*?)\s+(\d{4})$/,
      );

      let hijriAr = hijriEn; // Default to English if parse fails

      if (dateParts) {
        const day = dateParts[1];
        const month = dateParts[2];
        const year = dateParts[3];

        const arDay = toArabicNumerals(day);
        const arMonth = getArabicMonth(month);
        const arYear = toArabicNumerals(year);

        hijriAr = `${arDay} ${arMonth} ${arYear}`;
      }

      return { english: hijriEn, arabic: hijriAr };
    }
    return null;
  } catch (error) {
    console.error("Hijri Scrape Error:", error);
    return null;
  }
}
