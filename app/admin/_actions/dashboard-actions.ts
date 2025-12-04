// app/admin/_actions/dashboard-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireOrganizationId } from "@/lib/auth";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";

// ========================================
// Types
// ========================================

export type DashboardStats = {
  employees: {
    total: number;
    active: number;
    blocked: number;
  };
  shifts: {
    todayActive: number;
    pendingApproval: number;
    thisWeek: number;
    thisMonth: number;
  };
  tasks: {
    total: number;
    open: number;
    completed: number;
    overdue: number;
    scheduled: number;
    recurring: number;
  };
  hours: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
};

export type RecentActivity = {
  id: string;
  type: "shift_start" | "shift_end" | "task_completed" | "employee_added";
  employeeName: string;
  description: string;
  timestamp: Date;
};

export type TopEmployee = {
  id: string;
  name: string;
  hoursThisMonth: number;
  tasksCompleted: number;
};

// ========================================
// Actions
// ========================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const organizationId = await requireOrganizationId();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Employee stats
  const [totalEmployees, activeEmployees, blockedEmployees] = await Promise.all(
    [
      prisma.employee.count({ where: { organizationId } }),
      prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.employee.count({ where: { organizationId, status: "BLOCKED" } }),
    ]
  );

  // Shift stats
  const [todayActiveShifts, pendingShifts, thisWeekShifts, thisMonthShifts] =
    await Promise.all([
      prisma.shift.count({
        where: {
          organizationId,
          status: "OPEN",
          startTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.shift.count({ where: { organizationId, status: "PENDING_APPROVAL" } }),
      prisma.shift.count({
        where: {
          organizationId,
          startTime: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.shift.count({
        where: {
          organizationId,
          startTime: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

  // Task stats
  const [
    totalTasks,
    openTasks,
    completedTasks,
    overdueTasks,
    scheduledTasks,
    recurringTasks,
  ] = await Promise.all([
    prisma.task.count({ where: { organizationId, isTemplate: false } }),
    prisma.task.count({
      where: { organizationId, status: "OPEN", isVisible: true, isTemplate: false },
    }),
    prisma.task.count({ where: { organizationId, status: "COMPLETED" } }),
    prisma.task.count({
      where: {
        organizationId,
        status: "OPEN",
        isVisible: true,
        isTemplate: false,
        dueDate: { lt: now },
      },
    }),
    prisma.task.count({
      where: {
        organizationId,
        isVisible: false,
        scheduledDate: { not: null },
        isTemplate: false,
      },
    }),
    prisma.task.count({ where: { organizationId, isTemplate: true } }),
  ]);

  // Hours calculation
  const [thisWeekShiftsData, thisMonthShiftsData, lastMonthShiftsData] =
    await Promise.all([
      prisma.shift.findMany({
        where: {
          organizationId,
          startTime: { gte: weekStart, lte: weekEnd },
          endTime: { not: null },
        },
        select: { startTime: true, endTime: true },
      }),
      prisma.shift.findMany({
        where: {
          organizationId,
          startTime: { gte: monthStart, lte: monthEnd },
          endTime: { not: null },
        },
        select: { startTime: true, endTime: true },
      }),
      prisma.shift.findMany({
        where: {
          organizationId,
          startTime: { gte: lastMonthStart, lte: lastMonthEnd },
          endTime: { not: null },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

  const calculateHours = (
    shifts: { startTime: Date; endTime: Date | null }[]
  ) => {
    return shifts.reduce((total, shift) => {
      if (!shift.endTime) return total;
      const hours =
        (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      blocked: blockedEmployees,
    },
    shifts: {
      todayActive: todayActiveShifts,
      pendingApproval: pendingShifts,
      thisWeek: thisWeekShifts,
      thisMonth: thisMonthShifts,
    },
    tasks: {
      total: totalTasks,
      open: openTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      scheduled: scheduledTasks,
      recurring: recurringTasks,
    },
    hours: {
      thisWeek: Math.round(calculateHours(thisWeekShiftsData) * 10) / 10,
      thisMonth: Math.round(calculateHours(thisMonthShiftsData) * 10) / 10,
      lastMonth: Math.round(calculateHours(lastMonthShiftsData) * 10) / 10,
    },
  };
}

export async function getRecentActivity(
  limit: number = 10
): Promise<RecentActivity[]> {
  const organizationId = await requireOrganizationId();
  const activities: RecentActivity[] = [];

  // Get recent shifts (started/ended)
  const recentShifts = await prisma.shift.findMany({
    where: {
      organizationId,
      OR: [{ status: "OPEN" }, { status: "CLOSED" }],
    },
    include: {
      employee: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  for (const shift of recentShifts) {
    if (shift.status === "OPEN") {
      activities.push({
        id: `shift-start-${shift.id}`,
        type: "shift_start",
        employeeName: shift.employee.fullName,
        description: "התחיל משמרת",
        timestamp: shift.startTime,
      });
    } else if (shift.endTime) {
      activities.push({
        id: `shift-end-${shift.id}`,
        type: "shift_end",
        employeeName: shift.employee.fullName,
        description: "סיים משמרת",
        timestamp: shift.endTime,
      });
    }
  }

  // Get recent completed tasks
  const recentCompletedTasks = await prisma.task.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      completedAt: { not: null },
    },
    include: {
      employee: { select: { fullName: true } },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
  });

  for (const task of recentCompletedTasks) {
    if (task.completedAt) {
      activities.push({
        id: `task-${task.id}`,
        type: "task_completed",
        employeeName: task.employee.fullName,
        description: `השלים משימה: ${task.title}`,
        timestamp: task.completedAt,
      });
    }
  }

  // Get recently added employees
  const recentEmployees = await prisma.employee.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, fullName: true, createdAt: true },
  });

  for (const emp of recentEmployees) {
    activities.push({
      id: `employee-${emp.id}`,
      type: "employee_added",
      employeeName: emp.fullName,
      description: "נוסף למערכת",
      timestamp: emp.createdAt,
    });
  }

  // Sort by timestamp and return top N
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export async function getTopEmployees(limit: number = 5): Promise<TopEmployee[]> {
  const organizationId = await requireOrganizationId();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Get all active employees with their shifts and completed tasks this month
  const employees = await prisma.employee.findMany({
    where: {
      organizationId,
      status: "ACTIVE"
    },
    include: {
      shifts: {
        where: {
          startTime: { gte: monthStart, lte: monthEnd },
          endTime: { not: null },
        },
        select: { startTime: true, endTime: true },
      },
      tasks: {
        where: {
          status: "COMPLETED",
          completedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true },
      },
    },
  });

  const employeeStats = employees.map((emp) => {
    const hoursThisMonth = emp.shifts.reduce((total, shift) => {
      if (!shift.endTime) return total;
      const hours =
        (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return {
      id: emp.id,
      name: emp.fullName,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      tasksCompleted: emp.tasks.length,
    };
  });

  // Sort by hours worked
  return employeeStats
    .sort((a, b) => b.hoursThisMonth - a.hoursThisMonth)
    .slice(0, limit);
}

export type OrganizationInfo = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export async function getOrganizationInfo(): Promise<OrganizationInfo | null> {
  const organizationId = await requireOrganizationId();

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  });

  return organization;
}
