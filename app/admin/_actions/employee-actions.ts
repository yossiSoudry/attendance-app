// app/admin/_actions/employee-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/validations/employee";
import { requireOrganizationId } from "@/lib/auth";
import type { ActorType } from "@/types/prisma";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createEmployee(data: EmployeeFormValues): Promise<ActionResult> {
  const organizationId = await requireOrganizationId();

  const parsed = employeeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    fullName,
    nationalId,
    baseHourlyRate,
    status,
    employmentType,
    monthlyRate,
    workDaysPerWeek,
    travelAllowanceType,
    travelAllowanceAmount,
  } = parsed.data;

  // בדיקה אם תעודת זהות כבר קיימת בארגון
  const existing = await prisma.employee.findUnique({
    where: {
      organizationId_nationalId: {
        organizationId,
        nationalId,
      }
    },
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
      organizationId,
      fullName,
      nationalId,
      status,
      employmentType,
      baseHourlyRate: Math.round(baseHourlyRate * 100), // המרה לאגורות
      monthlyRate: monthlyRate ? Math.round(monthlyRate * 100) : null,
      workDaysPerWeek,
      travelAllowanceType,
      travelAllowanceAmount: travelAllowanceAmount
        ? Math.round(travelAllowanceAmount * 100)
        : null,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE",
      entityId: employee.id,
      action: "CREATE",
      after: {
        fullName,
        nationalId,
        status,
        employmentType,
        baseHourlyRate: Math.round(baseHourlyRate * 100),
        monthlyRate: monthlyRate ? Math.round(monthlyRate * 100) : null,
        workDaysPerWeek,
        travelAllowanceType,
        travelAllowanceAmount: travelAllowanceAmount
          ? Math.round(travelAllowanceAmount * 100)
          : null,
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
  const organizationId = await requireOrganizationId();

  const parsed = employeeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    fullName,
    nationalId,
    baseHourlyRate,
    status,
    employmentType,
    monthlyRate,
    workDaysPerWeek,
    travelAllowanceType,
    travelAllowanceAmount,
  } = parsed.data;

  // בדיקה אם העובד קיים בארגון
  const existing = await prisma.employee.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  // בדיקה אם תעודת זהות כבר קיימת אצל עובד אחר בארגון
  const duplicate = await prisma.employee.findFirst({
    where: {
      organizationId,
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
    status: existing.status,
    employmentType: existing.employmentType,
    baseHourlyRate: existing.baseHourlyRate,
    monthlyRate: existing.monthlyRate,
    workDaysPerWeek: existing.workDaysPerWeek,
    travelAllowanceType: existing.travelAllowanceType,
    travelAllowanceAmount: existing.travelAllowanceAmount,
  };

  await prisma.employee.update({
    where: { id },
    data: {
      fullName,
      nationalId,
      status,
      employmentType,
      baseHourlyRate: Math.round(baseHourlyRate * 100),
      monthlyRate: monthlyRate ? Math.round(monthlyRate * 100) : null,
      workDaysPerWeek,
      travelAllowanceType,
      travelAllowanceAmount: travelAllowanceAmount
        ? Math.round(travelAllowanceAmount * 100)
        : null,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE",
      entityId: id,
      action: "UPDATE",
      before: beforeData,
      after: {
        fullName,
        nationalId,
        status,
        employmentType,
        baseHourlyRate: Math.round(baseHourlyRate * 100),
        monthlyRate: monthlyRate ? Math.round(monthlyRate * 100) : null,
        workDaysPerWeek,
        travelAllowanceType,
        travelAllowanceAmount: travelAllowanceAmount
          ? Math.round(travelAllowanceAmount * 100)
          : null,
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
  const organizationId = await requireOrganizationId();

  const existing = await prisma.employee.findFirst({
    where: { id, organizationId },
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
    status: existing.status,
    employmentType: existing.employmentType,
    baseHourlyRate: existing.baseHourlyRate,
    monthlyRate: existing.monthlyRate,
    workDaysPerWeek: existing.workDaysPerWeek,
    travelAllowanceType: existing.travelAllowanceType,
    travelAllowanceAmount: existing.travelAllowanceAmount,
  };

  await prisma.employee.delete({
    where: { id },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      organizationId,
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