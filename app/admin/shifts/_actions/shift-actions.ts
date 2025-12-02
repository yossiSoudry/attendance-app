// app/admin/shifts/_actions/shift-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { shiftFormSchema, type ShiftFormValues } from "@/lib/validations/shift";
import type { ActorType, ShiftStatus } from "@/types/prisma";
import { requireOrganizationId } from "@/lib/auth";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export async function createShift(data: ShiftFormValues): Promise<ActionResult> {
  const organizationId = await requireOrganizationId();

  const parsed = shiftFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { employeeId, workTypeId, startDate, startTime, endTime, notesManager } =
    parsed.data;

  const startDateTime = combineDateAndTime(startDate, startTime);
  const endDateTime = combineDateAndTime(startDate, endTime);

  if (endDateTime <= startDateTime) {
    return {
      success: false,
      message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
      errors: { endTime: ["שעת הסיום חייבת להיות אחרי שעת ההתחלה"] },
    };
  }

  const shift = await prisma.shift.create({
    data: {
      organizationId,
      employeeId,
      workTypeId: workTypeId || null,
      startTime: startDateTime,
      endTime: endDateTime,
      status: "CLOSED" as ShiftStatus,
      source: "web",
      isManual: true,
      notesManager,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorType: "MANAGER" as ActorType,
      entity: "SHIFT",
      entityId: shift.id,
      action: "CREATE",
      after: {
        employeeId,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "CLOSED" as ShiftStatus,
      },
    },
  });

  revalidatePath("/admin/shifts");

  return {
    success: true,
    message: "המשמרת נוצרה בהצלחה",
  };
}

export async function updateShift(
  id: string,
  data: ShiftFormValues
): Promise<ActionResult> {
  const organizationId = await requireOrganizationId();

  const parsed = shiftFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { employeeId, workTypeId, startDate, startTime, endTime, notesManager } =
    parsed.data;

  const startDateTime = combineDateAndTime(startDate, startTime);
  const endDateTime = combineDateAndTime(startDate, endTime);

  if (endDateTime <= startDateTime) {
    return {
      success: false,
      message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
      errors: { endTime: ["שעת הסיום חייבת להיות אחרי שעת ההתחלה"] },
    };
  }

  const existing = await prisma.shift.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    return {
      success: false,
      message: "המשמרת לא נמצאה",
    };
  }

  const beforeData = {
    employeeId: existing.employeeId,
    startTime: existing.startTime,
    endTime: existing.endTime,
    workTypeId: existing.workTypeId,
    notesManager: existing.notesManager,
  };

  await prisma.shift.update({
    where: { id },
    data: {
      employeeId,
      workTypeId: workTypeId || null,
      startTime: startDateTime,
      endTime: endDateTime,
      notesManager,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorType: "MANAGER" as ActorType,
      entity: "SHIFT",
      entityId: id,
      action: "UPDATE",
      before: beforeData,
      after: {
        employeeId,
        startTime: startDateTime,
        endTime: endDateTime,
        workTypeId: workTypeId || null,
        notesManager,
      },
    },
  });

  revalidatePath("/admin/shifts");

  return {
    success: true,
    message: "המשמרת עודכנה בהצלחה",
  };
}

export async function deleteShift(id: string): Promise<ActionResult> {
  const organizationId = await requireOrganizationId();

  const existing = await prisma.shift.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    return {
      success: false,
      message: "המשמרת לא נמצאה",
    };
  }

  const beforeData = {
    employeeId: existing.employeeId,
    startTime: existing.startTime,
    endTime: existing.endTime,
    status: existing.status,
  };

  await prisma.shift.delete({
    where: { id },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorType: "MANAGER" as ActorType,
      entity: "SHIFT",
      entityId: id,
      action: "DELETE",
      before: beforeData,
    },
  });

  revalidatePath("/admin/shifts");

  return {
    success: true,
    message: "המשמרת נמחקה בהצלחה",
  };
}