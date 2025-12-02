// app/admin/leave/_actions/leave-admin-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession, requireOrganizationId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ========================================
// Types
// ========================================

export type LeaveRequestForAdmin = {
  id: string;
  employeeId: string;
  employeeName: string;
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
};

// ========================================
// Get Functions
// ========================================

export async function getPendingLeaveRequests(): Promise<LeaveRequestForAdmin[]> {
  await requireAdminSession();
  const organizationId = await requireOrganizationId();

  const requests = await prisma.leaveRequest.findMany({
    where: {
      organizationId,
      status: "PENDING"
    },
    include: {
      employee: {
        select: { fullName: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return requests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.fullName,
    leaveType: r.leaveType as "VACATION" | "SICK",
    status: r.status as "PENDING",
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

export async function getAllLeaveRequests(
  filters?: {
    status?: string;
    employeeId?: string;
  }
): Promise<LeaveRequestForAdmin[]> {
  await requireAdminSession();
  const organizationId = await requireOrganizationId();

  const where: Record<string, unknown> = {
    organizationId,
  };

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.employeeId && filters.employeeId !== "all") {
    where.employeeId = filters.employeeId;
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.fullName,
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

export async function getPendingLeaveCount(): Promise<number> {
  await requireAdminSession();
  const organizationId = await requireOrganizationId();

  return prisma.leaveRequest.count({
    where: {
      organizationId,
      status: "PENDING"
    },
  });
}

// ========================================
// Action Functions
// ========================================

export async function approveLeaveRequest(
  requestId: string,
  managerNote?: string
): Promise<ActionResult> {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  const request = await prisma.leaveRequest.findFirst({
    where: {
      id: requestId,
      organizationId
    },
  });

  if (!request) {
    return {
      success: false,
      message: "הבקשה לא נמצאה",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "ניתן לאשר רק בקשות ממתינות",
    };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      approvedDays: request.totalDays,
      approvedById: session.user.id,
      approvedAt: new Date(),
      managerNote: managerNote || null,
    },
  });

  revalidatePath("/admin/leave");
  revalidatePath("/employee/leave");

  return {
    success: true,
    message: "הבקשה אושרה בהצלחה",
  };
}

export async function partiallyApproveLeaveRequest(
  requestId: string,
  approvedDays: number,
  managerNote?: string
): Promise<ActionResult> {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  const request = await prisma.leaveRequest.findFirst({
    where: {
      id: requestId,
      organizationId
    },
  });

  if (!request) {
    return {
      success: false,
      message: "הבקשה לא נמצאה",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "ניתן לאשר רק בקשות ממתינות",
    };
  }

  if (approvedDays <= 0 || approvedDays >= request.totalDays) {
    return {
      success: false,
      message: "מספר הימים לא תקין",
    };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "PARTIALLY_APPROVED",
      approvedDays,
      approvedById: session.user.id,
      approvedAt: new Date(),
      managerNote: managerNote || null,
    },
  });

  revalidatePath("/admin/leave");
  revalidatePath("/employee/leave");

  return {
    success: true,
    message: `הבקשה אושרה חלקית (${approvedDays} ימים)`,
  };
}

export async function rejectLeaveRequest(
  requestId: string,
  managerNote?: string
): Promise<ActionResult> {
  const session = await requireAdminSession();
  const organizationId = await requireOrganizationId();

  const request = await prisma.leaveRequest.findFirst({
    where: {
      id: requestId,
      organizationId
    },
  });

  if (!request) {
    return {
      success: false,
      message: "הבקשה לא נמצאה",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "ניתן לדחות רק בקשות ממתינות",
    };
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      approvedById: session.user.id,
      approvedAt: new Date(),
      managerNote: managerNote || null,
    },
  });

  revalidatePath("/admin/leave");
  revalidatePath("/employee/leave");

  return {
    success: true,
    message: "הבקשה נדחתה",
  };
}
