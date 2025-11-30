// app/admin/calendar/_actions/calendar-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CalendarEventType } from "@prisma/client";

// ========================================
// Types
// ========================================

type CreateEventInput = {
  gregorianDate: Date;
  hebrewDate?: string;
  eventType: CalendarEventType;
  nameHe: string;
  nameEn?: string;
  isRestDay: boolean;
  isShortDay: boolean;
};

type UpdateEventInput = CreateEventInput & {
  id: string;
};

// ========================================
// Actions
// ========================================

export async function createCalendarEvent(input: CreateEventInput) {
  try {
    const event = await prisma.calendarEvent.create({
      data: {
        gregorianDate: input.gregorianDate,
        hebrewDate: input.hebrewDate,
        eventType: input.eventType,
        nameHe: input.nameHe,
        nameEn: input.nameEn,
        isRestDay: input.isRestDay,
        isShortDay: input.isShortDay,
      },
    });

    revalidatePath("/admin/calendar");
    return { success: true, event };
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return { success: false, error: "אירעה שגיאה ביצירת האירוע" };
  }
}

export async function updateCalendarEvent(input: UpdateEventInput) {
  try {
    const event = await prisma.calendarEvent.update({
      where: { id: input.id },
      data: {
        gregorianDate: input.gregorianDate,
        hebrewDate: input.hebrewDate,
        eventType: input.eventType,
        nameHe: input.nameHe,
        nameEn: input.nameEn,
        isRestDay: input.isRestDay,
        isShortDay: input.isShortDay,
      },
    });

    revalidatePath("/admin/calendar");
    return { success: true, event };
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    return { success: false, error: "אירעה שגיאה בעדכון האירוע" };
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    await prisma.calendarEvent.delete({
      where: { id },
    });

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    return { success: false, error: "אירעה שגיאה במחיקת האירוע" };
  }
}

export async function getCalendarEventsForYear(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const events = await prisma.calendarEvent.findMany({
    where: {
      gregorianDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { gregorianDate: "asc" },
  });

  return events;
}

export async function checkIfHoliday(date: Date): Promise<{
  isHoliday: boolean;
  isRestDay: boolean;
  isShortDay: boolean;
  eventName?: string;
}> {
  // Normalize date to start of day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const event = await prisma.calendarEvent.findFirst({
    where: {
      gregorianDate: {
        gte: dayStart,
        lte: dayEnd,
      },
      eventType: {
        in: ["HOLIDAY", "MEMORIAL"],
      },
    },
  });

  if (event) {
    return {
      isHoliday: true,
      isRestDay: event.isRestDay,
      isShortDay: event.isShortDay,
      eventName: event.nameHe,
    };
  }

  return {
    isHoliday: false,
    isRestDay: false,
    isShortDay: false,
  };
}

