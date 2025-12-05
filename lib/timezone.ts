// lib/timezone.ts
import { prisma } from "@/lib/prisma";

// Cache for timezone to avoid repeated DB calls
let cachedTimezone: string | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Get the platform timezone from settings
 * Uses caching to avoid repeated DB calls
 */
export async function getPlatformTimezone(): Promise<string> {
  const now = Date.now();

  if (cachedTimezone && now < cacheExpiry) {
    return cachedTimezone;
  }

  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
  });

  cachedTimezone = settings?.timezone || "Asia/Jerusalem";
  cacheExpiry = now + CACHE_TTL;

  return cachedTimezone;
}

/**
 * Clear the timezone cache (call after updating settings)
 */
export function clearTimezoneCache(): void {
  cachedTimezone = null;
  cacheExpiry = 0;
}

/**
 * Format a date to the platform timezone
 */
export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleString("he-IL", {
    timeZone: timezone,
    ...options,
  });
}

/**
 * Format time only (HH:MM)
 */
export function formatTimeInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatDateInTimezone(date, timezone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format date only (DD/MM/YYYY)
 */
export function formatDateOnlyInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatDateInTimezone(date, timezone, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format date and time (DD/MM/YYYY HH:MM)
 */
export function formatDateTimeInTimezone(
  date: Date | string,
  timezone: string
): string {
  return formatDateInTimezone(date, timezone, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get current date/time in the platform timezone
 */
export function getNowInTimezone(timezone: string): Date {
  // Create a date string in the target timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
  );
}

/**
 * Get start of day in the platform timezone
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00`);
}

/**
 * Get end of day in the platform timezone
 */
export function getEndOfDayInTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";

  return new Date(`${get("year")}-${get("month")}-${get("day")}T23:59:59.999`);
}
