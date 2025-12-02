// app/admin/_actions/approval-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireOrganizationId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ========================================
// Types
// ========================================

export type ActionResult = {
  success: boolean;
  message: string;
};

export type PendingShiftDetails = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  duration: string;
  workTypeName: string | null;
  notesEmployee: string | null;
  createdAt: string;
};

// ========================================
// Get Pending Shifts
// ========================================

export async function getPendingShifts(): Promise<PendingShiftDetails[]> {
  const organizationId = await requireOrganizationId();

  const shifts = await prisma.shift.findMany({
    where: {
      organizationId,
      status: "PENDING_APPROVAL",
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
      workType: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return shifts.map((shift: typeof shifts[number]) => {
    // Calculate duration
    const durationMs = shift.endTime
      ? shift.endTime.getTime() - shift.startTime.getTime()
      : 0;
    const durationMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const duration = `${hours}:${minutes.toString().padStart(2, "0")}`;

    // Day of week in Hebrew
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayOfWeek = days[shift.startTime.getDay()];

    return {
      id: shift.id,
      employeeId: shift.employee.id,
      employeeName: shift.employee.fullName,
      date: shift.startTime.toLocaleDateString("he-IL"),
      dayOfWeek,
      startTime: shift.startTime.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endTime:
        shift.endTime?.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }) ?? "",
      duration,
      workTypeName: shift.workType?.name ?? null,
      notesEmployee: shift.notesEmployee,
      createdAt: shift.createdAt.toLocaleDateString("he-IL"),
    };
  });
}

// ========================================
// Get Pending Shifts Count
// ========================================

export async function getPendingShiftsCount(): Promise<number> {
  const organizationId = await requireOrganizationId();

  return prisma.shift.count({
    where: {
      organizationId,
      status: "PENDING_APPROVAL",
    },
  });
}

// ========================================
// Approve Shift
// ========================================

export async function approveShift(
  shiftId: string,
  managerId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const organizationId = await requireOrganizationId();

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        organizationId,
      },
    });

    if (!shift) {
      return { success: false, message: "משמרת לא נמצאה" };
    }

    if (shift.status !== "PENDING_APPROVAL") {
      return { success: false, message: "משמרת זו אינה ממתינה לאישור" };
    }

    const before = { ...shift };

    // Update shift status to CLOSED (approved)
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        approvedById: managerId,
        approvedAt: new Date(),
        notesManager: notes || null,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: managerId,
        actorType: "MANAGER",
        entity: "SHIFT",
        entityId: shiftId,
        action: "UPDATE",
        before: {
          status: before.status,
        },
        after: {
          status: "CLOSED",
          approvedById: managerId,
          approvedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath("/employee");

    return {
      success: true,
      message: "המשמרת אושרה בהצלחה",
    };
  } catch (error) {
    console.error("Error approving shift:", error);
    return {
      success: false,
      message: "שגיאה באישור המשמרת",
    };
  }
}

// ========================================
// Reject Shift
// ========================================

export async function rejectShift(
  shiftId: string,
  managerId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const organizationId = await requireOrganizationId();

    if (!reason || reason.trim().length === 0) {
      return { success: false, message: "יש לציין סיבת דחייה" };
    }

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        organizationId,
      },
    });

    if (!shift) {
      return { success: false, message: "משמרת לא נמצאה" };
    }

    if (shift.status !== "PENDING_APPROVAL") {
      return { success: false, message: "משמרת זו אינה ממתינה לאישור" };
    }

    const before = { ...shift };

    // Update shift status to REJECTED
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: "REJECTED",
        approvedById: managerId,
        approvedAt: new Date(),
        notesManager: reason,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: managerId,
        actorType: "MANAGER",
        entity: "SHIFT",
        entityId: shiftId,
        action: "UPDATE",
        before: {
          status: before.status,
        },
        after: {
          status: "REJECTED",
          approvedById: managerId,
          notesManager: reason,
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath("/employee");

    return {
      success: true,
      message: "המשמרת נדחתה",
    };
  } catch (error) {
    console.error("Error rejecting shift:", error);
    return {
      success: false,
      message: "שגיאה בדחיית המשמרת",
    };
  }
}

