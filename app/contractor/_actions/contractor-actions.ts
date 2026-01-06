// app/contractor/_actions/contractor-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedContractor } from "@/lib/contractor-auth";
import {
  casualWorkerEntryFormSchema,
  type CasualWorkerEntryFormValues,
  calculateDurationMinutes,
} from "@/lib/validations/casual-worker-entry";
import {
  calculateContractorPayroll,
  type ContractorPayrollSummary,
} from "@/lib/calculations/contractor-payroll";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string; errors?: Record<string, string[]> };

/**
 * Create a new casual worker entry
 */
export async function createCasualWorkerEntry(
  values: CasualWorkerEntryFormValues
): Promise<ActionResult> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return { success: false, message: "לא מחובר למערכת" };
  }

  const validation = casualWorkerEntryFormSchema.safeParse(values);
  if (!validation.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { workerName, workDate, startTime, endTime, notes } = validation.data;

  // Calculate duration
  const durationMinutes = calculateDurationMinutes(startTime, endTime);

  // Create datetime from date and time
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startDateTime = new Date(workDate);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(workDate);
  endDateTime.setHours(endHour, endMin, 0, 0);

  await prisma.casualWorkerEntry.create({
    data: {
      organizationId: auth.contractor.organizationId,
      contractorId: auth.contractor.id,
      workerName,
      workDate,
      startTime: startDateTime,
      endTime: endDateTime,
      durationMinutes,
      notes: notes || null,
    },
  });

  revalidatePath("/contractor");
  return { success: true, message: "הרשומה נוספה בהצלחה" };
}

/**
 * Update an existing casual worker entry
 */
export async function updateCasualWorkerEntry(
  entryId: string,
  values: CasualWorkerEntryFormValues
): Promise<ActionResult> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return { success: false, message: "לא מחובר למערכת" };
  }

  // Verify entry belongs to this contractor
  const existingEntry = await prisma.casualWorkerEntry.findFirst({
    where: {
      id: entryId,
      contractorId: auth.contractor.id,
    },
  });

  if (!existingEntry) {
    return { success: false, message: "רשומה לא נמצאה" };
  }

  const validation = casualWorkerEntryFormSchema.safeParse(values);
  if (!validation.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { workerName, workDate, startTime, endTime, notes } = validation.data;
  const durationMinutes = calculateDurationMinutes(startTime, endTime);

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startDateTime = new Date(workDate);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(workDate);
  endDateTime.setHours(endHour, endMin, 0, 0);

  await prisma.casualWorkerEntry.update({
    where: { id: entryId },
    data: {
      workerName,
      workDate,
      startTime: startDateTime,
      endTime: endDateTime,
      durationMinutes,
      notes: notes || null,
    },
  });

  revalidatePath("/contractor");
  return { success: true, message: "הרשומה עודכנה בהצלחה" };
}

/**
 * Delete a casual worker entry
 */
export async function deleteCasualWorkerEntry(entryId: string): Promise<ActionResult> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return { success: false, message: "לא מחובר למערכת" };
  }

  // Verify entry belongs to this contractor
  const existingEntry = await prisma.casualWorkerEntry.findFirst({
    where: {
      id: entryId,
      contractorId: auth.contractor.id,
    },
  });

  if (!existingEntry) {
    return { success: false, message: "רשומה לא נמצאה" };
  }

  await prisma.casualWorkerEntry.delete({
    where: { id: entryId },
  });

  revalidatePath("/contractor");
  return { success: true, message: "הרשומה נמחקה בהצלחה" };
}

export type CasualWorkerEntryWithId = {
  id: string;
  workerName: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
};

/**
 * Get entries for a specific month
 */
export async function getContractorMonthlyEntries(
  year: number,
  month: number
): Promise<CasualWorkerEntryWithId[]> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return [];
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const entries = await prisma.casualWorkerEntry.findMany({
    where: {
      contractorId: auth.contractor.id,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: [{ workDate: "desc" }, { startTime: "desc" }],
    select: {
      id: true,
      workerName: true,
      workDate: true,
      startTime: true,
      endTime: true,
      durationMinutes: true,
      notes: true,
    },
  });

  return entries;
}

/**
 * Get monthly summary with payroll calculation
 */
export async function getContractorMonthlySummary(
  year: number,
  month: number
): Promise<ContractorPayrollSummary | null> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return null;
  }

  const entries = await getContractorMonthlyEntries(year, month);
  return calculateContractorPayroll(entries, auth.contractor.baseHourlyRate);
}

export type MonthOption = {
  year: number;
  month: number;
  label: string;
};

/**
 * Get available months that have entries (for history page)
 */
export async function getContractorAvailableMonths(): Promise<MonthOption[]> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return [];
  }

  const entries = await prisma.casualWorkerEntry.findMany({
    where: { contractorId: auth.contractor.id },
    select: { workDate: true },
    orderBy: { workDate: "desc" },
  });

  // Extract unique year-month combinations
  const monthsSet = new Set<string>();
  entries.forEach((entry) => {
    const date = new Date(entry.workDate);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthsSet.add(key);
  });

  const hebrewMonths = [
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

  return Array.from(monthsSet)
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return {
        year,
        month,
        label: `${hebrewMonths[month - 1]} ${year}`,
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
}

/**
 * Get worker name suggestions for autocomplete
 */
export async function getWorkerNameSuggestions(): Promise<string[]> {
  const auth = await getAuthenticatedContractor();
  if (!auth.authenticated) {
    return [];
  }

  const entries = await prisma.casualWorkerEntry.findMany({
    where: { contractorId: auth.contractor.id },
    select: { workerName: true },
    distinct: ["workerName"],
    orderBy: { workerName: "asc" },
  });

  return entries.map((e) => e.workerName);
}
