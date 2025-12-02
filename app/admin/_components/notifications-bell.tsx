// app/admin/_components/notifications-bell.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Clock,
  ListTodo,
  Loader2,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import {
  getNotificationCounts,
  getRecentNotifications,
  type NotificationCounts,
  type NotificationItem,
} from "../_actions/notification-actions";

const notificationTypeConfig = {
  leave: {
    icon: CalendarDays,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  sick: {
    icon: Stethoscope,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  shift: {
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  task: {
    icon: ListTodo,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(date).toLocaleDateString("he-IL");
}

export function NotificationsBell() {
  const [counts, setCounts] = React.useState<NotificationCounts | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  // Load counts on mount
  React.useEffect(() => {
    async function loadCounts() {
      try {
        const data = await getNotificationCounts();
        setCounts(data);
      } catch (error) {
        console.error("Failed to load notification counts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCounts();

    // Refresh every 30 seconds
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      async function loadNotifications() {
        try {
          const data = await getRecentNotifications();
          setNotifications(data);
        } catch (error) {
          console.error("Failed to load notifications:", error);
        }
      }
      loadNotifications();
    }
  }, [isOpen]);

  const totalCount = counts?.total ?? 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoading && totalCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
          <span className="sr-only">התראות</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>התראות</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalCount} ממתינות
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>אין התראות חדשות</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const config = notificationTypeConfig[notification.type];
              const Icon = config.icon;

              return (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link
                    href={notification.link}
                    className="flex cursor-pointer items-start gap-3 p-3"
                  >
                    <div
                      className={`rounded-full p-2 ${config.bgColor} ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatRelativeTime(notification.date)}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}

        {counts && totalCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-2 gap-2 p-2 text-xs">
              {counts.pendingLeaveRequests > 0 && (
                <Link
                  href="/admin/leave"
                  className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-muted"
                >
                  <CalendarDays className="h-3 w-3 text-blue-500" />
                  <span>{counts.pendingLeaveRequests} חופשות</span>
                </Link>
              )}
              {counts.pendingSickLeaveRequests > 0 && (
                <Link
                  href="/admin/leave"
                  className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-muted"
                >
                  <Stethoscope className="h-3 w-3 text-orange-500" />
                  <span>{counts.pendingSickLeaveRequests} מחלות</span>
                </Link>
              )}
              {counts.pendingRetroShifts > 0 && (
                <Link
                  href="/admin/shifts"
                  className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-muted"
                >
                  <Clock className="h-3 w-3 text-purple-500" />
                  <span>{counts.pendingRetroShifts} משמרות</span>
                </Link>
              )}
              {counts.overdueTasks > 0 && (
                <Link
                  href="/admin/tasks"
                  className="flex items-center gap-1.5 rounded-md p-1.5 hover:bg-muted"
                >
                  <ListTodo className="h-3 w-3 text-red-500" />
                  <span>{counts.overdueTasks} משימות</span>
                </Link>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
