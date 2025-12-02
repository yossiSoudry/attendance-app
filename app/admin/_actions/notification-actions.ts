// app/admin/_actions/notification-actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

// ========================================
// Types
// ========================================

export type NotificationCounts = {
  pendingLeaveRequests: number;
  pendingSickLeaveRequests: number;
  pendingRetroShifts: number;
  overdueTasks: number;
  total: number;
};

export type NotificationItem = {
  id: string;
  type: "leave" | "sick" | "shift" | "task";
  title: string;
  description: string;
  date: Date;
  link: string;
};

// ========================================
// Get Notification Counts
// ========================================

export async function getNotificationCounts(): Promise<NotificationCounts> {
  await requireAdminSession();

  const [
    pendingLeaveRequests,
    pendingSickLeaveRequests,
    pendingRetroShifts,
    overdueTasks,
  ] = await Promise.all([
    // Pending vacation requests
    prisma.leaveRequest.count({
      where: {
        status: "PENDING",
        leaveType: "VACATION",
      },
    }),
    // Pending sick leave requests
    prisma.leaveRequest.count({
      where: {
        status: "PENDING",
        leaveType: "SICK",
      },
    }),
    // Pending retro shifts (isRetro = true and status = PENDING_APPROVAL)
    prisma.shift.count({
      where: {
        isRetro: true,
        status: "PENDING_APPROVAL",
      },
    }),
    // Overdue tasks (dueDate passed and status is still OPEN)
    prisma.task.count({
      where: {
        status: "OPEN",
        dueDate: {
          lt: new Date(),
        },
        isTemplate: false,
      },
    }),
  ]);

  return {
    pendingLeaveRequests,
    pendingSickLeaveRequests,
    pendingRetroShifts,
    overdueTasks,
    total:
      pendingLeaveRequests +
      pendingSickLeaveRequests +
      pendingRetroShifts +
      overdueTasks,
  };
}

// ========================================
// Get Recent Notifications
// ========================================

export async function getRecentNotifications(): Promise<NotificationItem[]> {
  await requireAdminSession();

  const [leaveRequests, retroShifts, overdueTasks] = await Promise.all([
    // Recent pending leave requests
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: {
        employee: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent pending retro shifts
    prisma.shift.findMany({
      where: {
        isRetro: true,
        status: "PENDING_APPROVAL",
      },
      include: {
        employee: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent overdue tasks
    prisma.task.findMany({
      where: {
        status: "OPEN",
        dueDate: { lt: new Date() },
        isTemplate: false,
      },
      include: {
        employee: { select: { fullName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const notifications: NotificationItem[] = [];

  // Add leave requests
  for (const req of leaveRequests) {
    notifications.push({
      id: req.id,
      type: req.leaveType === "SICK" ? "sick" : "leave",
      title:
        req.leaveType === "SICK"
          ? `בקשת מחלה - ${req.employee.fullName}`
          : `בקשת חופשה - ${req.employee.fullName}`,
      description: `${req.totalDays} ימים`,
      date: req.createdAt,
      link: "/admin/leave",
    });
  }

  // Add retro shifts
  for (const shift of retroShifts) {
    notifications.push({
      id: shift.id,
      type: "shift",
      title: `משמרת רטרואקטיבית - ${shift.employee.fullName}`,
      description: new Date(shift.startTime).toLocaleDateString("he-IL"),
      date: shift.createdAt,
      link: "/admin/shifts",
    });
  }

  // Add overdue tasks
  for (const task of overdueTasks) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );
    notifications.push({
      id: task.id,
      type: "task",
      title: `משימה באיחור - ${task.employee.fullName}`,
      description: `${task.title} (${daysOverdue} ימים באיחור)`,
      date: task.dueDate!,
      link: "/admin/tasks",
    });
  }

  // Sort by date descending
  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return notifications.slice(0, 10);
}
