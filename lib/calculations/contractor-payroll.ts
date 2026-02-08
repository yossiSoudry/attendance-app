// lib/calculations/contractor-payroll.ts
// Simple payroll calculation for HR contractors - no overtime, no bonuses

export type WorkerSummary = {
  workerName: string;
  totalEntries: number;
  totalMinutes: number;
  totalHoursFormatted: string; // "HH:MM" format
};

export type ContractorPayrollSummary = {
  totalEntries: number;
  totalMinutes: number;
  totalHoursFormatted: string; // "HH:MM" format
  hourlyRate: number; // in agorot
  totalPay: number; // in agorot
  formattedPay: string; // "₪X,XXX.XX"
  workerSummaries: WorkerSummary[]; // Per-worker breakdown
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
  entries: { durationMinutes: number; workerName: string }[],
  hourlyRate: number // in agorot
): ContractorPayrollSummary {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const totalHours = totalMinutes / 60;

  // Simple calculation: hours × hourly rate
  const totalPay = Math.round(hourlyRate * totalHours);

  // Group entries by worker name
  const workerMap = new Map<string, { entries: number; minutes: number }>();
  for (const entry of entries) {
    const existing = workerMap.get(entry.workerName) || { entries: 0, minutes: 0 };
    workerMap.set(entry.workerName, {
      entries: existing.entries + 1,
      minutes: existing.minutes + entry.durationMinutes,
    });
  }

  // Convert to sorted array (by total hours descending)
  const workerSummaries: WorkerSummary[] = Array.from(workerMap.entries())
    .map(([workerName, data]) => ({
      workerName,
      totalEntries: data.entries,
      totalMinutes: data.minutes,
      totalHoursFormatted: formatMinutesToHoursAndMinutes(data.minutes),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalEntries: entries.length,
    totalMinutes,
    totalHoursFormatted: formatMinutesToHoursAndMinutes(totalMinutes),
    hourlyRate,
    totalPay,
    formattedPay: formatAgorotToShekels(totalPay),
    workerSummaries,
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
