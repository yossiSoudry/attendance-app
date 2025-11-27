// lib/calculations/overtime.ts

/**
 * חישוב שעות נוספות לפי חוק שעות עבודה ומנוחה הישראלי
 *
 * מגזר פרטי - 5 ימים בשבוע (42 שעות שבועיות):
 * - 4 ימים רגילים: 8:36 (8.6 שעות) = יום מלא
 * - יום אחד מקוצר: 7:36 (7.6 שעות) = יום מלא
 *
 * מגזר פרטי - 6 ימים בשבוע (42 שעות שבועיות):
 * - ימים א'-ה': 8 שעות = יום מלא
 * - יום שישי: 7 שעות = יום מלא
 *
 * משמרת לילה: 7 שעות = יום מלא
 *
 * גמול שעות נוספות (יום חול):
 * - 2 שעות נוספות ראשונות: 125%
 * - מהשעה השלישית ואילך: 150%
 *
 * גמול שעות נוספות (שבת/חג):
 * - 2 שעות נוספות ראשונות: 175%
 * - מהשעה השלישית ואילך: 200%
 */

export type WorkWeekType = "5_DAYS" | "6_DAYS";
export type ShiftType = "REGULAR" | "SHORT_DAY" | "NIGHT" | "FRIDAY" | "SHABBAT" | "HOLIDAY";

export type WorkRulesConfig = {
  // מספר ימי עבודה בשבוע
  workWeekType: WorkWeekType;

  // שעות רגילות ליום (5 ימים בשבוע)
  dailyStandardHours5Days: number; // 8.6 (8:36)
  dailyShortDayHours5Days: number; // 7.6 (7:36)

  // שעות רגילות ליום (6 ימים בשבוע)
  dailyStandardHours6Days: number; // 8
  dailyFridayHours6Days: number; // 7

  // משמרת לילה
  nightShiftHours: number; // 7

  // מכסה שבועית
  weeklyStandardHours: number; // 42

  // תעריפי שעות נוספות
  overtimeFirstRate: number; // 1.25
  overtimeSecondRate: number; // 1.5
  overtimeFirstHours: number; // 2 שעות ראשונות

  // תעריפי שבת/חג
  shabbatHolidayRate: number; // 1.5 (50% תוספת)
  shabbatOvertimeFirstRate: number; // 1.75
  shabbatOvertimeSecondRate: number; // 2.0

  // מקסימום שעות ביום
  maxDailyHours: number; // 12
};

export const DEFAULT_WORK_RULES: WorkRulesConfig = {
  workWeekType: "5_DAYS",

  // 5 ימים בשבוע
  dailyStandardHours5Days: 8.6, // 8:36
  dailyShortDayHours5Days: 7.6, // 7:36

  // 6 ימים בשבוע
  dailyStandardHours6Days: 8,
  dailyFridayHours6Days: 7,

  // משמרת לילה
  nightShiftHours: 7,

  // מכסה שבועית
  weeklyStandardHours: 42,

  // תעריפי שעות נוספות - יום חול
  overtimeFirstRate: 1.25,
  overtimeSecondRate: 1.5,
  overtimeFirstHours: 2,

  // תעריפי שבת/חג
  shabbatHolidayRate: 1.5,
  shabbatOvertimeFirstRate: 1.75,
  shabbatOvertimeSecondRate: 2.0,

  maxDailyHours: 12,
};

export type OvertimeBreakdown = {
  // שעות רגילות (100%)
  regularMinutes: number;

  // שעות נוספות יום חול
  overtime125Minutes: number; // 125%
  overtime150Minutes: number; // 150%

  // שעות שבת/חג
  shabbatRegularMinutes: number; // 150%
  shabbatOvertime175Minutes: number; // 175%
  shabbatOvertime200Minutes: number; // 200%

  totalMinutes: number;
};

/**
 * מחזיר את מספר השעות הרגילות ליום לפי סוג המשמרת
 */
export function getDailyStandardHours(
  shiftType: ShiftType,
  rules: WorkRulesConfig = DEFAULT_WORK_RULES
): number {
  switch (shiftType) {
    case "NIGHT":
      return rules.nightShiftHours;

    case "SHORT_DAY":
      return rules.workWeekType === "5_DAYS"
        ? rules.dailyShortDayHours5Days
        : rules.dailyStandardHours6Days;

    case "FRIDAY":
      return rules.workWeekType === "6_DAYS"
        ? rules.dailyFridayHours6Days
        : rules.dailyStandardHours5Days;

    case "SHABBAT":
    case "HOLIDAY":
      // בשבת/חג - כל השעות הן שעות נוספות אם השלים מכסה שבועית
      return 0;

    case "REGULAR":
    default:
      return rules.workWeekType === "5_DAYS"
        ? rules.dailyStandardHours5Days
        : rules.dailyStandardHours6Days;
  }
}

/**
 * מחשב את חלוקת השעות לרגילות ונוספות - ברמה יומית
 * @param totalMinutes - סה"כ דקות עבודה
 * @param shiftType - סוג המשמרת
 * @param rules - חוקי העבודה
 * @returns חלוקה לשעות רגילות ונוספות
 */
