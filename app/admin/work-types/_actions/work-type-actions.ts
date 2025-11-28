// app/admin/work-types/_actions/work-type-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  workTypeFormSchema,
  type WorkTypeFormValues,
} from "@/lib/validations/work-type";
import type { ActorType } from "@/types/prisma";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function createWorkType(
  data: WorkTypeFormValues
): Promise<ActionResult> {
  const parsed = workTypeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, isDefault } = parsed.data;

  // אם זה ברירת מחדל חדשה, בטל את הקודמת
  if (isDefault) {
    await prisma.workType.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const workType = await prisma.workType.create({
    data: {
      name,
      description: description || null,
      isDefault,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "WORK_TYPE",
      entityId: workType.id,
      action: "CREATE",
      after: {
        name,
        description: description || null,
        isDefault,
      },
    },
  });

  revalidatePath("/admin/work-types");

  return {
    success: true,
    message: "סוג העבודה נוצר בהצלחה",
  };
}

export async function updateWorkType(
  id: string,
  data: WorkTypeFormValues
): Promise<ActionResult> {
  const parsed = workTypeFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, description, isDefault } = parsed.data;

  const existing = await prisma.workType.findUnique({
    where: { id },
  });

  if (!existing) {
    return {
      success: false,
      message: "סוג העבודה לא נמצא",
    };
  }

  const beforeData = {
    name: existing.name,
    description: existing.description,
    isDefault: existing.isDefault,
  };

  // אם זה ברירת מחדל חדשה, בטל את הקודמת
  if (isDefault && !existing.isDefault) {
    await prisma.workType.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.workType.update({
    where: { id },
    data: {
      name,
      description: description || null,
      isDefault,
    },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "WORK_TYPE",
      entityId: id,
      action: "UPDATE",
      before: beforeData,
      after: {
        name,
        description: description || null,
        isDefault,
      },
    },
  });

  revalidatePath("/admin/work-types");

  return {
    success: true,
    message: "סוג העבודה עודכן בהצלחה",
  };
}

export async function deleteWorkType(id: string): Promise<ActionResult> {
  const existing = await prisma.workType.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          shifts: true,
          employeeRates: true,
        },
      },
    },
  });

  if (!existing) {
    return {
      success: false,
      message: "סוג העבודה לא נמצא",
    };
  }

  // בדיקה אם יש משמרות משויכות
  if (existing._count.shifts > 0) {
    return {
      success: false,
      message: `לא ניתן למחוק - יש ${existing._count.shifts} משמרות משויכות לסוג עבודה זה`,
    };
  }

  const beforeData = {
    name: existing.name,
    description: existing.description,
    isDefault: existing.isDefault,
  };

  // מחיקת תעריפים קשורים (Cascade לא יעזור כי זה בדיקה ידנית)
  await prisma.employeeWorkRate.deleteMany({
    where: { workTypeId: id },
  });

  await prisma.workType.delete({
    where: { id },
  });

  // רישום ב-AuditLog
  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "WORK_TYPE",
      entityId: id,
      action: "DELETE",
      before: beforeData,
    },
  });

  revalidatePath("/admin/work-types");

  return {
    success: true,
    message: "סוג העבודה נמחק בהצלחה",
  };
}