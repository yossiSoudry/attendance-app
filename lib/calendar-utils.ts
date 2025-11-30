// lib/calendar-utils.ts
import { prisma } from "@/lib/prisma";

export type HolidayInfo = {
  isHoliday: boolean;
  isRestDay: boolean;
  isShortDay: boolean;
  eventName?: string;
  eventType?: string;
};

/**
 * בודק האם תאריך מסוים הוא חג או יום מיוחד
 * מחזיר מידע על היום אם הוא חג/צום/יום זיכרון
 */
export async function checkDateForHoliday(date: Date): Promise<HolidayInfo> {
  // נרמל תאריך לתחילת היום
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
      // רק חגים וימי זיכרון משפיעים על חישוב שכר
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
      eventType: event.eventType,
    };
  }

  return {
    isHoliday: false,
    isRestDay: false,
    isShortDay: false,
  };
}

/**
 * בודק האם יום הוא ערב חג (יום קצר)
 */
export async function isShortDay(date: Date): Promise<boolean> {
  const info = await checkDateForHoliday(date);
  return info.isShortDay;
}

/**
 * בודק האם יום הוא יום חג/מנוחה
 */
export async function isRestDay(date: Date): Promise<boolean> {
  const info = await checkDateForHoliday(date);
  return info.isRestDay;
}

/**
 * מחזיר מידע על חגים לתקופה נתונה
 * שימושי לטעינה מראש של כל החגים בחודש
 */
export async function getHolidaysForPeriod(
  startDate: Date,
  endDate: Date
): Promise<Map<string, HolidayInfo>> {
  const events = await prisma.calendarEvent.findMany({
    where: {
      gregorianDate: {
        gte: startDate,
        lte: endDate,
      },
      eventType: {
        in: ["HOLIDAY", "MEMORIAL"],
      },
    },
  });

  const holidayMap = new Map<string, HolidayInfo>();

  for (const event of events) {
    // מפתח לפי תאריך בלבד (ללא שעה)
    const dateKey = event.gregorianDate.toISOString().split("T")[0];

    holidayMap.set(dateKey, {
      isHoliday: true,
      isRestDay: event.isRestDay,
      isShortDay: event.isShortDay,
      eventName: event.nameHe,
      eventType: event.eventType,
    });
  }

  return holidayMap;
}

/**
 * פונקציה לקבלת מידע על חג מתוך Map מטומן
 * (יותר יעיל מקריאה לDB לכל משמרת בנפרד)
 */
export function getHolidayInfoFromMap(
  holidayMap: Map<string, HolidayInfo>,
  date: Date
): HolidayInfo {
  const dateKey = date.toISOString().split("T")[0];
  return (
    holidayMap.get(dateKey) ?? {
      isHoliday: false,
      isRestDay: false,
      isShortDay: false,
    }
  );
}