export function calculateDailyOvertimeBreakdown(
  totalMinutes: number,
  shiftType: ShiftType = "REGULAR",
  rules: WorkRulesConfig = DEFAULT_WORK_RULES
): OvertimeBreakdown {
  const totalHours = totalMinutes / 60;
  const dailyStandardHours = getDailyStandardHours(shiftType, rules);

  // אתחול תוצאה
  const result: OvertimeBreakdown = {
    regularMinutes: 0,
    overtime125Minutes: 0,
    overtime150Minutes: 0,
    shabbatRegularMinutes: 0,
    shabbatOvertime175Minutes: 0,
    shabbatOvertime200Minutes: 0,
    totalMinutes: Math.round(totalMinutes),
  };

  // עבודה בשבת או חג
  if (shiftType === "SHABBAT" || shiftType === "HOLIDAY") {
    return calculateShabbatHolidayBreakdown(totalHours, rules);
  }

  // יום חול רגיל
  // שעות רגילות (עד התקן היומי)
  const regularHours = Math.min(totalHours, dailyStandardHours);
  result.regularMinutes = Math.round(regularHours * 60);

  // שעות נוספות
  if (totalHours > dailyStandardHours) {
    const overtimeHours = totalHours - dailyStandardHours;

    // 2 שעות נוספות ראשונות - 125%
    const overtime125Hours = Math.min(overtimeHours, rules.overtimeFirstHours);
    result.overtime125Minutes = Math.round(overtime125Hours * 60);

    // שאר השעות הנוספות - 150%
    if (overtimeHours > rules.overtimeFirstHours) {
      const overtime150Hours = overtimeHours - rules.overtimeFirstHours;
      result.overtime150Minutes = Math.round(overtime150Hours * 60);
    }
  }

  return result;
}

/**
 * מחשב חלוקת שעות לעבודה בשבת/חג
 */
function calculateShabbatHolidayBreakdown(
  totalHours: number,
  rules: WorkRulesConfig
): OvertimeBreakdown {
  const result: OvertimeBreakdown = {
    regularMinutes: 0,
    overtime125Minutes: 0,
    overtime150Minutes: 0,
    shabbatRegularMinutes: 0,
    shabbatOvertime175Minutes: 0,
    shabbatOvertime200Minutes: 0,
    totalMinutes: Math.round(totalHours * 60),
  };

  // בשבת/חג, אם העובד השלים את המכסה השבועית,
  // כל השעות הן שעות נוספות מהשעה הראשונה.
  // לצורך הפשטות, נניח שהעובד השלים את המכסה.

  // לפי החוק:
  // - שעתיים ראשונות: 175% (100% + 50% שבת + 25% נוספות)
  // - מהשעה השלישית: 200% (100% + 50% שבת + 50% נוספות)

  // שעתיים נוספות ראשונות - 175%
  const overtime175Hours = Math.min(totalHours, rules.overtimeFirstHours);
  result.shabbatOvertime175Minutes = Math.round(overtime175Hours * 60);

  // שאר השעות - 200%
  if (totalHours > rules.overtimeFirstHours) {
    const overtime200Hours = totalHours - rules.overtimeFirstHours;
    result.shabbatOvertime200Minutes = Math.round(overtime200Hours * 60);
  }

  return result;
}

/**
 * מחשב שעות נוספות ברמה שבועית
 * נקרא אחרי החישוב היומי לכל ימי השבוע
 *
 * @param weeklyRegularMinutes - סה"כ דקות רגילות (לא נוספות) שעבד העובד השבוע
 * @param rules - חוקי העבודה
 * @returns דקות נוספות ברמה שבועית
 */
export function calculateWeeklyOvertimeMinutes(
  weeklyRegularMinutes: number,
  rules: WorkRulesConfig = DEFAULT_WORK_RULES
): { overtime125Minutes: number; overtime150Minutes: number } {
  const weeklyRegularHours = weeklyRegularMinutes / 60;
  const weeklyStandardHours = rules.weeklyStandardHours;

  if (weeklyRegularHours <= weeklyStandardHours) {
    return { overtime125Minutes: 0, overtime150Minutes: 0 };
  }

  const overtimeHours = weeklyRegularHours - weeklyStandardHours;

  // 2 שעות נוספות ראשונות - 125%
  const overtime125Hours = Math.min(overtimeHours, rules.overtimeFirstHours);

  // שאר השעות - 150%
  const overtime150Hours = Math.max(0, overtimeHours - rules.overtimeFirstHours);

  return {
    overtime125Minutes: Math.round(overtime125Hours * 60),
    overtime150Minutes: Math.round(overtime150Hours * 60),
  };
}

/**
 * מחשב את משך המשמרת בדקות
 */
export function calculateShiftDurationMinutes(
  startTime: Date,
  endTime: Date
): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

/**
 * קובע את סוג המשמרת לפי שעת ההתחלה והיום בשבוע
 */
export function determineShiftType(
  startTime: Date,
  isShortDay: boolean = false,
  isHoliday: boolean = false
): ShiftType {
  // בדיקה אם חג
  if (isHoliday) {
    return "HOLIDAY";
  }

  const dayOfWeek = startTime.getDay(); // 0 = ראשון, 6 = שבת
  const hour = startTime.getHours();

  // שבת (מיום שישי אחה"צ עד מוצ"ש)
  if (dayOfWeek === 6) {
    return "SHABBAT";
  }

  // יום שישי
  if (dayOfWeek === 5) {
    // אם אחרי כניסת שבת (נניח 18:00 לצורך הדוגמה)
    if (hour >= 18) {
      return "SHABBAT";
    }
    return "FRIDAY";
  }

  // משמרת לילה (22:00 - 06:00)
  if (hour >= 22 || hour < 6) {
    return "NIGHT";
  }

  // יום מקוצר
  if (isShortDay) {
    return "SHORT_DAY";
  }

  return "REGULAR";
}

/**
 * פורמט שעות ודקות
 */
export function formatMinutesToHoursAndMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

/**
 * פורמט שעות עשרוני
 */
export function formatMinutesToDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

/**
 * המרת שעות עשרוניות לדקות
 * לדוגמה: 8.6 שעות = 8 שעות ו-36 דקות = 516 דקות
 */
export function decimalHoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}