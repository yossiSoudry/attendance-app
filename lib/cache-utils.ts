// lib/cache-utils.ts
// Centralized cache invalidation utilities

import { revalidatePath } from "next/cache";

/**
 * Invalidate cache for employee-related pages
 */
export function invalidateEmployeeCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/dashboard");
}

/**
 * Invalidate cache for shift-related pages
 */
export function invalidateShiftCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/shifts");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee");
  revalidatePath("/employee/history");
}

/**
 * Invalidate cache for task-related pages
 */
export function invalidateTaskCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee");
  revalidatePath("/employee/tasks");
}

/**
 * Invalidate cache for leave-related pages
 */
export function invalidateLeaveCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/leave");
  revalidatePath("/admin/dashboard");
  revalidatePath("/employee");
  revalidatePath("/employee/leave");
}

/**
 * Invalidate cache for payroll-related pages
 */
export function invalidatePayrollCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/payroll");
  revalidatePath("/employee/payroll");
}

/**
 * Invalidate cache for work type-related pages
 */
export function invalidateWorkTypeCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/work-types");
}

/**
 * Invalidate cache for bonus-related pages
 */
export function invalidateBonusCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
}

/**
 * Invalidate cache for admin/team-related pages
 */
export function invalidateTeamCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/team");
}

/**
 * Invalidate all admin caches
 */
export function invalidateAllAdminCache(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/shifts");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/leave");
  revalidatePath("/admin/payroll");
}
