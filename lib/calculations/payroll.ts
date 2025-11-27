// lib/calculations/payroll.ts

import {
  calculateDailyOvertimeBreakdown,
  calculateShiftDurationMinutes,
  determineShiftType,
  type OvertimeBreakdown,
  type WorkRulesConfig,
  type ShiftType,
  DEFAULT_WORK_RULES,
} from "./overtime";

export type BonusInfo = {
  id: string;
  bonusType: "HOURLY" | "ONE_TIME";
  amountPerHour: number | null; // באגורות
  amountFixed: number | null; // באגורות
  validFrom: Date | null;
  validTo: Date | null;
};

export type ShiftPayrollInput = {
  startTime: Date;
  endTime: Date;
  hourlyRate: number; // באגורות - שכר לפי WorkType או baseHourlyRate
  bonuses: BonusInfo[];
  shiftType?: ShiftType; // סוג המשמרת (אופציונלי - יחושב אוטומטית)
  isShortDay?: boolean; // האם יום מקוצר
  isHoliday?: boolean; // האם יום חג
  workRules?: WorkRulesConfig;
};

export type ShiftPayrollResult = {
  // חלוקת שעות
  breakdown: OvertimeBreakdown;
  shiftType: ShiftType;

  // שכר לפי סוג שעות (באגורות)
  regularPay: number; // 100%
  overtime125Pay: number; // 125%
  overtime150Pay: number; // 150%

  // שכר שבת/חג (באגורות)
  shabbatRegularPay: number; // 150%
  shabbatOvertime175Pay: number; // 175%
  shabbatOvertime200Pay: number; // 200%

  basePay: number; // סה"כ שכר בסיס (לפני בונוסים)

  // בונוסים (באגורות)
  hourlyBonusPay: number;
  oneTimeBonusPay: number;
  totalBonusPay: number;

  // סה"כ (באגורות)
  totalPay: number;

  // פרטים נוספים
  hourlyRate: number;
  effectiveHourlyRate: number; // כולל בונוס לשעה
};

/**
 * מחשב את השכר למשמרת כולל שעות נוספות ובונוסים
 * לפי חוק שעות עבודה ומנוחה הישראלי
 */
export function calculateShiftPayroll(
  input: ShiftPayrollInput
): ShiftPayrollResult {
  const {
    startTime,
    endTime,
    hourlyRate,
    bonuses,
    isShortDay = false,
    isHoliday = false,
    workRules = DEFAULT_WORK_RULES,
  } = input;

  // קביעת סוג המשמרת
  const shiftType =
    input.shiftType ?? determineShiftType(startTime, isShortDay, isHoliday);

  // חישוב משך המשמרת
  const totalMinutes = calculateShiftDurationMinutes(startTime, endTime);

  // חישוב חלוקת שעות
  const breakdown = calculateDailyOvertimeBreakdown(
    totalMinutes,
    shiftType,
    workRules
  );

  // חישוב שכר לפי שעות
  const hourlyRatePerMinute = hourlyRate / 60;

  // שכר יום חול
  const regularPay = Math.round(
    breakdown.regularMinutes * hourlyRatePerMinute
  );
  const overtime125Pay = Math.round(
    breakdown.overtime125Minutes * hourlyRatePerMinute * workRules.overtimeFirstRate
  );
  const overtime150Pay = Math.round(
    breakdown.overtime150Minutes * hourlyRatePerMinute * workRules.overtimeSecondRate
  );

  // שכר שבת/חג
  const shabbatRegularPay = Math.round(
    breakdown.shabbatRegularMinutes * hourlyRatePerMinute * workRules.shabbatHolidayRate
  );
  const shabbatOvertime175Pay = Math.round(
    breakdown.shabbatOvertime175Minutes *
      hourlyRatePerMinute *
      workRules.shabbatOvertimeFirstRate
  );
  const shabbatOvertime200Pay = Math.round(
    breakdown.shabbatOvertime200Minutes *
      hourlyRatePerMinute *
      workRules.shabbatOvertimeSecondRate
  );

  const basePay =
    regularPay +
    overtime125Pay +
    overtime150Pay +
    shabbatRegularPay +
    shabbatOvertime175Pay +
    shabbatOvertime200Pay;

  // חישוב בונוסים
  const activeBonuses = getActiveBonuses(bonuses, startTime);
  const { hourlyBonusPay, oneTimeBonusPay } = calculateBonusPay(
    activeBonuses,
    totalMinutes
  );
  const totalBonusPay = hourlyBonusPay + oneTimeBonusPay;

  // סה"כ
  const totalPay = basePay + totalBonusPay;

  // שכר אפקטיבי לשעה (כולל בונוס לשעה)
  const hourlyBonusPerHour = activeBonuses
    .filter((b) => b.bonusType === "HOURLY" && b.amountPerHour)
    .reduce((sum, b) => sum + (b.amountPerHour ?? 0), 0);

  const effectiveHourlyRate = hourlyRate + hourlyBonusPerHour;

  return {
    breakdown,
    shiftType,
    regularPay,
    overtime125Pay,
    overtime150Pay,
    shabbatRegularPay,
    shabbatOvertime175Pay,
    shabbatOvertime200Pay,
    basePay,
    hourlyBonusPay,
    oneTimeBonusPay,
    totalBonusPay,
    totalPay,
    hourlyRate,
    effectiveHourlyRate,
  };
}

/**
 * מסנן בונוסים פעילים לתאריך נתון
 */
export function getActiveBonuses(
  bonuses: BonusInfo[],
  date: Date
): BonusInfo[] {
  return bonuses.filter((bonus) => {
    if (!bonus.validFrom || !bonus.validTo) return false;
    return date >= bonus.validFrom && date <= bonus.validTo;
  });
}

