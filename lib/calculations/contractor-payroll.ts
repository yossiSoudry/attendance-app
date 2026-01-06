// lib/calculations/contractor-payroll.ts
// Simple payroll calculation for HR contractors - no overtime, no bonuses

export type ContractorPayrollSummary = {
  totalEntries: number;
  totalMinutes: number;
  totalHoursFormatted: string; // "HH:MM" format
  hourlyRate: number; // in agorot
  totalPay: number; // in agorot
  formattedPay: string; // "₪X,XXX.XX"
};

/**
 * Format minutes to hours and minutes display string (e.g., "180:30")
 */
export function formatMinutesToHoursAndMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format agorot to shekels string (e.g., "₪1,234.56")
 */
export function formatAgorotToShekels(agorot: number): string {
  const shekels = agorot / 100;
  return `₪${shekels.toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate simple contractor payroll
 * Total hours × hourly rate (no overtime multipliers)
 */
export function calculateContractorPayroll(
  entries: { durationMinutes: number }[],
  hourlyRate: number // in agorot
): ContractorPayrollSummary {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const totalHours = totalMinutes / 60;

  // Simple calculation: hours × hourly rate
  const totalPay = Math.round(hourlyRate * totalHours);

  return {
    totalEntries: entries.length,
    totalMinutes,
    totalHoursFormatted: formatMinutesToHoursAndMinutes(totalMinutes),
    hourlyRate,
    totalPay,
    formattedPay: formatAgorotToShekels(totalPay),
  };
}

/**
 * Get month name in Hebrew
 */
export function getHebrewMonthName(month: number): string {
  const months = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  return months[month - 1] || "";
}
