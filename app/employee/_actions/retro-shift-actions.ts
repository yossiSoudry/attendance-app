// app/employee/_actions/retro-shift-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ========================================
// Validation Schema
// ========================================

const retroShiftSchema = z
  .object({
    workTypeId: z.string().uuid().optional(),
    date: z.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין"),
    notes: z.string().max(500, "ההערה יכולה להכיל עד 500 תווים").optional(),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return endMinutes > startMinutes;
    },
    {
      message: "שעת סיום חייבת להיות אחרי שעת התחלה",
      path: ["endTime"],
    }
  );

export type RetroShiftInput = z.infer<typeof retroShiftSchema>;

export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

// ========================================
// Submit Retroactive Shift
// ========================================

export async function submitRetroShift(
  employeeId: string,
  data: RetroShiftInput
): Promise<ActionResult> {
  try {
    // Validate input
    const validated = retroShiftSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        message: "נתונים לא תקינים",
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { workTypeId, date, startTime, endTime, notes } = validated.data;

    // Build start and end DateTime
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endH, endM, 0, 0);

    // Check if date is in the past
    const now = new Date();
    if (startDateTime >= now) {
      return {
        success: false,
        message: "ניתן לדווח רק על משמרות שכבר התרחשו",
      };
    }

    // Check for overlapping shifts
    const overlapping = await prisma.shift.findFirst({
      where: {
        employeeId,
        status: { notIn: ["REJECTED"] },
        OR: [
          {
            startTime: { lte: startDateTime },
            endTime: { gte: startDateTime },
          },
          {
            startTime: { lte: endDateTime },
            endTime: { gte: endDateTime },
          },
          {
            startTime: { gte: startDateTime },
            endTime: { lte: endDateTime },
          },
        ],
      },
    });

    if (overlapping) {
      return {
        success: false,
        message: "קיימת משמרת חופפת בתאריך זה",
      };
    }

    // Create the retroactive shift
    const shift = await prisma.shift.create({
      data: {
        employeeId,
        workTypeId: workTypeId || null,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "PENDING_APPROVAL",
        source: "web",
        isManual: true,
        isRetro: true,
        notesEmployee: notes || null,
      },
    });

    // Create time events
    await prisma.timeEvent.createMany({
      data: [
        {
          employeeId,
          shiftId: shift.id,
          eventType: "CORRECTION_IN",
          createdBy: "EMPLOYEE",
          time: startDateTime,
        },
        {
          employeeId,
          shiftId: shift.id,
          eventType: "CORRECTION_OUT",
          createdBy: "EMPLOYEE",
          time: endDateTime,
        },
      ],
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: employeeId,
        actorType: "EMPLOYEE",
        entity: "SHIFT",
        entityId: shift.id,
        action: "CREATE",
        after: {
          id: shift.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: "PENDING_APPROVAL",
          isRetro: true,
        },
      },
    });

    revalidatePath("/employee");
    revalidatePath("/admin/shifts");

    return {
      success: true,
      message: "המשמרת נשלחה לאישור המנהל",
    };
  } catch (error) {
    console.error("Error submitting retro shift:", error);
    return {
      success: false,
      message: "שגיאה בשליחת המשמרת",
    };
  }
}

// ========================================
// Get Employee's Pending Shifts
// ========================================

export type PendingShiftInfo = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  workTypeName: string | null;
  status: "PENDING_APPROVAL" | "REJECTED";
  notesManager: string | null;
  createdAt: string;
};

export async function getEmployeePendingShifts(
  employeeId: string
): Promise<PendingShiftInfo[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      employeeId,
      isRetro: true,
      status: { in: ["PENDING_APPROVAL", "REJECTED"] },
    },
    include: {
      workType: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return shifts.map((shift: typeof shifts[number]) => ({
    id: shift.id,
    date: shift.startTime.toLocaleDateString("he-IL"),
    startTime: shift.startTime.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    endTime: shift.endTime?.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "",
    workTypeName: shift.workType?.name ?? null,
    status: shift.status as "PENDING_APPROVAL" | "REJECTED",
    notesManager: shift.notesManager,
    createdAt: shift.createdAt.toLocaleDateString("he-IL"),
  }));
}

// ========================================
// Cancel Pending Shift
// ========================================

export async function cancelPendingShift(
  employeeId: string,
  shiftId: string
): Promise<ActionResult> {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return { success: false, message: "משמרת לא נמצאה" };
    }

    if (shift.employeeId !== employeeId) {
      return { success: false, message: "אין הרשאה לבטל משמרת זו" };
    }

    if (shift.status !== "PENDING_APPROVAL") {
      return { success: false, message: "ניתן לבטל רק משמרות ממתינות לאישור" };
    }

    // Delete the shift and related time events
    await prisma.timeEvent.deleteMany({
      where: { shiftId },
    });

    await prisma.shift.delete({
      where: { id: shiftId },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        actorId: employeeId,
        actorType: "EMPLOYEE",
        entity: "SHIFT",
        entityId: shiftId,
        action: "DELETE",
        before: {
          id: shift.id,
          status: shift.status,
          isRetro: shift.isRetro,
        },
      },
    });

    revalidatePath("/employee");
    revalidatePath("/admin/shifts");

    return {
      success: true,
      message: "המשמרת בוטלה",
    };
  } catch (error) {
    console.error("Error canceling shift:", error);
    return {
      success: false,
      message: "שגיאה בביטול המשמרת",
    };
  }
}