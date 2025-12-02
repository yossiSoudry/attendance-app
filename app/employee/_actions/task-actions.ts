// app/employee/_actions/task-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

// ========================================
// Types
// ========================================

export type EmployeeTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  requiresDocumentUpload: boolean;
  attachedDocumentId: string | null;
  attachedDocumentUrl: string | null;
  employeeNote: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

// ========================================
// Actions
// ========================================

export async function getEmployeeTasks(employeeId: string): Promise<EmployeeTask[]> {
  const tasks = await prisma.task.findMany({
    where: {
      employeeId,
      isVisible: true,      // Only show visible tasks
      isTemplate: false,    // Don't show recurring templates
    },
    include: {
      attachedDocument: {
        select: {
          id: true,
          fileUrl: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    requiresDocumentUpload: task.requiresDocumentUpload,
    attachedDocumentId: task.attachedDocumentId,
    attachedDocumentUrl: task.attachedDocument?.fileUrl ?? null,
    employeeNote: task.employeeNote,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  }));
}

export async function completeTask(
  taskId: string,
  employeeNote?: string
) {
  try {
    // First check if task requires document
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        requiresDocumentUpload: true,
        attachedDocumentId: true,
      },
    });

    if (!task) {
      return { success: false, error: "משימה לא נמצאה" };
    }

    // If document is required but not attached, reject completion
    if (task.requiresDocumentUpload && !task.attachedDocumentId) {
      return { success: false, error: "יש להעלות מסמך לפני השלמת המשימה" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        employeeNote: employeeNote || null,
      },
    });

    revalidatePath("/employee/tasks");
    revalidatePath("/admin/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to complete task:", error);
    return { success: false, error: "אירעה שגיאה בהשלמת המשימה" };
  }
}

export async function updateEmployeeNote(
  taskId: string,
  employeeNote: string
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { employeeNote },
    });

    revalidatePath("/employee/tasks");
    revalidatePath("/admin/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to update note:", error);
    return { success: false, error: "אירעה שגיאה בעדכון ההערה" };
  }
}

export async function getEmployeeOpenTasksCount(employeeId: string): Promise<number> {
  return prisma.task.count({
    where: {
      employeeId,
      status: "OPEN",
      isVisible: true,
      isTemplate: false,
    },
  });
}

export async function attachDocumentToTask(
  taskId: string,
  employeeId: string,
  fileUrl: string
) {
  try {
    // Create the document
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        docType: "TASK_ATTACHMENT",
        fileUrl,
        visibility: "EMPLOYER_ONLY",
        uploadedBy: "EMPLOYEE",
      },
    });

    // Attach to task
    await prisma.task.update({
      where: { id: taskId },
      data: { attachedDocumentId: document.id },
    });

    revalidatePath("/employee/tasks");
    revalidatePath("/admin/tasks");
    return { success: true, documentId: document.id };
  } catch (error) {
    console.error("Failed to attach document:", error);
    return { success: false, error: "אירעה שגיאה בצירוף המסמך" };
  }
}

export async function removeDocumentFromTask(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { attachedDocumentId: true },
    });

    if (task?.attachedDocumentId) {
      // Remove from task first
      await prisma.task.update({
        where: { id: taskId },
        data: { attachedDocumentId: null },
      });

      // Delete the document
      await prisma.employeeDocument.delete({
        where: { id: task.attachedDocumentId },
      });
    }

    revalidatePath("/employee/tasks");
    revalidatePath("/admin/tasks");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove document:", error);
    return { success: false, error: "אירעה שגיאה בהסרת המסמך" };
  }
}
