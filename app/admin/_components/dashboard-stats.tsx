// app/admin/_components/dashboard-stats.tsx
"use client";

import {
  Users,
  Clock,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  CalendarClock,
  Repeat,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DashboardStats } from "../_actions/dashboard-actions";

type DashboardStatsCardsProps = {
  stats: DashboardStats;
};

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const taskCompletionRate =
    stats.tasks.total > 0
      ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
      : 0;

  const hoursChange =
    stats.hours.lastMonth > 0
      ? Math.round(
          ((stats.hours.thisMonth - stats.hours.lastMonth) /
            stats.hours.lastMonth) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Employees Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עובדים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees.total}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              >
                <UserCheck className="h-3 w-3 ml-1" />
                {stats.employees.active} פעילים
              </Badge>
              {stats.employees.blocked > 0 && (
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-600 border-red-500/30"
                >
                  <UserX className="h-3 w-3 ml-1" />
                  {stats.employees.blocked} חסומים
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shifts Card */}
        <Link href="/admin/shifts" className="h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">משמרות</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shifts.thisMonth}</div>
              <p className="text-xs text-muted-foreground">החודש</p>
              <div className="flex items-center gap-2 mt-2">
                {stats.shifts.todayActive > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-600 border-blue-500/30"
                  >
                    <Timer className="h-3 w-3 ml-1" />
                    {stats.shifts.todayActive} פעילות עכשיו
                  </Badge>
                )}
                {stats.shifts.pendingApproval > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 border-amber-500/30"
                  >
                    <AlertCircle className="h-3 w-3 ml-1" />
                    {stats.shifts.pendingApproval} ממתינות
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tasks Card */}
        <Link href="/admin/tasks" className="h-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">משימות</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasks.open}</div>
              <p className="text-xs text-muted-foreground">משימות פתוחות</p>
              <div className="flex items-center gap-2 mt-2">
                {stats.tasks.overdue > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 text-red-600 border-red-500/30"
                  >
                    <AlertCircle className="h-3 w-3 ml-1" />
                    {stats.tasks.overdue} באיחור
                  </Badge>
                )}
                {stats.tasks.scheduled > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 border-amber-500/30"
                  >
                    <CalendarClock className="h-3 w-3 ml-1" />
                    {stats.tasks.scheduled} מתוזמנות
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Hours Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שעות עבודה</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hours.thisMonth}</div>
            <p className="text-xs text-muted-foreground">שעות החודש</p>
            <div className="flex items-center gap-1 mt-2 text-xs">
              {hoursChange !== 0 && (
                <span
                  className={
                    hoursChange > 0 ? "text-emerald-600" : "text-red-600"
                  }
                >
                  {hoursChange > 0 ? "+" : ""}
                  {hoursChange}%
                </span>
              )}
              <span className="text-muted-foreground">לעומת חודש קודם</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Task Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              אחוז השלמת משימות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={taskCompletionRate} className="flex-1" />
              <span className="text-lg font-bold">{taskCompletionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.tasks.completed} מתוך {stats.tasks.total} משימות הושלמו
            </p>
          </CardContent>
        </Card>

        {/* Weekly Hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              שעות השבוע
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hours.thisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.shifts.thisWeek} משמרות השבוע
            </p>
          </CardContent>
        </Card>

        {/* Recurring Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-500" />
              משימות חוזרות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tasks.recurring}</div>
            <p className="text-xs text-muted-foreground mt-1">
              תבניות משימות פעילות
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
