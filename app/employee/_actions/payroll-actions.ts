// app/employee/_actions/payroll-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  calculateShiftPayroll,
  formatAgorotToShekels,
  getShiftTypeLabel,
  type BonusInfo,
} from "@/lib/calculations/payroll";
import {
  formatMinutesToHoursAndMinutes,
  determineShiftType,
  DEFAULT_WORK_RULES,
} from "@/lib/calculations/overtime";
import {
  getHolidaysForPeriod,
  getHolidayInfoFromMap,
} from "@/lib/calendar-utils";
import { getPlatformTimezone } from "@/lib/timezone";

// ========================================
// Types
// ========================================

export type EmployeeShiftPayroll = {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  workTypeName: string | null;
  shiftType: string;
  duration: string;
  regularTime: string;
  overtime125Time: string;
  overtime150Time: string;
  shabbatTime: string;
  hourlyRate: string;
  regularPay: string;
  overtime125Pay: string;
  overtime150Pay: string;
  shabbatPay: string;
  bonusPay: string;
  totalPay: string;
  rawTotalPay: number;
};

export type EmployeePayrollSummary = {
  shifts: EmployeeShiftPayroll[];
  summary: {
    totalShifts: number;
    totalDuration: string;
    regularTime: string;
    overtime125Time: string;
    overtime150Time: string;
    shabbatTime: string;
    regularPay: string;
    overtime125Pay: string;
    overtime150Pay: string;
    shabbatPay: string;
    bonusPay: string;
    totalPay: string;
  };
  period: {
    startDate: string;
    endDate: string;
    month: string;
  };
  employeeInfo?: {
    employmentType: "HOURLY" | "MONTHLY";
    monthlyRate: string | null;
  };
};

// ========================================
// Helper Functions
// ========================================

async function getHourlyRate(
  employeeId: string,
  workTypeId: string | null
): Promise<number> {
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

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { baseHourlyRate: true },
  });

  return employee?.baseHourlyRate ?? 0;
}

async function getEmployeeBonuses(employeeId: string): Promise<BonusInfo[]> {
  const bonuses = await prisma.employeeBonus.findMany({
    where: { employeeId },
  });

  return bonuses.map((b) => ({
    id: b.id,
    bonusType: b.bonusType as "HOURLY" | "ONE_TIME",
    amountPerHour: b.amountPerHour,
    amountFixed: b.amountFixed,
    validFrom: b.validFrom,
    validTo: b.validTo,
  }));
}

function getDayOfWeek(date: Date, timezone: string): string {
  const day = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: timezone,
  });
  const dayMap: Record<string, string> = {
    Sun: "ראשון",
    Mon: "שני",
    Tue: "שלישי",
    Wed: "רביעי",
    Thu: "חמישי",
    Fri: "שישי",
    Sat: "שבת",
  };
  return dayMap[day] || day;
}

// ========================================
// Get Monthly Payroll
// ========================================

