// app/employee/_actions/clock-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ActorType, ShiftStatus, TimeEventType } from "@/types/prisma";

export type ClockInResult = {
  success: boolean;
  message: string;
};

export async function clockIn(workTypeId?: string): Promise<ClockInResult> {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      status: true,
      organizationId: true,
    },
  });

  if (!employee) {
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    redirect("/employee/login");
  }

  if (employee.status !== "ACTIVE") {
    return {
      success: false,
      message: "החשבון שלך חסום. פנה למנהל.",
    };
  }

  // Check for existing open shift
  const existingOpen = await prisma.shift.findFirst({
    where: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      status: "OPEN" as ShiftStatus,
    },
  });

  if (existingOpen) {
    return {
      success: false,
      message: "יש לך כבר משמרת פתוחה",
    };
  }

  // Validate workTypeId if provided
  if (workTypeId) {
    const workType = await prisma.workType.findUnique({
      where: {
        id: workTypeId,
        organizationId: employee.organizationId,
      },
    });

    if (!workType) {
      return {
        success: false,
        message: "סוג העבודה לא נמצא",
      };
    }
  }

  const now = new Date();

  const shift = await prisma.shift.create({
    data: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      workTypeId: workTypeId || null,
      status: "OPEN" as ShiftStatus,
      startTime: now,
      source: "web",
    },
  });

  await prisma.timeEvent.create({
    data: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      shiftId: shift.id,
      eventType: "CLOCK_IN" as TimeEventType,
      createdBy: "EMPLOYEE" as ActorType,
      time: now,
    },
  });

  revalidatePath("/employee");

  return {
    success: true,
    message: "נכנסת למשמרת בהצלחה",
  };
}

export async function clockOut(): Promise<ClockInResult> {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    redirect("/employee/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!employee) {
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    redirect("/employee/login");
  }

  const openShift = await prisma.shift.findFirst({
    where: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      status: "OPEN" as ShiftStatus,
    },
    orderBy: { startTime: "desc" },
  });

  if (!openShift) {
    return {
      success: false,
      message: "אין משמרת פתוחה",
    };
  }

  const now = new Date();

  await prisma.shift.update({
    where: { id: openShift.id },
    data: {
      endTime: now,
      status: "CLOSED" as ShiftStatus,
    },
  });

  await prisma.timeEvent.create({
    data: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      shiftId: openShift.id,
      eventType: "CLOCK_OUT" as TimeEventType,
      createdBy: "EMPLOYEE" as ActorType,
      time: now,
    },
  });

  revalidatePath("/employee");

  return {
    success: true,
    message: "יצאת מהמשמרת בהצלחה",
  };
}

export async function getWorkTypesForEmployee() {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    return [];
  }

  // Get employee's organizationId
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { organizationId: true },
  });

  if (!employee) {
    return [];
  }

  // Get work types that are either:
  // 1. Default work type (available to all employees)
  // 2. Assigned to this employee via EmployeeWorkRate
  const workTypes = await prisma.workType.findMany({
    where: {
      organizationId: employee.organizationId,
      OR: [
        { isDefault: true },
        {
          employeeRates: {
            some: {
              employeeId: employeeId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      isDefault: true,
      rateType: true,
      rateValue: true,
    },
    orderBy: [
      { isDefault: "desc" }, // Default first
      { name: "asc" },
    ],
  });

  return workTypes;
}