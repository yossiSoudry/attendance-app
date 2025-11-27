// app/admin/_actions/employee-work-rate-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActorType } from "@prisma/client";

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type EmployeeRateInput = {
  workTypeId: string;
  hourlyRate: number; // in shekels (will be converted to agorot)
};

export async function getEmployeeRates(employeeId: string) {
  const rates = await prisma.employeeWorkRate.findMany({
    where: { employeeId },
    include: {
      workType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { workType: { name: "asc" } },
  });

  return rates.map((rate) => ({
    id: rate.id,
    workTypeId: rate.workTypeId,
    workTypeName: rate.workType.name,
    hourlyRate: rate.hourlyRate / 100, // convert to shekels
  }));
}

export async function upsertEmployeeRate(
  employeeId: string,
  data: EmployeeRateInput
): Promise<ActionResult> {
  const { workTypeId, hourlyRate } = data;

  if (hourlyRate < 0 || hourlyRate > 1000) {
    return {
      success: false,
      message: "שכר לשעה חייב להיות בין 0 ל-1000 ₪",
    };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  const workType = await prisma.workType.findUnique({
    where: { id: workTypeId },
  });

  if (!workType) {
    return {
      success: false,
      message: "סוג העבודה לא נמצא",
    };
  }

  const hourlyRateAgorot = Math.round(hourlyRate * 100);

  const existing = await prisma.employeeWorkRate.findUnique({
    where: {
      employeeId_workTypeId: {
        employeeId,
        workTypeId,
      },
    },
  });

  if (existing) {
    // Update existing rate
    const beforeData = {
      hourlyRate: existing.hourlyRate,
    };

    await prisma.employeeWorkRate.update({
      where: { id: existing.id },
      data: { hourlyRate: hourlyRateAgorot },
    });

    await prisma.auditLog.create({
      data: {
        actorType: ActorType.MANAGER,
        entity: "EMPLOYEE_WORK_RATE",
        entityId: existing.id,
        action: "UPDATE",
        before: beforeData,
        after: { hourlyRate: hourlyRateAgorot },
      },
    });
  } else {
    // Create new rate
    const newRate = await prisma.employeeWorkRate.create({
      data: {
        employeeId,
        workTypeId,
        hourlyRate: hourlyRateAgorot,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorType: ActorType.MANAGER,
        entity: "EMPLOYEE_WORK_RATE",
        entityId: newRate.id,
        action: "CREATE",
        after: {
          employeeId,
          workTypeId,
          hourlyRate: hourlyRateAgorot,
        },
      },
    });
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: existing ? "התעריף עודכן בהצלחה" : "התעריף נוצר בהצלחה",
  };
}

export async function deleteEmployeeRate(
  employeeId: string,
  workTypeId: string
): Promise<ActionResult> {
  const existing = await prisma.employeeWorkRate.findUnique({
    where: {
      employeeId_workTypeId: {
        employeeId,
        workTypeId,
      },
    },
  });

  if (!existing) {
    return {
      success: false,
      message: "התעריף לא נמצא",
    };
  }

  const beforeData = {
    employeeId: existing.employeeId,
    workTypeId: existing.workTypeId,
    hourlyRate: existing.hourlyRate,
  };

  await prisma.employeeWorkRate.delete({
    where: { id: existing.id },
  });

  await prisma.auditLog.create({
    data: {
      actorType: ActorType.MANAGER,
      entity: "EMPLOYEE_WORK_RATE",
      entityId: existing.id,
      action: "DELETE",
      before: beforeData,
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    message: "התעריף נמחק בהצלחה",
  };
}

// Save all rates at once (for the dialog)
export async function saveEmployeeRates(
  employeeId: string,
  rates: EmployeeRateInput[]
): Promise<ActionResult> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return {
      success: false,
      message: "העובד לא נמצא",
    };
  }

  // Get existing rates
  const existingRates = await prisma.employeeWorkRate.findMany({
    where: { employeeId },
  });

  const existingMap = new Map(
    existingRates.map((r) => [r.workTypeId, r])
  );

  const newRatesMap = new Map(
    rates.filter((r) => r.hourlyRate > 0).map((r) => [r.workTypeId, r])
  );

  // Delete rates that are no longer present or have 0 value
  const toDelete = existingRates.filter(
    (r) => !newRatesMap.has(r.workTypeId)
  );

  for (const rate of toDelete) {
    await prisma.employeeWorkRate.delete({
      where: { id: rate.id },
    });

    await prisma.auditLog.create({
      data: {
        actorType: ActorType.MANAGER,
        entity: "EMPLOYEE_WORK_RATE",
        entityId: rate.id,
        action: "DELETE",
        before: {
          employeeId: rate.employeeId,
          workTypeId: rate.workTypeId,
          hourlyRate: rate.hourlyRate,
        },
      },
    });
  }

  // Upsert remaining rates
  for (const [workTypeId, rateData] of newRatesMap) {
    const hourlyRateAgorot = Math.round(rateData.hourlyRate * 100);
    const existing = existingMap.get(workTypeId);

    if (existing) {
      if (existing.hourlyRate !== hourlyRateAgorot) {
        await prisma.employeeWorkRate.update({
          where: { id: existing.id },
          data: { hourlyRate: hourlyRateAgorot },
        });

        await prisma.auditLog.create({
          data: {
            actorType: ActorType.MANAGER,
            entity: "EMPLOYEE_WORK_RATE",
            entityId: existing.id,
            action: "UPDATE",
            before: { hourlyRate: existing.hourlyRate },
            after: { hourlyRate: hourlyRateAgorot },
          },
        });
      }
    } else {
      const newRate = await prisma.employeeWorkRate.create({
        data: {
          employeeId,
          workTypeId,
          hourlyRate: hourlyRateAgorot,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorType: ActorType.MANAGER,
          entity: "EMPLOYEE_WORK_RATE",
          entityId: newRate.id,
          action: "CREATE",
          after: {
            employeeId,
            workTypeId,
            hourlyRate: hourlyRateAgorot,
          },
        },
      });
    }
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "התעריפים נשמרו בהצלחה",
  };
}