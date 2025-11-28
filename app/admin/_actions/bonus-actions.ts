// app/admin/_actions/bonus-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { bonusFormSchema, type BonusFormValues } from "@/lib/validations/bonus";
import type { ActorType, BonusType } from "@/types/prisma";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type BonusWithDetails = {
  id: string;
  bonusType: BonusType;
  amountPerHour: number | null; // in shekels
  amountFixed: number | null; // in shekels
  validFrom: string;
  validTo: string;
  description: string | null;
  isActive: boolean;
};

export async function getEmployeeBonuses(
  employeeId: string
): Promise<BonusWithDetails[]> {
  const bonuses = await prisma.employeeBonus.findMany({
    where: { employeeId },
    orderBy: { validFrom: "desc" },
  });

  const now = new Date();

  return bonuses.map((bonus: typeof bonuses[number]) => ({
    id: bonus.id,
    bonusType: bonus.bonusType,
    amountPerHour: bonus.amountPerHour ? bonus.amountPerHour / 100 : null,
    amountFixed: bonus.amountFixed ? bonus.amountFixed / 100 : null,
    validFrom: bonus.validFrom?.toISOString() ?? "",
    validTo: bonus.validTo?.toISOString() ?? "",
    description: bonus.description,
    isActive:
      bonus.validFrom !== null &&
      bonus.validTo !== null &&
      bonus.validFrom <= now &&
      bonus.validTo >= now,
  }));
}

export async function createBonus(
  employeeId: string,
  data: BonusFormValues
): Promise<ActionResult> {
  const parsed = bonusFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { bonusType, amountPerHour, amountFixed, validFrom, validTo, description } =
    parsed.data;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  const bonus = await prisma.employeeBonus.create({
    data: {
      employeeId,
      bonusType: bonusType as BonusType,
      amountPerHour:
        bonusType === "HOURLY" && amountPerHour
          ? Math.round(amountPerHour * 100)
          : null,
      amountFixed:
        bonusType === "ONE_TIME" && amountFixed
          ? Math.round(amountFixed * 100)
          : null,
      validFrom,
      validTo,
      description: description || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE_BONUS",
      entityId: bonus.id,
      action: "CREATE",
      after: {
        employeeId,
        bonusType,
        amountPerHour:
          bonusType === "HOURLY" ? Math.round((amountPerHour ?? 0) * 100) : null,
        amountFixed:
          bonusType === "ONE_TIME" ? Math.round((amountFixed ?? 0) * 100) : null,
        validFrom,
        validTo,
        description,
      },
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "הבונוס נוצר בהצלחה",
  };
}

export async function updateBonus(
  bonusId: string,
  data: BonusFormValues
): Promise<ActionResult> {
  const parsed = bonusFormSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "נתונים לא תקינים",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { bonusType, amountPerHour, amountFixed, validFrom, validTo, description } =
    parsed.data;

  const existing = await prisma.employeeBonus.findUnique({
    where: { id: bonusId },
  });

  if (!existing) {
    return {
      success: false,
      message: "הבונוס לא נמצא",
    };
  }

  const beforeData = {
    bonusType: existing.bonusType,
    amountPerHour: existing.amountPerHour,
    amountFixed: existing.amountFixed,
    validFrom: existing.validFrom,
    validTo: existing.validTo,
    description: existing.description,
  };

  await prisma.employeeBonus.update({
    where: { id: bonusId },
    data: {
      bonusType: bonusType as BonusType,
      amountPerHour:
        bonusType === "HOURLY" && amountPerHour
          ? Math.round(amountPerHour * 100)
          : null,
      amountFixed:
        bonusType === "ONE_TIME" && amountFixed
          ? Math.round(amountFixed * 100)
          : null,
      validFrom,
      validTo,
      description: description || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE_BONUS",
      entityId: bonusId,
      action: "UPDATE",
      before: beforeData,
      after: {
        bonusType,
        amountPerHour:
          bonusType === "HOURLY" ? Math.round((amountPerHour ?? 0) * 100) : null,
        amountFixed:
          bonusType === "ONE_TIME" ? Math.round((amountFixed ?? 0) * 100) : null,
        validFrom,
        validTo,
        description,
      },
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "הבונוס עודכן בהצלחה",
  };
}

export async function deleteBonus(bonusId: string): Promise<ActionResult> {
  const existing = await prisma.employeeBonus.findUnique({
    where: { id: bonusId },
  });

  if (!existing) {
    return {
      success: false,
      message: "הבונוס לא נמצא",
    };
  }

  const beforeData = {
    employeeId: existing.employeeId,
    bonusType: existing.bonusType,
    amountPerHour: existing.amountPerHour,
    amountFixed: existing.amountFixed,
    validFrom: existing.validFrom,
    validTo: existing.validTo,
    description: existing.description,
  };

  await prisma.employeeBonus.delete({
    where: { id: bonusId },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MANAGER" as ActorType,
      entity: "EMPLOYEE_BONUS",
      entityId: bonusId,
      action: "DELETE",
      before: beforeData,
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "הבונוס נמחק בהצלחה",
  };
}