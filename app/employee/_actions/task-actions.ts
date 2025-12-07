// app/employee/_actions/task-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";
import { getAuthenticatedEmployee, verifyTaskOwnership } from "@/lib/employee-auth";

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

export async function getEmployeeTasks(): Promise<EmployeeTask[]> {
  // Authenticate employee from session
  const authResult = await getAuthenticatedEmployee();

  if (!authResult.authenticated) {
    if (authResult.reason === "no_cookie" || authResult.reason === "not_found") {
      redirect("/employee/login");
    }
    return []; // Blocked employee
  }

  const { employee } = authResult;

  const tasks = await prisma.task.findMany({
    where: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
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
    // Authenticate employee from session
    const authResult = await getAuthenticatedEmployee();

    if (!authResult.authenticated) {
      if (authResult.reason === "no_cookie" || authResult.reason === "not_found") {
        redirect("/employee/login");
      }
      return { success: false, error: "החשבון שלך חסום" };
    }

    const { employee } = authResult;

    // Verify task ownership - CRITICAL SECURITY CHECK
    const task = await verifyTaskOwnership(taskId, employee.id, employee.organizationId);

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
    // Authenticate employee from session
    const authResult = await getAuthenticatedEmployee();

    if (!authResult.authenticated) {
      if (authResult.reason === "no_cookie" || authResult.reason === "not_found") {
        redirect("/employee/login");
      }
      return { success: false, error: "החשבון שלך חסום" };
    }

    const { employee } = authResult;

    // Verify task ownership - CRITICAL SECURITY CHECK
    const task = await verifyTaskOwnership(taskId, employee.id, employee.organizationId);

    if (!task) {
      return { success: false, error: "משימה לא נמצאה" };
    }

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

export async function getEmployeeOpenTasksCount(): Promise<number> {
  // Authenticate employee from session
  const authResult = await getAuthenticatedEmployee();

  if (!authResult.authenticated) {
    return 0;
  }

  const { employee } = authResult;

  return prisma.task.count({
    where: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      status: "OPEN",
      isVisible: true,
      isTemplate: false,
    },
  });
}

export async function attachDocumentToTask(
  taskId: string,
  fileUrl: string
) {
  try {
    // Authenticate employee from session - don't accept employeeId as parameter
    const authResult = await getAuthenticatedEmployee();

    if (!authResult.authenticated) {
      if (authResult.reason === "no_cookie" || authResult.reason === "not_found") {
        redirect("/employee/login");
      }
      return { success: false, error: "החשבון שלך חסום" };
    }

    const { employee } = authResult;

    // Verify task ownership - CRITICAL SECURITY CHECK
    const task = await verifyTaskOwnership(taskId, employee.id, employee.organizationId);

    if (!task) {
      return { success: false, error: "משימה לא נמצאה" };
    }

    // Create the document
    const document = await prisma.employeeDocument.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
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
    // Authenticate employee from session
    const authResult = await getAuthenticatedEmployee();

    if (!authResult.authenticated) {
      if (authResult.reason === "no_cookie" || authResult.reason === "not_found") {
        redirect("/employee/login");
      }
      return { success: false, error: "החשבון שלך חסום" };
    }

    const { employee } = authResult;

    // Verify task ownership - CRITICAL SECURITY CHECK
    const task = await verifyTaskOwnership(taskId, employee.id, employee.organizationId);

    if (!task) {
      return { success: false, error: "משימה לא נמצאה" };
    }

    if (task.attachedDocumentId) {
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
