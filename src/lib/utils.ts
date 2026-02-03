import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Adjusts a date to represent IST (UTC+5:30) for display purposes.
 * This effectively adds 5.5 hours to the timestamp so that UTC-based formatters
 * render the correct day for Indian events.
 */
export function getISTDate(date: string | Date | undefined | null): Date {
  if (!date) return new Date();
  const d = new Date(date);
  // Add 5 hours 30 minutes in milliseconds
  return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
}

/**
 * Converts text to URL-friendly slug for generating meaningful IDs.
 * Example: "Nikah Ceremony" → "nikah-ceremony"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Checks if an event is "locked" (ended more than 48 hours ago).
 * Locked events cannot be edited, deleted, or cancelled.
 * @param eventDate string or Date object of the event occasion
 */
export function isEventLocked(
  eventDate: string | Date | undefined | null,
): boolean {
  if (!eventDate) return false;
  const date = new Date(eventDate);
  const now = new Date();
  // 48 hours in milliseconds = 48 * 60 * 60 * 1000 = 172800000
  const diff = now.getTime() - date.getTime();
  return diff > 172800000;
}
