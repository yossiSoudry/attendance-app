// app/employee/_actions/leave-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

// ========================================
// Types
// ========================================

export type LeaveRequestWithEmployee = {
  id: string;
  employeeId: string;
  leaveType: "VACATION" | "SICK";
  status: "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
  startDate: Date;
  endDate: Date;
  totalDays: number;
  approvedDays: number | null;
  employeeNote: string | null;
  managerNote: string | null;
  documentUrl: string | null;
  documentName: string | null;
  createdAt: Date;
};

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

// ========================================
// Validation Schema
// ========================================

const leaveRequestSchema = z
  .object({
    leaveType: z.enum(["VACATION", "SICK"]),
    startDate: z.string().min(1, "תאריך התחלה נדרש"),
    endDate: z.string().min(1, "תאריך סיום נדרש"),
    employeeNote: z.string().max(500, "הערה לא יכולה לעלות על 500 תווים").optional(),
    documentUrl: z.string().url().optional().or(z.literal("")),
    documentName: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "תאריך סיום חייב להיות אחרי תאריך התחלה",
      path: ["endDate"],
    }
  );

// ========================================
// Helper Functions
// ========================================

function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Count all days except Saturday (6)
    if (dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

async function getEmployeeFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("employeeId")?.value ?? null;
}

// ========================================
// Actions
// ========================================

export async function createLeaveRequest(
  formData: FormData
): Promise<ActionResult> {
  const employeeId = await getEmployeeFromCookie();

  if (!employeeId) {
    return {
      success: false,
      message: "לא מחובר למערכת",
    };
  }

  const rawData = {
    leaveType: formData.get("leaveType") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    employeeNote: formData.get("employeeNote") as string,
    documentUrl: formData.get("documentUrl") as string || "",
    documentName: formData.get("documentName") as string || "",
  };

  const parsed = leaveRequestSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { leaveType, startDate, endDate, employeeNote, documentUrl, documentName } = parsed.data;

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Calculate work days
  const totalDays = calculateWorkDays(startDateObj, endDateObj);

  if (totalDays === 0) {
    return {
      success: false,
      message: "לא נבחרו ימי עבודה",
      errors: { startDate: ["לא נבחרו ימי עבודה בטווח התאריכים"] },
    };
  }

  // Check for overlapping requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ["PENDING", "APPROVED", "PARTIALLY_APPROVED"] },
      OR: [
        {
          AND: [
            { startDate: { lte: endDateObj } },
            { endDate: { gte: startDateObj } },
          ],
        },
      ],
    },
  });

  if (overlapping) {
    return {
      success: false,
      message: "קיימת כבר בקשת חופשה בתאריכים אלו",
      errors: { startDate: ["קיימת כבר בקשת חופשה חופפת"] },
    };
  }

  await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveType: leaveType as "VACATION" | "SICK",
      startDate: startDateObj,
      endDate: endDateObj,
      totalDays,
      employeeNote: employeeNote || null,
      documentUrl: documentUrl || null,
      documentName: documentName || null,
    },
  });

  revalidatePath("/employee");
  revalidatePath("/employee/leave");
  revalidatePath("/admin/leave");

  return {
    success: true,
    message: "בקשת החופשה נשלחה בהצלחה",
  };
}

export async function getMyLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
  const employeeId = await getEmployeeFromCookie();

  if (!employeeId) {
    return [];
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    leaveType: r.leaveType as "VACATION" | "SICK",
    status: r.status as
      | "PENDING"
      | "APPROVED"
      | "PARTIALLY_APPROVED"
      | "REJECTED",
    startDate: r.startDate,
    endDate: r.endDate,
    totalDays: r.totalDays,
    approvedDays: r.approvedDays,
    employeeNote: r.employeeNote,
    managerNote: r.managerNote,
    documentUrl: r.documentUrl,
    documentName: r.documentName,
    createdAt: r.createdAt,
  }));
}

export async function cancelLeaveRequest(
  requestId: string
): Promise<ActionResult> {
  const employeeId = await getEmployeeFromCookie();

  if (!employeeId) {
    return {
      success: false,
      message: "לא מחובר למערכת",
    };
  }

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return {
      success: false,
      message: "הבקשה לא נמצאה",
    };
  }

  if (request.employeeId !== employeeId) {
    return {
      success: false,
      message: "אין הרשאה לבטל בקשה זו",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "ניתן לבטל רק בקשות ממתינות",
    };
  }

  await prisma.leaveRequest.delete({
    where: { id: requestId },
  });

  revalidatePath("/employee");
  revalidatePath("/employee/leave");

  return {
    success: true,
    message: "הבקשה בוטלה בהצלחה",
  };
}
