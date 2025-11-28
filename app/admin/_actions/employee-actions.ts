// app/admin/_actions/employee-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/validations/employee";
import type { ActorType } from "@/types/prisma";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createEmployee(data: EmployeeFormValues): Promise<ActionResult> {
  const parsed = employeeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, nationalId, baseHourlyRate, status } = parsed.data;

  // בדיקה אם תעודת זהות כבר קיימת
  const existing = await prisma.employee.findUnique({
    where: { nationalId },
  });

  if (existing) {
    return {
      success: false,
      message: "תעודת זהות כבר קיימת במערכת",
      errors: { nationalId: ["תעודת זהות כבר קיימת במערכת"] },
    };
  }

  const employee = await prisma.employee.create({
    data: {
      fullName,
      nationalId,
      baseHourlyRate: Math.round(baseHourlyRate * 100), // המרה לאגורות
      status,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE",
      entityId: employee.id,
      action: "CREATE",
      after: {
        fullName,
        nationalId,
        baseHourlyRate: Math.round(baseHourlyRate * 100),
        status,
      },
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "העובד נוצר בהצלחה",
  };
}

export async function updateEmployee(
  id: string,
  data: EmployeeFormValues
): Promise<ActionResult> {
  const parsed = employeeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { fullName, nationalId, baseHourlyRate, status } = parsed.data;

  // בדיקה אם העובד קיים
  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  // בדיקה אם תעודת זהות כבר קיימת אצל עובד אחר
  const duplicate = await prisma.employee.findFirst({
    where: {
      nationalId,
      NOT: { id },
    },
  });

  if (duplicate) {
    return {
      success: false,
      message: "תעודת זהות כבר קיימת במערכת",
      errors: { nationalId: ["תעודת זהות כבר קיימת אצל עובד אחר"] },
    };
  }

  const beforeData = {
    fullName: existing.fullName,
    nationalId: existing.nationalId,
    baseHourlyRate: existing.baseHourlyRate,
    status: existing.status,
  };

  await prisma.employee.update({
    where: { id },
    data: {
      fullName,
      nationalId,
      baseHourlyRate: Math.round(baseHourlyRate * 100),
      status,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE",
      entityId: id,
      action: "UPDATE",
      before: beforeData,
      after: {
        fullName,
        nationalId,
        baseHourlyRate: Math.round(baseHourlyRate * 100),
        status,
      },
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "העובד עודכן בהצלחה",
  };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  const beforeData = {
    fullName: existing.fullName,
    nationalId: existing.nationalId,
    baseHourlyRate: existing.baseHourlyRate,
    status: existing.status,
  };

  await prisma.employee.delete({
    where: { id },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE",
      entityId: id,
      action: "DELETE",
      before: beforeData,
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "העובד נמחק בהצלחה",
  };
}