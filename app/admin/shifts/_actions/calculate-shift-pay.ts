// app/admin/shifts/_actions/calculate-shift-pay.ts
"use server";

import {
  DEFAULT_WORK_RULES,
  formatMinutesToHoursAndMinutes,
  type WorkRulesConfig,
} from "@/lib/calculations/overtime";
import {
  calculateShiftPayroll,
  formatAgorotToShekels,
  type BonusInfo,
  type ShiftPayrollResult,
} from "@/lib/calculations/payroll";
import { prisma } from "@/lib/prisma";

export type ShiftPayrollDetails = {
  // פרטי משמרת
  shiftId: string;
  employeeName: string;
  startTime: string;
  endTime: string;
  workTypeName: string | null;

  // חלוקת שעות
  totalTime: string;
  regularTime: string;
  overtime125Time: string;
  overtime150Time: string;

  // שכר
  hourlyRate: string;
  regularPay: string;
  overtime125Pay: string;
  overtime150Pay: string;
  basePay: string;
  bonusPay: string;
  totalPay: string;

  // raw values (באגורות)
  rawTotalPay: number;
  rawBasePay: number;
  rawBonusPay: number;
};

/**
 * טוען את חוקי העבודה מהדאטאבייס
 */
async function getWorkRules(): Promise<WorkRulesConfig> {
  const rules = await prisma.workRules.findFirst({
    where: { id: 1 },
  });

  if (!rules) {
    return DEFAULT_WORK_RULES;
  }

  return {
    workWeekType: "5_DAYS",
    dailyStandardHours5Days: 8.6,
    dailyShortDayHours5Days: 7.6,
    dailyStandardHours6Days: 8,
    dailyFridayHours6Days: 7,
    nightShiftHours: 7,
    weeklyStandardHours: rules.weeklyStandardHours,
    overtimeFirstRate: rules.overtimeFirstRate,
    overtimeSecondRate: rules.overtimeSecondRate,
    overtimeFirstHours: rules.overtimeFirstHoursPerDay,
    shabbatHolidayRate: 1.5,
    shabbatOvertimeFirstRate: 1.75,
    shabbatOvertimeSecondRate: 2.0,
    maxDailyHours: rules.maxDailyHours,
  };
}

/**
 * מחזיר את השכר לשעה לעובד לפי סוג עבודה
 */
async function getHourlyRate(
  employeeId: string,
  workTypeId: string | null
): Promise<number> {
  // אם יש סוג עבודה, נסה למצוא תעריף ספציפי
  if (workTypeId) {
    const workRate = await prisma.employeeWorkRate.findUnique({
      where: {
        employeeId_workTypeId: {
          employeeId,
          workTypeId,
        },
      },
    });

    if (workRate) {
      return workRate.hourlyRate;
    }
  }

  // אחרת, השתמש בשכר הבסיס של העובד
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { baseHourlyRate: true },
  });

  return employee?.baseHourlyRate ?? 0;
}

/**
 * מחזיר את הבונוסים הפעילים לעובד
 */
async function getEmployeeBonuses(employeeId: string): Promise<BonusInfo[]> {
  const bonuses = await prisma.employeeBonus.findMany({
    where: { employeeId },
  });

  return bonuses.map((b: typeof bonuses[number]) => ({
    id: b.id,
    bonusType: b.bonusType as "HOURLY" | "ONE_TIME",
    amountPerHour: b.amountPerHour,
    amountFixed: b.amountFixed,
    validFrom: b.validFrom,
    validTo: b.validTo,
  }));
}

/**
 * מחשב את פרטי השכר למשמרת בודדת
 */
export async function calculateShiftPayDetails(
  shiftId: string
): Promise<ShiftPayrollDetails | null> {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          baseHourlyRate: true,
        },
      },
      workType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!shift || !shift.endTime) {
    return null;
  }

  const workRules = await getWorkRules();
  const hourlyRate = await getHourlyRate(shift.employeeId, shift.workTypeId);
  const bonuses = await getEmployeeBonuses(shift.employeeId);

  const payroll = calculateShiftPayroll({
    startTime: shift.startTime,
    endTime: shift.endTime,
    hourlyRate,
    bonuses,
    workRules,
  });

  return formatPayrollResult(shift, payroll, hourlyRate);
}