// ========================================
// Update and Approve Shift
// ========================================

export type UpdateShiftInput = {
  workTypeId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  notesManager?: string;
};

export async function updatePendingShift(
  shiftId: string,
  managerId: string,
  data: UpdateShiftInput
): Promise<ActionResult> {
  try {
    const organizationId = await requireOrganizationId();

    const shift = await prisma.shift.findFirst({
      where: {
        id: shiftId,
        organizationId,
      },
    });

    if (!shift) {
      return { success: false, message: "משמרת לא נמצאה" };
    }

    if (shift.status !== "PENDING_APPROVAL") {
      return { success: false, message: "משמרת זו אינה ממתינה לאישור" };
    }

    const before = { ...shift };

    // Build new start and end times
    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);

    const startDateTime = new Date(data.date);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(data.date);
    endDateTime.setHours(endH, endM, 0, 0);

    // Update shift - set to CORRECTED status to indicate it was edited
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        workTypeId: data.workTypeId || null,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "CLOSED",
        approvedById: managerId,
        approvedAt: new Date(),
        notesManager: data.notesManager || null,
      },
    });

    // Update time events
    await prisma.timeEvent.deleteMany({
      where: { shiftId },
    });

    await prisma.timeEvent.createMany({
      data: [
        {
          organizationId,
          employeeId: shift.employeeId,
          shiftId,
          eventType: "CORRECTION_IN",
          createdBy: "MANAGER",
          time: startDateTime,
        },
        {
          organizationId,
          employeeId: shift.employeeId,
          shiftId,
          eventType: "CORRECTION_OUT",
          createdBy: "MANAGER",
          time: endDateTime,
        },
      ],
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: managerId,
        actorType: "MANAGER",
        entity: "SHIFT",
        entityId: shiftId,
        action: "UPDATE",
        before: {
          startTime: before.startTime.toISOString(),
          endTime: before.endTime?.toISOString(),
          workTypeId: before.workTypeId,
          status: before.status,
        },
        after: {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          workTypeId: data.workTypeId || null,
          status: "CLOSED",
          approvedById: managerId,
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath("/employee");

    return {
      success: true,
      message: "המשמרת עודכנה ואושרה בהצלחה",
    };
  } catch (error) {
    console.error("Error updating shift:", error);
    return {
      success: false,
      message: "שגיאה בעדכון המשמרת",
    };
  }
}

// ========================================
// Approve All Pending Shifts
// ========================================

export async function approveAllPendingShifts(
  managerId: string
): Promise<ActionResult> {
  try {
    const organizationId = await requireOrganizationId();

    const pendingShifts = await prisma.shift.findMany({
      where: {
        organizationId,
        status: "PENDING_APPROVAL",
      },
      select: { id: true },
    });

    if (pendingShifts.length === 0) {
      return { success: false, message: "אין משמרות ממתינות לאישור" };
    }

    // Update all pending shifts
    await prisma.shift.updateMany({
      where: {
        organizationId,
        status: "PENDING_APPROVAL",
      },
      data: {
        status: "CLOSED",
        approvedById: managerId,
        approvedAt: new Date(),
      },
    });

    // Log to audit (one entry for bulk action)
    await prisma.auditLog.create({
      data: {
        organizationId,
        actorId: managerId,
        actorType: "MANAGER",
        entity: "SHIFT",
        entityId: "00000000-0000-0000-0000-000000000000", // Placeholder for bulk
        action: "UPDATE",
        before: {
          action: "BULK_APPROVE",
          count: pendingShifts.length,
        },
        after: {
          status: "CLOSED",
          shiftIds: pendingShifts.map((s: { id: string }) => s.id),
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/shifts");
    revalidatePath("/employee");

    return {
      success: true,
      message: `${pendingShifts.length} משמרות אושרו בהצלחה`,
    };
  } catch (error) {
    console.error("Error approving all shifts:", error);
    return {
      success: false,
      message: "שגיאה באישור המשמרות",
    };
  }
}