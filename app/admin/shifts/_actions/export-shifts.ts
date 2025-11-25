// app/admin/shifts/_actions/export-shifts.ts
"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type ExportType = "summary" | "detailed";

type ShiftWithRelations = {
  id: string;
  startTime: Date;
  endTime: Date | null;
  status: string;
  source: string;
  employee: {
    id: string;
    fullName: string;
    nationalId: string;
    baseHourlyRate: number | null;
  };
  workType: {
    name: string;
  } | null;
};

type EmployeeSummary = {
  fullName: string;
  nationalId: string;
  totalMinutes: number;
  shiftCount: number;
};

export async function exportShiftsToExcel(
  type: ExportType,
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: string; filename?: string }> {
  try {
    const shifts = await prisma.shift.findMany({
      where: {
        status: "CLOSED",
        ...(startDate && endDate
          ? {
              startTime: { gte: startDate },
              endTime: { lte: endDate },
            }
          : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            nationalId: true,
            baseHourlyRate: true,
          },
        },
        workType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    if (type === "summary") {
      return generateSummaryReport(shifts);
    } else {
      return generateDetailedReport(shifts);
    }
  } catch (error) {
    console.error("Error exporting shifts:", error);
    return { success: false };
  }
}

function generateSummaryReport(shifts: ShiftWithRelations[]) {
  // קיבוץ לפי עובד
  const employeeMap = new Map<string, EmployeeSummary>();

  for (const shift of shifts) {
    const empId = shift.employee.id;
    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        fullName: shift.employee.fullName,
        nationalId: shift.employee.nationalId,
        totalMinutes: 0,
        shiftCount: 0,
      });
    }

    const emp = employeeMap.get(empId)!;
    if (shift.endTime) {
      const duration =
        (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        60000;
      emp.totalMinutes += duration;
      emp.shiftCount += 1;
    }
  }

  // המרה למערך
  const data = Array.from(employeeMap.values()).map((emp) => ({
    "שם מלא": emp.fullName,
    "תעודת זהות": emp.nationalId,
    "מספר משמרות": emp.shiftCount,
    "סה״כ שעות": (emp.totalMinutes / 60).toFixed(2),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "סיכום עובדים");

  // המרה ל-base64
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const base64 = excelBuffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `סיכום-משמרות-${new Date().toISOString().split("T")[0]}.xlsx`,
  };
}

function generateDetailedReport(shifts: ShiftWithRelations[]) {
  const data = shifts.map((shift) => {
    const duration = shift.endTime
      ? (new Date(shift.endTime).getTime() -
          new Date(shift.startTime).getTime()) /
        60000
      : 0;

    return {
      תאריך: new Date(shift.startTime).toLocaleDateString("he-IL"),
      "שם עובד": shift.employee.fullName,
      "תעודת זהות": shift.employee.nationalId,
      "שעת התחלה": new Date(shift.startTime).toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "שעת סיום": shift.endTime
        ? new Date(shift.endTime).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      "משך (שעות)": (duration / 60).toFixed(2),
      "סוג עבודה": shift.workType?.name ?? "—",
      מקור: shift.source === "web" ? "אתר" : shift.source === "mobile" ? "אפליקציה" : shift.source,
      סטטוס: shift.status,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "פירוט משמרות");

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const base64 = excelBuffer.toString("base64");

  return {
    success: true,
    data: base64,
    filename: `פירוט-משמרות-${new Date().toISOString().split("T")[0]}.xlsx`,
  };
}