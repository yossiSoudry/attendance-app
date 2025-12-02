// lib/exports/payroll-export.ts
import type { AdminPayrollSummary } from "@/app/admin/payroll/_actions/admin-payroll-actions";
import { exportReport, type ExportFormat, type ExportColumn } from "./export-utils";

// ========================================
// Payroll Export Columns
// ========================================

const payrollColumns: ExportColumn[] = [
  { header: "תאריך", key: "date", width: 12 },
  { header: "יום", key: "dayOfWeek", width: 8 },
  { header: "התחלה", key: "startTime", width: 8 },
  { header: "סיום", key: "endTime", width: 8 },
  { header: "סוג עבודה", key: "workTypeName", width: 12 },
  { header: "סוג משמרת", key: "shiftType", width: 10 },
  { header: "משך", key: "duration", width: 8 },
  { header: "רגיל", key: "regularTime", width: 8 },
  { header: "125%", key: "overtime125Time", width: 8 },
  { header: "150%", key: "overtime150Time", width: 8 },
  { header: "שבת", key: "shabbatTime", width: 8 },
  { header: "תעריף", key: "hourlyRate", width: 8 },
  { header: "שכר רגיל", key: "regularPay", width: 10 },
  { header: "שכר 125%", key: "overtime125Pay", width: 10 },
  { header: "שכר 150%", key: "overtime150Pay", width: 10 },
  { header: "שכר שבת", key: "shabbatPay", width: 10 },
  { header: "בונוסים", key: "bonusPay", width: 10 },
  { header: "סה״כ", key: "totalPay", width: 10 },
];

// ========================================
// Export Single Employee Payroll
// ========================================

export function exportEmployeePayroll(
  payroll: AdminPayrollSummary,
  format: ExportFormat
): void {
  const data = payroll.shifts.map((shift) => ({
    date: shift.date,
    dayOfWeek: shift.dayOfWeek,
    startTime: shift.startTime,
    endTime: shift.endTime,
    workTypeName: shift.workTypeName || "-",
    shiftType: shift.shiftType,
    duration: shift.duration,
    regularTime: shift.regularTime,
    overtime125Time: shift.overtime125Time,
    overtime150Time: shift.overtime150Time,
    shabbatTime: shift.shabbatTime,
    hourlyRate: shift.hourlyRate,
    regularPay: shift.regularPay,
    overtime125Pay: shift.overtime125Pay,
    overtime150Pay: shift.overtime150Pay,
    shabbatPay: shift.shabbatPay,
    bonusPay: shift.bonusPay,
    totalPay: shift.totalPay,
  }));

  const summaryData = {
    "סה״כ משמרות": payroll.summary.totalShifts,
    "סה״כ שעות": payroll.summary.totalDuration,
    "שעות רגילות": payroll.summary.regularTime,
    "שעות 125%": payroll.summary.overtime125Time,
    "שעות 150%": payroll.summary.overtime150Time,
    "שעות שבת": payroll.summary.shabbatTime,
    "שכר רגיל": payroll.summary.regularPay,
    "שכר 125%": payroll.summary.overtime125Pay,
    "שכר 150%": payroll.summary.overtime150Pay,
    "שכר שבת": payroll.summary.shabbatPay,
    "בונוסים": payroll.summary.bonusPay,
    "סה״כ לתשלום": payroll.summary.totalPay,
  };

  const filename = `payroll_${payroll.employeeName.replace(/\s+/g, "_")}_${payroll.period.month.replace(/\s+/g, "_")}`;

  exportReport(format, {
    title: `דוח שכר - ${payroll.employeeName}`,
    subtitle: `תקופה: ${payroll.period.month}`,
    filename,
    columns: payrollColumns,
    data,
    summaryData,
    rtl: true,
  });
}

// ========================================
// Export Multiple Employees Summary
// ========================================

export function exportAllEmployeesPayrollSummary(
  payrolls: AdminPayrollSummary[],
  periodLabel: string,
  format: ExportFormat
): void {
  const summaryColumns: ExportColumn[] = [
    { header: "שם עובד", key: "employeeName", width: 20 },
    { header: "משמרות", key: "totalShifts", width: 10 },
    { header: "סה״כ שעות", key: "totalDuration", width: 12 },
    { header: "שעות רגילות", key: "regularTime", width: 12 },
    { header: "שעות נוספות", key: "overtimeTime", width: 12 },
    { header: "שעות שבת", key: "shabbatTime", width: 12 },
    { header: "שכר רגיל", key: "regularPay", width: 12 },
    { header: "שכר נוספות", key: "overtimePay", width: 12 },
    { header: "שכר שבת", key: "shabbatPay", width: 12 },
    { header: "בונוסים", key: "bonusPay", width: 10 },
    { header: "סה״כ", key: "totalPay", width: 12 },
  ];

  const data = payrolls.map((p) => ({
    employeeName: p.employeeName,
    totalShifts: p.summary.totalShifts,
    totalDuration: p.summary.totalDuration,
    regularTime: p.summary.regularTime,
    overtimeTime: `${p.summary.overtime125Time} + ${p.summary.overtime150Time}`,
    shabbatTime: p.summary.shabbatTime,
    regularPay: p.summary.regularPay,
    overtimePay: `₪${(
      parseFloat(p.summary.overtime125Pay.replace("₪", "").replace(",", "")) +
      parseFloat(p.summary.overtime150Pay.replace("₪", "").replace(",", ""))
    ).toFixed(2)}`,
    shabbatPay: p.summary.shabbatPay,
    bonusPay: p.summary.bonusPay,
    totalPay: p.summary.totalPay,
  }));

  // Calculate grand totals
  const grandTotalPay = payrolls.reduce((sum, p) => {
    const total = parseFloat(p.summary.totalPay.replace("₪", "").replace(",", ""));
    return sum + total;
  }, 0);

  const totalShifts = payrolls.reduce((sum, p) => sum + p.summary.totalShifts, 0);

  const summaryData = {
    "סה״כ עובדים": payrolls.length,
    "סה״כ משמרות": totalShifts,
    "סה״כ לתשלום": `₪${grandTotalPay.toFixed(2)}`,
  };

  const filename = `payroll_summary_${periodLabel.replace(/\s+/g, "_")}`;

  exportReport(format, {
    title: "דוח שכר מסכם - כל העובדים",
    subtitle: `תקופה: ${periodLabel}`,
    filename,
    columns: summaryColumns,
    data,
    summaryData,
    rtl: true,
  });
}
