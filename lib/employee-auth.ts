// lib/employee-auth.ts
// Employee authentication utilities for server actions

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuthenticatedEmployee = {
  id: string;
  organizationId: string;
  status: string;
  fullName: string;
};

export type AuthResult =
  | { authenticated: true; employee: AuthenticatedEmployee }
  | { authenticated: false; reason: "no_cookie" | "not_found" | "blocked" };

/**
 * Get the authenticated employee from the session cookie.
 * This should be called at the start of every employee server action
 * that requires authentication.
 */
export async function getAuthenticatedEmployee(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get("employeeId")?.value;

  if (!employeeId) {
    return { authenticated: false, reason: "no_cookie" };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      fullName: true,
    },
  });

  if (!employee) {
    // Clear invalid cookie
    cookieStore.set("employeeId", "", { maxAge: 0, path: "/" });
    return { authenticated: false, reason: "not_found" };
  }

  if (employee.status === "BLOCKED") {
    return { authenticated: false, reason: "blocked" };
  }

  return {
    authenticated: true,
    employee: {
      id: employee.id,
      organizationId: employee.organizationId,
      status: employee.status,
      fullName: employee.fullName,
    },
  };
}

/**
 * Verify that a task belongs to the authenticated employee.
 * Returns the task if authorized, null otherwise.
 */
export async function verifyTaskOwnership(
  taskId: string,
  employeeId: string,
  organizationId: string
) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      employeeId: employeeId,
      organizationId: organizationId,
    },
    select: {
      id: true,
      requiresDocumentUpload: true,
      attachedDocumentId: true,
    },
  });

  return task;
}