/**
 * מחשב את סכום הבונוסים
 */
function calculateBonusPay(
  bonuses: BonusInfo[],
  totalMinutes: number
): { hourlyBonusPay: number; oneTimeBonusPay: number } {
  let hourlyBonusPay = 0;
  let oneTimeBonusPay = 0;

  const totalHours = totalMinutes / 60;

  for (const bonus of bonuses) {
    if (bonus.bonusType === "HOURLY" && bonus.amountPerHour) {
      // בונוס לשעה - מוכפל במספר השעות
      hourlyBonusPay += Math.round(bonus.amountPerHour * totalHours);
    } else if (bonus.bonusType === "ONE_TIME" && bonus.amountFixed) {
      // בונוס חד-פעמי - מתווסף פעם אחת למשמרת
      oneTimeBonusPay += bonus.amountFixed;
    }
  }

  return { hourlyBonusPay, oneTimeBonusPay };
}

/**
 * פורמט סכום באגורות לשקלים
 */
export function formatAgorotToShekels(agorot: number): string {
  return `₪${(agorot / 100).toFixed(2)}`;
}

/**
 * מחזיר תיאור סוג המשמרת בעברית
 */
export function getShiftTypeLabel(shiftType: ShiftType): string {
  const labels: Record<ShiftType, string> = {
    REGULAR: "יום רגיל",
    SHORT_DAY: "יום מקוצר",
    NIGHT: "משמרת לילה",
    FRIDAY: "יום שישי",
    SHABBAT: "שבת",
    HOLIDAY: "חג",
  };
  return labels[shiftType];
}

/**
 * מחשב שכר לתקופה (לדוח)
 */
export type PeriodPayrollSummary = {
  totalShifts: number;
  totalMinutes: number;

  // שעות
  regularMinutes: number;
  overtime125Minutes: number;
  overtime150Minutes: number;
  shabbatMinutes: number;

  // שכר
  basePay: number;
  bonusPay: number;
  totalPay: number;
};

export function calculatePeriodPayroll(
  shifts: ShiftPayrollResult[]
): PeriodPayrollSummary {
  return shifts.reduce(
    (summary, shift) => ({
      totalShifts: summary.totalShifts + 1,
      totalMinutes: summary.totalMinutes + shift.breakdown.totalMinutes,
      regularMinutes: summary.regularMinutes + shift.breakdown.regularMinutes,
      overtime125Minutes:
        summary.overtime125Minutes + shift.breakdown.overtime125Minutes,
      overtime150Minutes:
        summary.overtime150Minutes + shift.breakdown.overtime150Minutes,
      shabbatMinutes:
        summary.shabbatMinutes +
        shift.breakdown.shabbatRegularMinutes +
        shift.breakdown.shabbatOvertime175Minutes +
        shift.breakdown.shabbatOvertime200Minutes,
      basePay: summary.basePay + shift.basePay,
      bonusPay: summary.bonusPay + shift.totalBonusPay,
      totalPay: summary.totalPay + shift.totalPay,
    }),
    {
      totalShifts: 0,
      totalMinutes: 0,
      regularMinutes: 0,
      overtime125Minutes: 0,
      overtime150Minutes: 0,
      shabbatMinutes: 0,
      basePay: 0,
      bonusPay: 0,
      totalPay: 0,
    }
  );
}

/**
 * חישוב שעות נוספות ברמה שבועית
 * יש לקרוא לפונקציה זו אחרי חישוב כל המשמרות בשבוע
 *
 * לפי החוק: קודם מחשבים ברמה יומית, ואז ברמה שבועית
 */
export type WeeklyPayrollInput = {
  shifts: ShiftPayrollResult[];
  hourlyRate: number;
  workRules?: WorkRulesConfig;
};

export type WeeklyPayrollResult = {
  dailyPayroll: ShiftPayrollResult[];
  weeklyOvertimePay: number;
  totalWeeklyPay: number;
};

export function calculateWeeklyPayroll(
  input: WeeklyPayrollInput
): WeeklyPayrollResult {
  const { shifts, hourlyRate, workRules = DEFAULT_WORK_RULES } = input;

  // סכום כל השכר היומי
  const totalDailyPay = shifts.reduce((sum, shift) => sum + shift.totalPay, 0);

  // סכום שעות רגילות (לא נוספות) בשבוע - לחישוב שבועי
  const totalRegularMinutes = shifts.reduce(
    (sum, shift) => sum + shift.breakdown.regularMinutes,
    0
  );

  const totalRegularHours = totalRegularMinutes / 60;
  const weeklyStandardHours = workRules.weeklyStandardHours;

  let weeklyOvertimePay = 0;

  // אם עבר את המכסה השבועית
  if (totalRegularHours > weeklyStandardHours) {
    const overtimeHours = totalRegularHours - weeklyStandardHours;

    // 2 שעות נוספות ראשונות - 125%
    const overtime125Hours = Math.min(overtimeHours, workRules.overtimeFirstHours);
    const overtime125Pay =
      overtime125Hours * (hourlyRate / 100) * (workRules.overtimeFirstRate - 1);

    // שאר השעות - 150%
    let overtime150Pay = 0;
    if (overtimeHours > workRules.overtimeFirstHours) {
      const overtime150Hours = overtimeHours - workRules.overtimeFirstHours;
      overtime150Pay =
        overtime150Hours * (hourlyRate / 100) * (workRules.overtimeSecondRate - 1);
    }

    // התוספת השבועית (ההפרש בין 125%/150% ל-100%)
    weeklyOvertimePay = Math.round((overtime125Pay + overtime150Pay) * 100);
  }

  return {
    dailyPayroll: shifts,
    weeklyOvertimePay,
    totalWeeklyPay: totalDailyPay + weeklyOvertimePay,
  };
}