// Israeli Hebrew holidays data for automatic population
const hebrewHolidays2025 = [
  // פורים
  { date: "2025-03-14", nameHe: "פורים", nameEn: "Purim", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  // פסח
  { date: "2025-04-13", nameHe: "ערב פסח", nameEn: "Passover Eve", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-04-14", nameHe: "פסח - יום א'", nameEn: "Passover Day 1", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  { date: "2025-04-15", nameHe: "פסח - יום ב' (חול המועד)", nameEn: "Passover Day 2", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-04-16", nameHe: "פסח - יום ג' (חול המועד)", nameEn: "Passover Day 3", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-04-17", nameHe: "פסח - יום ד' (חול המועד)", nameEn: "Passover Day 4", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-04-18", nameHe: "פסח - יום ה' (חול המועד)", nameEn: "Passover Day 5", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-04-19", nameHe: "פסח - יום ו' (חול המועד)", nameEn: "Passover Day 6", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-04-20", nameHe: "שביעי של פסח", nameEn: "Passover Day 7", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // יום השואה
  { date: "2025-04-24", nameHe: "יום השואה", nameEn: "Holocaust Remembrance Day", eventType: "MEMORIAL" as CalendarEventType, isRestDay: false, isShortDay: false },
  // יום הזיכרון
  { date: "2025-05-01", nameHe: "יום הזיכרון", nameEn: "Memorial Day", eventType: "MEMORIAL" as CalendarEventType, isRestDay: false, isShortDay: true },
  // יום העצמאות
  { date: "2025-05-02", nameHe: "יום העצמאות", nameEn: "Independence Day", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // ל\"ג בעומר
  { date: "2025-05-16", nameHe: "ל\"ג בעומר", nameEn: "Lag BaOmer", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  // יום ירושלים
  { date: "2025-05-29", nameHe: "יום ירושלים", nameEn: "Jerusalem Day", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  // שבועות
  { date: "2025-06-02", nameHe: "ערב שבועות", nameEn: "Shavuot Eve", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-06-03", nameHe: "שבועות", nameEn: "Shavuot", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // תשעה באב
  { date: "2025-08-03", nameHe: "תשעה באב", nameEn: "Tisha B'Av", eventType: "FAST" as CalendarEventType, isRestDay: false, isShortDay: true },
  // ראש השנה
  { date: "2025-09-22", nameHe: "ערב ראש השנה", nameEn: "Rosh Hashanah Eve", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-09-23", nameHe: "ראש השנה - יום א'", nameEn: "Rosh Hashanah Day 1", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  { date: "2025-09-24", nameHe: "ראש השנה - יום ב'", nameEn: "Rosh Hashanah Day 2", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // צום גדליה
  { date: "2025-09-25", nameHe: "צום גדליה", nameEn: "Fast of Gedaliah", eventType: "FAST" as CalendarEventType, isRestDay: false, isShortDay: false },
  // יום כיפור
  { date: "2025-10-01", nameHe: "ערב יום כיפור", nameEn: "Yom Kippur Eve", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-10-02", nameHe: "יום כיפור", nameEn: "Yom Kippur", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // סוכות
  { date: "2025-10-06", nameHe: "ערב סוכות", nameEn: "Sukkot Eve", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-10-07", nameHe: "סוכות - יום א'", nameEn: "Sukkot Day 1", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  { date: "2025-10-08", nameHe: "סוכות - יום ב' (חול המועד)", nameEn: "Sukkot Day 2", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-10-09", nameHe: "סוכות - יום ג' (חול המועד)", nameEn: "Sukkot Day 3", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-10-10", nameHe: "סוכות - יום ד' (חול המועד)", nameEn: "Sukkot Day 4", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-10-11", nameHe: "סוכות - יום ה' (חול המועד)", nameEn: "Sukkot Day 5", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-10-12", nameHe: "הושענא רבה", nameEn: "Hoshana Rabbah", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: true },
  { date: "2025-10-13", nameHe: "שמיני עצרת / שמחת תורה", nameEn: "Simchat Torah", eventType: "HOLIDAY" as CalendarEventType, isRestDay: true, isShortDay: false },
  // חנוכה
  { date: "2025-12-15", nameHe: "חנוכה - יום א'", nameEn: "Hanukkah Day 1", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-16", nameHe: "חנוכה - יום ב'", nameEn: "Hanukkah Day 2", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-17", nameHe: "חנוכה - יום ג'", nameEn: "Hanukkah Day 3", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-18", nameHe: "חנוכה - יום ד'", nameEn: "Hanukkah Day 4", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-19", nameHe: "חנוכה - יום ה'", nameEn: "Hanukkah Day 5", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-20", nameHe: "חנוכה - יום ו'", nameEn: "Hanukkah Day 6", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-21", nameHe: "חנוכה - יום ז'", nameEn: "Hanukkah Day 7", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
  { date: "2025-12-22", nameHe: "חנוכה - יום ח'", nameEn: "Hanukkah Day 8", eventType: "HOLIDAY" as CalendarEventType, isRestDay: false, isShortDay: false },
];

export async function populateHebrewHolidays(year: number) {
  const holidays = year === 2025 ? hebrewHolidays2025 : [];

  if (holidays.length === 0) {
    return { success: false, error: `אין נתוני חגים לשנת ${year}` };
  }

  let created = 0;
  let skipped = 0;

  for (const holiday of holidays) {
    const gregorianDate = new Date(holiday.date);

    // Check if event already exists
    const existing = await prisma.calendarEvent.findFirst({
      where: {
        gregorianDate: {
          gte: new Date(gregorianDate.setHours(0, 0, 0, 0)),
          lte: new Date(gregorianDate.setHours(23, 59, 59, 999)),
        },
        nameHe: holiday.nameHe,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.calendarEvent.create({
      data: {
        gregorianDate: new Date(holiday.date),
        eventType: holiday.eventType,
        nameHe: holiday.nameHe,
        nameEn: holiday.nameEn,
        isRestDay: holiday.isRestDay,
        isShortDay: holiday.isShortDay,
      },
    });
    created++;
  }

  revalidatePath("/admin/calendar");
  return {
    success: true,
    message: `נוצרו ${created} אירועים, ${skipped} כבר קיימים`
  };
}
