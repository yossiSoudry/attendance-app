// app/api/tasks/process-scheduled/route.ts
// This API route processes scheduled tasks:
// 1. Makes scheduled one-time tasks visible when their scheduledDate arrives
// 2. Creates new task instances from recurring templates

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, setDate, getDay, startOfDay } from "date-fns";

// Helper to calculate next occurrence date
function getNextOccurrence(
  recurrenceType: string,
  recurrenceValue: number | null,
  fromDate: Date
): Date | null {
  const today = startOfDay(new Date());

  switch (recurrenceType) {
    case "DAILY":
      return addDays(fromDate, 1);

    case "WEEKLY":
      // Find next occurrence of the specified day of week
      if (recurrenceValue === null) return null;
      let nextWeekly = addDays(fromDate, 1);
      while (getDay(nextWeekly) !== recurrenceValue) {
        nextWeekly = addDays(nextWeekly, 1);
      }
      return nextWeekly;

    case "BIWEEKLY":
      // Every two weeks on specified day
      if (recurrenceValue === null) return null;
      let nextBiweekly = addWeeks(fromDate, 2);
      // Adjust to the correct day of week
      while (getDay(nextBiweekly) !== recurrenceValue) {
        nextBiweekly = addDays(nextBiweekly, 1);
      }
      return nextBiweekly;

    case "MONTHLY_DATE":
      // Specific date of month
      if (recurrenceValue === null) return null;
      const nextMonth = new Date(fromDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      // Handle months with fewer days
      const daysInMonth = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        0
      ).getDate();
      const targetDay = Math.min(recurrenceValue, daysInMonth);
      return setDate(nextMonth, targetDay);

    case "MONTHLY_DAY":
      // Specific day of specific week (not implemented yet)
      return null;

    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    // Verify the request has a valid authorization (for cron jobs)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const results = {
      activated: 0,
      created: 0,
      errors: [] as string[],
    };

    // 1. Activate scheduled one-time tasks that should now be visible
    const tasksToActivate = await prisma.task.findMany({
      where: {
        isVisible: false,
        isTemplate: false,
        scheduledDate: {
          lte: new Date(),
        },
      },
    });

    for (const task of tasksToActivate) {
      try {
        await prisma.task.update({
          where: { id: task.id },
          data: { isVisible: true },
        });
        results.activated++;
      } catch (error) {
        results.errors.push(`Failed to activate task ${task.id}`);
      }
    }

    // 2. Process recurring templates and create new instances
    const templates = await prisma.task.findMany({
      where: {
        isTemplate: true,
        recurrenceType: { not: "NONE" },
        OR: [
          { recurrenceEndDate: null },
          { recurrenceEndDate: { gte: today } },
        ],
      },
    });

    for (const template of templates) {
      try {
        const lastGenerated = template.lastGeneratedDate || template.createdAt;
        const nextDate = getNextOccurrence(
          template.recurrenceType,
          template.recurrenceValue,
          lastGenerated
        );

        // If nextDate is today or in the past, create the task
        if (nextDate && nextDate <= new Date()) {
          // Check if we should stop (recurrence end date reached)
          if (template.recurrenceEndDate && nextDate > template.recurrenceEndDate) {
            continue;
          }

          // Create new task instance
          await prisma.task.create({
            data: {
              employeeId: template.employeeId,
              title: template.title,
              description: template.description,
              dueDate: template.dueDate,
              requiresDocumentUpload: template.requiresDocumentUpload,
              managerNote: template.managerNote,
              createdBy: template.createdBy,
              templateId: template.id,
              isVisible: true,
              isTemplate: false,
              recurrenceType: "NONE",
            },
          });

          // Update template's lastGeneratedDate
          await prisma.task.update({
            where: { id: template.id },
            data: { lastGeneratedDate: nextDate },
          });

          results.created++;
        }
      } catch (error) {
        results.errors.push(`Failed to process template ${template.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to process scheduled tasks:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled tasks" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: Request) {
  return POST(request);
}
