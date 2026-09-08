import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const IST_TIMEZONE = "Asia/Kolkata";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats any date input in IST timezone safely.
 */
export function formatIST(
  date: string | Date | number | null | undefined,
  formatStr: string
): string {
  if (!date) return "";
  const d = typeof date === "number" || date instanceof Date ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return "";
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

/**
 * Returns IST start and end bounds in UTC Date objects for day-filtering queries.
 * @param dateStr ISO date string or Date
 */
export function getISTDayBounds(date: string | Date): { startOfDay: Date; endOfDay: Date } {
  let dateStr: string;
  if (typeof date === "string") {
    if (date.includes("T")) {
      dateStr = formatInTimeZone(new Date(date), IST_TIMEZONE, "yyyy-MM-dd");
    } else {
      dateStr = date.trim();
    }
  } else {
    dateStr = formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd");
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const year = match ? parseInt(match[1], 10) : 1970;
  const month = match ? parseInt(match[2], 10) - 1 : 0;
  const day = match ? parseInt(match[3], 10) : 1;

  // IST is UTC + 05:30.
  // 00:00:00.000 IST on YYYY-MM-DD corresponds to (Date.UTC(year, month, day, 0, 0, 0, 0) - 5.5h) in UTC.
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000);
  // 23:59:59.999 IST corresponds to startOfDay + 24h - 1ms.
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startOfDay, endOfDay };
}

/**
 * Parse time string (supports "HH:mm", "hh:mm a", "h:mm a", "h:mma", etc.) combined with a date in IST.
 * Returns a UTC Date object representing that exact instant.
 */
export function parseISTEventDateTime(
  dateInput: string | Date,
  timeStr: string | null | undefined
): Date {
  let datePart: string;
  if (typeof dateInput === "string") {
    if (dateInput.includes("T")) {
      datePart = formatInTimeZone(new Date(dateInput), IST_TIMEZONE, "yyyy-MM-dd");
    } else {
      datePart = dateInput.trim();
    }
  } else {
    datePart = formatInTimeZone(dateInput, IST_TIMEZONE, "yyyy-MM-dd");
  }

  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const year = match ? parseInt(match[1], 10) : 1970;
  const month = match ? parseInt(match[2], 10) - 1 : 0;
  const day = match ? parseInt(match[3], 10) : 1;

  let hours = 0;
  let minutes = 0;

  if (timeStr && timeStr.trim() !== "" && timeStr.toUpperCase() !== "NA") {
    const clean = timeStr.trim();
    const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*([apAP][mM])$/);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const ampm = match12[3].toUpperCase();
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      hours = h;
      minutes = m;
    } else {
      const match24 = clean.match(/^(\d{1,2}):(\d{2})/);
      if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
      }
    }
  }

  const utcMs = Date.UTC(year, month, day, hours, minutes, 0, 0) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMs);
}

/**
 * Adjusts a date to represent IST for display purposes.
 * Retained for backward compatibility.
 */
export function getISTDate(date: string | Date | undefined | null): Date {
  if (!date) return new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date();
  return toZonedTime(d, IST_TIMEZONE);
}

/**
 * Converts text to URL-friendly slug for generating meaningful IDs.
 * Example: "Nikah Ceremony" → "nikah-ceremony"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Checks if an event is "locked" (ended more than 48 hours ago).
 * Locked events cannot be edited, deleted, or cancelled.
 * Combines occasionDate and occasionTime so events are not prematurely locked.
 */
export function isEventLocked(
  eventDate: string | Date | undefined | null,
  occasionTime?: string | null,
): boolean {
  if (!eventDate) return false;
  const eventDateTime = parseISTEventDateTime(eventDate, occasionTime);
  if (isNaN(eventDateTime.getTime())) return false;
  const now = new Date();
  // 48 hours in milliseconds = 48 * 60 * 60 * 1000 = 172800000
  const diff = now.getTime() - eventDateTime.getTime();
  return diff >= 172800000;
}
