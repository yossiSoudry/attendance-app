// lib/contractor-auth.ts
// HR Contractor authentication utilities for server actions

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuthenticatedContractor = {
  id: string;
  organizationId: string;
  status: string;
  fullName: string;
  baseHourlyRate: number; // in agorot
};

export type ContractorAuthResult =
  | { authenticated: true; contractor: AuthenticatedContractor }
  | {
      authenticated: false;
      reason: "no_cookie" | "not_found" | "blocked" | "not_contractor";
    };

/**
 * Get the authenticated HR contractor from the session cookie.
 * This should be called at the start of every contractor server action
 * that requires authentication.
 */
export async function getAuthenticatedContractor(): Promise<ContractorAuthResult> {
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
      employmentType: true,
      baseHourlyRate: true,
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

  // Verify this is an HR contractor
  if (employee.employmentType !== "HR_CONTRACTOR") {
    return { authenticated: false, reason: "not_contractor" };
  }

  return {
    authenticated: true,
    contractor: {
      id: employee.id,
      organizationId: employee.organizationId,
      status: employee.status,
      fullName: employee.fullName,
      baseHourlyRate: employee.baseHourlyRate,
    },
  };
}
