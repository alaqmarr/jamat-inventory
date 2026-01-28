export const MISRI_MONTH_NAMES_EN = [
  "Moharram-ul-Haraam",
  "Safar-ul-Muzaffar",
  "Rabi-ul-Awwal",
  "Rabi-ul-Aakhar",
  "Jumadal-Ula",
  "Jumadal-Ukhra",
  "Rajab-ul-Asab",
  "Shaban-ul-Karim",
  "Ramadan-ul-Moazzam",
  "Shawwal-ul-Mukarram",
  "Zilqadat-il-Haraam",
  "Zilhaj-il-Haraam",
];

export const MISRI_MONTH_NAMES_AR = [
  "محرم الحرام",
  "صفر المظفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الأخرى",
  "رجب الأصب",
  "شعبان الكريم",
  "رمضان المعظم",
  "شوال المكرم",
  "ذو القعدة الحرام",
  "ذو الحجة الحرام",
];

const LEAP_YEARS_PATTERN = [2, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29];

// Julian Day for Misri Epoch: Friday, July 16, 622 AD
// Adjusted by -1 to align with Dawoodi Bohra calendar observation (e.g. 28 Jan 2026 = 10 Shabaan)
const MISRI_EPOCH_JD = 1948439;

function getJulianDay(date: Date): number {
  const time = date.getTime();
  const tzOffset = date.getTimezoneOffset() * 60 * 1000;
  // Add timezone offset to get UTC time roughly, but better to rely on UTC date methods or raw timestamp
  // JD = (UnixTime / 86400000.0) + 2440587.5
  // But we want the integer day number starting at noon?
  // Canonical calculation:
  return Math.floor((time - tzOffset) / 86400000.0) + 2440587.5;
}

// Convert Gregorian Date to Misri Date
export function getMisriDate(date: Date) {
  // 1. Calculate Julian Day
  // Adjust for local time being passed in. We assume the input date is "Noon" of the day we want to convert
  // to avoid boundary issues.
  // If the user selects "Jan 28", we want the JD for Jan 28.

  // Create a UTC date for the same 'day' to avoid timezone shifts affecting the integer math
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Algorithm from "Astronomical Algorithms" (Jean Meeus) for JD
  // Simplified for our purpose since we use standard JS Date to get values
  let a = Math.floor((14 - (month + 1)) / 12);
  let y = year + 4800 - a;
  let m = month + 1 + 12 * a - 3;
  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Days since Misri Epoch
  let daysSince = jd - MISRI_EPOCH_JD;

  // 2. 30-Year Cycles
  // Days in 30 years = (19 * 354) + (11 * 355) = 6726 + 3905 = 10631
  const daysIn30Years = 10631;
  const cycles = Math.floor(daysSince / daysIn30Years);
  let remainingDays = daysSince % daysIn30Years;

  let hijriYear = cycles * 30 + 1;

  // 3. Process years within the cycle
  // Loop through years 1-30
  for (let i = 1; i <= 30; i++) {
    const isLeap = LEAP_YEARS_PATTERN.includes(i);
    const daysInYear = isLeap ? 355 : 354;

    if (remainingDays < daysInYear) {
      break;
    }
    remainingDays -= daysInYear;
    hijriYear++;
  }

  // 4. Process months within the year
  let hijriMonth = 0; // 0-indexed for array access
  // Month lengths: Odd=30, Even=29. 12th=30 if leap.
  // Check if current hijriYear is leap in its cycle
  // Cycle year = (hijriYear - 1) % 30 + 1
  const currentCycleYear = ((hijriYear - 1) % 30) + 1;
  const isCurrentLeap = LEAP_YEARS_PATTERN.includes(currentCycleYear);

  for (let m = 0; m < 12; m++) {
    let daysInMonth = 0;
    if (m === 11) {
      // 12th Month (Zilhaj)
      daysInMonth = isCurrentLeap ? 30 : 29;
    } else {
      // Even months (1, 3, 5 -> indices 1, 3, 5...) are 29 days (Safar, Rabi-2...)
      // Odd months (1, 3, 5...) are 30 days.
      // 0-indexed: 0 (Muharram) = 30, 1 (Safar) = 29.
      // So: if index even -> 30, if index odd -> 29.
      daysInMonth = m % 2 === 0 ? 30 : 29;
    }

    if (remainingDays < daysInMonth) {
      hijriMonth = m;
      break;
    }
    remainingDays -= daysInMonth;
  }

  const hijriDay = remainingDays + 1; // +1 because days are 1-indexed

  // Format Arabic Numerals
  const toArabicNumerals = (n: number) =>
    n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);

  return {
    day: hijriDay,
    month: hijriMonth + 1, // 1-indexed for display
    year: hijriYear,
    monthNameEn: MISRI_MONTH_NAMES_EN[hijriMonth],
    monthNameAr: MISRI_MONTH_NAMES_AR[hijriMonth],
    dayAr: toArabicNumerals(hijriDay),
    yearAr: toArabicNumerals(hijriYear),
    formattedEn: `${hijriDay}${getOrdinal(hijriDay)} ${MISRI_MONTH_NAMES_EN[hijriMonth]} ${hijriYear}`,
    formattedAr: `${toArabicNumerals(hijriDay)} ${MISRI_MONTH_NAMES_AR[hijriMonth]} ${toArabicNumerals(hijriYear)}`,
  };
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
