// app/admin/payroll/_actions/admin-payroll-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireOrganizationId } from "@/lib/auth";
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

// ========================================
// Types
// ========================================

export type AdminShiftPayroll = {
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

export type AdminPayrollSummary = {
  employeeId: string;
  employeeName: string;
  shifts: AdminShiftPayroll[];
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
};

// ========================================
// Helper Functions
// ========================================

async function getHourlyRate(
  employeeId: string,
  workTypeId: string | null,
  organizationId: string
): Promise<number> {
  if (workTypeId) {
    // EmployeeWorkRate doesn't have organizationId directly - verify through employee
    const workRate = await prisma.employeeWorkRate.findFirst({
      where: {
        employeeId,
        workTypeId,
      },
    });

    if (workRate) {
      return workRate.hourlyRate;
    }
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      organizationId,
    },
    select: { baseHourlyRate: true },
  });

  return employee?.baseHourlyRate ?? 0;
}

async function getEmployeeBonuses(employeeId: string, organizationId: string): Promise<BonusInfo[]> {
  const bonuses = await prisma.employeeBonus.findMany({
    where: {
      employeeId,
      organizationId,
    },
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

function getDayOfWeek(date: Date): string {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  return days[date.getDay()];
}

// ========================================
// Get Monthly Payroll for Admin
// ========================================

export async function getAdminMonthlyPayroll(
  employeeId: string,
  year: number,
  month: number // 1-12
): Promise<AdminPayrollSummary> {
  const organizationId = await requireOrganizationId();

  // Get employee info
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      organizationId,
    },
    select: { id: true, fullName: true },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Calculate start and end of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const shifts = await prisma.shift.findMany({
    where: {
      employeeId,
      organizationId,
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

  const bonuses = await getEmployeeBonuses(employeeId, organizationId);

  const results: AdminShiftPayroll[] = [];

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

    const hourlyRate = await getHourlyRate(employeeId, shift.workTypeId, organizationId);

    const shiftType = determineShiftType(
      shift.startTime,
      false, // isShortDay
      false // isHoliday
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
      date: shift.startTime.toLocaleDateString("he-IL"),
      dayOfWeek: getDayOfWeek(shift.startTime),
      startTime: shift.startTime.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime: shift.endTime.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      workTypeName: shift.workType?.name ?? null,
      shiftType: getShiftTypeLabel(payroll.shiftType),
      duration: formatMinutesToHoursAndMinutes(payroll.breakdown.totalMinutes),
      regularTime: formatMinutesToHoursAndMinutes(
        payroll.breakdown.regularMinutes
      ),
      overtime125Time: formatMinutesToHoursAndMinutes(
        payroll.breakdown.overtime125Minutes
      ),
      overtime150Time: formatMinutesToHoursAndMinutes(
        payroll.breakdown.overtime150Minutes
      ),
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

  const totalPay =
    totalRegularPay +
    totalOvertime125Pay +
    totalOvertime150Pay +
    totalShabbatPay +
    totalBonusPay;

  // Format month name
  const monthName = new Date(year, month - 1).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
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
      startDate: startDate.toLocaleDateString("he-IL"),
      endDate: endDate.toLocaleDateString("he-IL"),
      month: monthName,
    },
  };
}

// ========================================
// Get Available Months for Employee
// ========================================

export async function getAdminAvailableMonths(
  employeeId: string
): Promise<{ label: string; year: number; month: number }[]> {
  const organizationId = await requireOrganizationId();

  const shifts = await prisma.shift.findMany({
    where: {
      employeeId,
      organizationId,
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

// ========================================
// Get All Employees Monthly Payroll Summary
// ========================================

export async function getAllEmployeesMonthlyPayroll(
  year: number,
  month: number
): Promise<AdminPayrollSummary[]> {
  const organizationId = await requireOrganizationId();

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      organizationId,
    },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const results: AdminPayrollSummary[] = [];

  for (const employee of employees) {
    const payroll = await getAdminMonthlyPayroll(employee.id, year, month);
    // Only include employees with shifts in this period
    if (payroll.shifts.length > 0) {
      results.push(payroll);
    }
  }

  return results;
}

// ========================================
// Get Global Available Months (all employees)
// ========================================

export async function getGlobalAvailableMonths(): Promise<
  { label: string; year: number; month: number }[]
> {
  const organizationId = await requireOrganizationId();

  const shifts = await prisma.shift.findMany({
    where: {
      organizationId,
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
