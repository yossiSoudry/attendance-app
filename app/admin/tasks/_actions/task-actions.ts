// app/admin/tasks/_actions/task-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TaskStatus, RecurrenceType } from "@prisma/client";
import type { TaskFormValues, RecurrenceTypeValue } from "@/lib/validations/task";

// ========================================
// Types
// ========================================

export type TaskWithEmployee = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  requiresDocumentUpload: boolean;
  employeeNote: string | null;
  managerNote: string | null;
  createdAt: Date;
  completedAt: Date | null;
  // Scheduling fields
  scheduledDate: Date | null;
  isVisible: boolean;
  // Recurrence fields
  recurrenceType: RecurrenceType;
  recurrenceValue: number | null;
  recurrenceEndDate: Date | null;
  isTemplate: boolean;
};

// ========================================
// Actions
// ========================================

export async function createTask(input: TaskFormValues) {
  try {
    const hasScheduling = input.scheduledDate || input.recurrenceType !== "NONE";
    const isRecurring = input.recurrenceType !== "NONE";

    // For immediate tasks or first occurrence of scheduled tasks
    const isVisibleNow = !input.scheduledDate || new Date(input.scheduledDate) <= new Date();

    const task = await prisma.task.create({
      data: {
        employeeId: input.employeeId,
        title: input.title,
        description: input.description || null,
        dueDate: input.dueDate || null,
        requiresDocumentUpload: input.requiresDocumentUpload,
        managerNote: input.managerNote || null,
        createdBy: "MANAGER",
        // Scheduling
        scheduledDate: input.scheduledDate || null,
        isVisible: isVisibleNow,
        // Recurrence
        recurrenceType: input.recurrenceType as RecurrenceType,
        recurrenceValue: input.recurrenceValue ?? null,
        recurrenceEndDate: input.recurrenceEndDate || null,
        isTemplate: isRecurring,
        lastGeneratedDate: isRecurring ? new Date() : null,
      },
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/employee");
    return { success: true, task };
  } catch (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: "אירעה שגיאה ביצירת המשימה" };
  }
}

export async function updateTask(
  id: string,
  input: Partial<TaskFormValues> & { status?: TaskStatus }
) {
  try {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description || null;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate || null;
    if (input.requiresDocumentUpload !== undefined)
      updateData.requiresDocumentUpload = input.requiresDocumentUpload;
    if (input.managerNote !== undefined)
      updateData.managerNote = input.managerNote || null;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }
    // Scheduling fields
    if (input.scheduledDate !== undefined) {
      updateData.scheduledDate = input.scheduledDate || null;
      // Update visibility based on scheduled date
      if (input.scheduledDate) {
        updateData.isVisible = new Date(input.scheduledDate) <= new Date();
      } else {
        updateData.isVisible = true;
      }
    }
    // Recurrence fields
    if (input.recurrenceType !== undefined) {
      updateData.recurrenceType = input.recurrenceType;
      updateData.isTemplate = input.recurrenceType !== "NONE";
    }
    if (input.recurrenceValue !== undefined)
      updateData.recurrenceValue = input.recurrenceValue ?? null;
    if (input.recurrenceEndDate !== undefined)
      updateData.recurrenceEndDate = input.recurrenceEndDate || null;

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: "אירעה שגיאה בעדכון המשימה" };
  }
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  employeeNote?: string
) {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    if (employeeNote !== undefined) {
      updateData.employeeNote = employeeNote || null;
    }

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { success: false, error: "אירעה שגיאה בעדכון סטטוס המשימה" };
  }
}

export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id },
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/employee");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: "אירעה שגיאה במחיקת המשימה" };
  }
}

export async function getAllTasks(): Promise<TaskWithEmployee[]> {
  const tasks = await prisma.task.findMany({
    where: {
      // Don't show template instances that haven't been generated yet
      // Templates are shown, instances are shown only when visible
      OR: [
        { isTemplate: true },
        { isVisible: true },
      ],
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    employeeId: task.employeeId,
    employeeName: task.employee.fullName,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    requiresDocumentUpload: task.requiresDocumentUpload,
    employeeNote: task.employeeNote,
    managerNote: task.managerNote,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    // Scheduling fields
    scheduledDate: task.scheduledDate,
    isVisible: task.isVisible,
    // Recurrence fields
    recurrenceType: task.recurrenceType,
    recurrenceValue: task.recurrenceValue,
    recurrenceEndDate: task.recurrenceEndDate,
    isTemplate: task.isTemplate,
  }));
}

export async function getTasksByEmployee(
  employeeId: string
): Promise<TaskWithEmployee[]> {
  const tasks = await prisma.task.findMany({
    where: {
      employeeId,
      OR: [
        { isTemplate: true },
        { isVisible: true },
      ],
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    employeeId: task.employeeId,
    employeeName: task.employee.fullName,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    requiresDocumentUpload: task.requiresDocumentUpload,
    employeeNote: task.employeeNote,
    managerNote: task.managerNote,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    scheduledDate: task.scheduledDate,
    isVisible: task.isVisible,
    recurrenceType: task.recurrenceType,
    recurrenceValue: task.recurrenceValue,
    recurrenceEndDate: task.recurrenceEndDate,
    isTemplate: task.isTemplate,
  }));
}

export async function getTaskById(id: string): Promise<TaskWithEmployee | null> {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!task) return null;

  return {
    id: task.id,
    employeeId: task.employeeId,
    employeeName: task.employee.fullName,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    requiresDocumentUpload: task.requiresDocumentUpload,
    employeeNote: task.employeeNote,
    managerNote: task.managerNote,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    scheduledDate: task.scheduledDate,
    isVisible: task.isVisible,
    recurrenceType: task.recurrenceType,
    recurrenceValue: task.recurrenceValue,
    recurrenceEndDate: task.recurrenceEndDate,
    isTemplate: task.isTemplate,
  };
}

export async function getActiveEmployees() {
  const employees = await prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: { fullName: "asc" },
  });

  return employees;
}

export async function getTasksStats() {
  const [total, open, completed, overdue, scheduled, recurring] = await Promise.all([
    prisma.task.count({ where: { isTemplate: false } }),
    prisma.task.count({ where: { status: "OPEN", isVisible: true, isTemplate: false } }),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.task.count({
      where: {
        status: "OPEN",
        isVisible: true,
        isTemplate: false,
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.count({
      where: {
        isVisible: false,
        scheduledDate: { not: null },
        isTemplate: false,
      },
    }),
    prisma.task.count({ where: { isTemplate: true } }),
  ]);

  return { total, open, completed, overdue, scheduled, recurring };
}