export async function getEmployeeMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number // 1-12
): Promise<EmployeePayrollSummary> {
  // Get employee's organizationId and employment info
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      organizationId: true,
      employmentType: true,
      monthlyRate: true,
    },
  });

  if (!employee) {
    return {
      shifts: [],
      summary: {
        totalShifts: 0,
        totalDuration: "0:00",
        regularTime: "0:00",
        overtime125Time: "0:00",
        overtime150Time: "0:00",
        shabbatTime: "0:00",
        regularPay: "0.00",
        overtime125Pay: "0.00",
        overtime150Pay: "0.00",
        shabbatPay: "0.00",
        bonusPay: "0.00",
        totalPay: "0.00",
      },
      period: {
        startDate: "",
        endDate: "",
        month: "",
      },
    };
  }

  // Calculate start and end of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const shifts = await prisma.shift.findMany({
    where: {
      organizationId: employee.organizationId,
      employeeId,
      status: "CLOSED",
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    },
    include: {
      workType: {
        select: { name: true },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const bonuses = await getEmployeeBonuses(employeeId);
  const timezone = await getPlatformTimezone();

  // טעינת כל החגים לתקופה מראש (יעיל יותר מקריאה לDB לכל משמרת)
  const holidaysMap = await getHolidaysForPeriod(startDate, endDate);

  const results: EmployeeShiftPayroll[] = [];

  // Summary totals
  let totalMinutes = 0;
  let regularMinutes = 0;
  let overtime125Minutes = 0;
  let overtime150Minutes = 0;
  let shabbatMinutes = 0;
  let totalRegularPay = 0;
  let totalOvertime125Pay = 0;
  let totalOvertime150Pay = 0;
  let totalShabbatPay = 0;
  let totalBonusPay = 0;

  for (const shift of shifts) {
    if (!shift.endTime) continue;

    const hourlyRate = await getHourlyRate(employeeId, shift.workTypeId);

    // בדיקה האם יום חג/מנוחה מלוח השנה
    const holidayInfo = getHolidayInfoFromMap(holidaysMap, shift.startTime);

    const shiftType = determineShiftType(
      shift.startTime,
      holidayInfo.isShortDay, // יום קצר (ערב חג)
      holidayInfo.isRestDay   // יום חג/מנוחה
    );

    const payroll = calculateShiftPayroll({
      startTime: shift.startTime,
      endTime: shift.endTime,
      hourlyRate,
      bonuses,
      shiftType,
      workRules: DEFAULT_WORK_RULES,
    });

    const shabbatTotalMinutes = 
      payroll.breakdown.shabbatRegularMinutes +
      payroll.breakdown.shabbatOvertime175Minutes +
      payroll.breakdown.shabbatOvertime200Minutes;

    const shabbatTotalPay =
      payroll.shabbatRegularPay +
      payroll.shabbatOvertime175Pay +
      payroll.shabbatOvertime200Pay;

    results.push({
      id: shift.id,
      date: shift.startTime.toLocaleDateString("he-IL", { timeZone: timezone }),
      dayOfWeek: getDayOfWeek(shift.startTime, timezone),
      startTime: shift.startTime.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      }),
      endTime: shift.endTime.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      }),
      workTypeName: shift.workType?.name ?? null,
      shiftType: getShiftTypeLabel(payroll.shiftType),
      duration: formatMinutesToHoursAndMinutes(payroll.breakdown.totalMinutes),
      regularTime: formatMinutesToHoursAndMinutes(payroll.breakdown.regularMinutes),
      overtime125Time: formatMinutesToHoursAndMinutes(payroll.breakdown.overtime125Minutes),
      overtime150Time: formatMinutesToHoursAndMinutes(payroll.breakdown.overtime150Minutes),
      shabbatTime: formatMinutesToHoursAndMinutes(shabbatTotalMinutes),
      hourlyRate: formatAgorotToShekels(hourlyRate),
      regularPay: formatAgorotToShekels(payroll.regularPay),
      overtime125Pay: formatAgorotToShekels(payroll.overtime125Pay),
      overtime150Pay: formatAgorotToShekels(payroll.overtime150Pay),
      shabbatPay: formatAgorotToShekels(shabbatTotalPay),
      bonusPay: formatAgorotToShekels(payroll.totalBonusPay),
      totalPay: formatAgorotToShekels(payroll.totalPay),
      rawTotalPay: payroll.totalPay,
    });

    // Accumulate totals
    totalMinutes += payroll.breakdown.totalMinutes;
    regularMinutes += payroll.breakdown.regularMinutes;
    overtime125Minutes += payroll.breakdown.overtime125Minutes;
    overtime150Minutes += payroll.breakdown.overtime150Minutes;
    shabbatMinutes += shabbatTotalMinutes;
    totalRegularPay += payroll.regularPay;
    totalOvertime125Pay += payroll.overtime125Pay;
    totalOvertime150Pay += payroll.overtime150Pay;
    totalShabbatPay += shabbatTotalPay;
    totalBonusPay += payroll.totalBonusPay;
  }

  const totalPay = totalRegularPay + totalOvertime125Pay + totalOvertime150Pay + totalShabbatPay + totalBonusPay;

  // Format month name
  const monthName = new Date(year, month - 1).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });

  return {
    shifts: results,
    summary: {
      totalShifts: results.length,
      totalDuration: formatMinutesToHoursAndMinutes(totalMinutes),
      regularTime: formatMinutesToHoursAndMinutes(regularMinutes),
      overtime125Time: formatMinutesToHoursAndMinutes(overtime125Minutes),
      overtime150Time: formatMinutesToHoursAndMinutes(overtime150Minutes),
      shabbatTime: formatMinutesToHoursAndMinutes(shabbatMinutes),
      regularPay: formatAgorotToShekels(totalRegularPay),
      overtime125Pay: formatAgorotToShekels(totalOvertime125Pay),
      overtime150Pay: formatAgorotToShekels(totalOvertime150Pay),
      shabbatPay: formatAgorotToShekels(totalShabbatPay),
      bonusPay: formatAgorotToShekels(totalBonusPay),
      totalPay: formatAgorotToShekels(totalPay),
    },
    period: {
      startDate: startDate.toLocaleDateString("he-IL", { timeZone: timezone }),
      endDate: endDate.toLocaleDateString("he-IL", { timeZone: timezone }),
      month: monthName,
    },
    employeeInfo: {
      employmentType: employee.employmentType,
      monthlyRate: employee.monthlyRate
        ? formatAgorotToShekels(employee.monthlyRate)
        : null,
    },
  };
}

// ========================================
// Get Available Months (for dropdown)
// ========================================

export async function getEmployeeAvailableMonths(
  employeeId: string
): Promise<{ label: string; year: number; month: number }[]> {
  // Get employee's organizationId
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { organizationId: true },
  });

  if (!employee) {
    return [];
  }

  const shifts = await prisma.shift.findMany({
    where: {
      organizationId: employee.organizationId,
      employeeId,
      status: "CLOSED",
    },
    select: {
      startTime: true,
    },
    orderBy: { startTime: "desc" },
  });

  const monthsSet = new Map<string, { year: number; month: number }>();

  for (const shift of shifts) {
    const year = shift.startTime.getFullYear();
    const month = shift.startTime.getMonth() + 1;
    const key = `${year}-${month}`;
    
    if (!monthsSet.has(key)) {
      monthsSet.set(key, { year, month });
    }
  }

  return Array.from(monthsSet.values()).map(({ year, month }) => ({
    label: new Date(year, month - 1).toLocaleDateString("he-IL", {
      month: "long",
      year: "numeric",
    }),
    year,
    month,
  }));
}