/**
 * מחשב שכר לכל המשמרות של עובד בתקופה
 */
export async function calculateEmployeePeriodPay(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  shifts: ShiftPayrollDetails[];
  summary: {
    totalShifts: number;
    totalTime: string;
    regularTime: string;
    overtime125Time: string;
    overtime150Time: string;
    basePay: string;
    bonusPay: string;
    totalPay: string;
  };
}> {
  const shifts = await prisma.shift.findMany({
    where: {
      employeeId,
      status: "CLOSED",
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          baseHourlyRate: true,
        },
      },
      workType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const workRules = await getWorkRules();
  const bonuses = await getEmployeeBonuses(employeeId);

  const results: ShiftPayrollDetails[] = [];
  let totalMinutes = 0;
  let regularMinutes = 0;
  let overtime125Minutes = 0;
  let overtime150Minutes = 0;
  let totalBasePay = 0;
  let totalBonusPay = 0;

  for (const shift of shifts) {
    if (!shift.endTime) continue;

    const hourlyRate = await getHourlyRate(shift.employeeId, shift.workTypeId);

    const payroll = calculateShiftPayroll({
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate,
      bonuses,
      workRules,
    });

    results.push(formatPayrollResult(shift, payroll, hourlyRate));

    totalMinutes += payroll.breakdown.totalMinutes;
    regularMinutes += payroll.breakdown.regularMinutes;
    overtime125Minutes += payroll.breakdown.overtime125Minutes;
    overtime150Minutes += payroll.breakdown.overtime150Minutes;
    totalBasePay += payroll.basePay;
    totalBonusPay += payroll.totalBonusPay;
  }

  return {
    shifts: results,
    summary: {
      totalShifts: results.length,
      totalTime: formatMinutesToHoursAndMinutes(totalMinutes),
      regularTime: formatMinutesToHoursAndMinutes(regularMinutes),
      overtime125Time: formatMinutesToHoursAndMinutes(overtime125Minutes),
      overtime150Time: formatMinutesToHoursAndMinutes(overtime150Minutes),
      basePay: formatAgorotToShekels(totalBasePay),
      bonusPay: formatAgorotToShekels(totalBonusPay),
      totalPay: formatAgorotToShekels(totalBasePay + totalBonusPay),
    },
  };
}

/**
 * פונקציית עזר לפורמט התוצאה
 */
function formatPayrollResult(
  shift: {
    id: string;
    startTime: Date;
    endTime: Date | null;
    employee: { fullName: string };
    workType: { name: string } | null;
  },
  payroll: ShiftPayrollResult,
  hourlyRate: number
): ShiftPayrollDetails {
  return {
    shiftId: shift.id,
    employeeName: shift.employee.fullName,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() ?? "",
    workTypeName: shift.workType?.name ?? null,

    totalTime: formatMinutesToHoursAndMinutes(payroll.breakdown.totalMinutes),
    regularTime: formatMinutesToHoursAndMinutes(
      payroll.breakdown.regularMinutes
    ),
    overtime125Time: formatMinutesToHoursAndMinutes(
      payroll.breakdown.overtime125Minutes
    ),
    overtime150Time: formatMinutesToHoursAndMinutes(
      payroll.breakdown.overtime150Minutes
    ),

    hourlyRate: formatAgorotToShekels(hourlyRate),
    regularPay: formatAgorotToShekels(payroll.regularPay),
    overtime125Pay: formatAgorotToShekels(payroll.overtime125Pay),
    overtime150Pay: formatAgorotToShekels(payroll.overtime150Pay),
    basePay: formatAgorotToShekels(payroll.basePay),
    bonusPay: formatAgorotToShekels(payroll.totalBonusPay),
    totalPay: formatAgorotToShekels(payroll.totalPay),

    rawTotalPay: payroll.totalPay,
    rawBasePay: payroll.basePay,
    rawBonusPay: payroll.totalBonusPay,
  };
}
