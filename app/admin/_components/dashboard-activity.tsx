// app/admin/_components/dashboard-activity.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import {
  Clock,
  CheckCircle2,
  UserPlus,
  LogIn,
  LogOut,
  Trophy,
  Award,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { RecentActivity, TopEmployee } from "../_actions/dashboard-actions";

type RecentActivityListProps = {
  activities: RecentActivity[];
};

export function RecentActivityList({ activities }: RecentActivityListProps) {
  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "shift_start":
        return <LogIn className="h-4 w-4 text-emerald-500" />;
      case "shift_end":
        return <LogOut className="h-4 w-4 text-blue-500" />;
      case "task_completed":
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      case "employee_added":
        return <UserPlus className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: RecentActivity["type"]) => {
    switch (type) {
      case "shift_start":
        return "bg-emerald-500/10";
      case "shift_end":
        return "bg-blue-500/10";
      case "task_completed":
        return "bg-purple-500/10";
      case "employee_added":
        return "bg-amber-500/10";
      default:
        return "bg-muted";
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            אין פעילות אחרונה להצגה
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">פעילות אחרונה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${getActivityColor(activity.type)}`}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activity.employeeName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.timestamp), {
                addSuffix: true,
                locale: he,
              })}
            </time>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type TopEmployeesListProps = {
  employees: TopEmployee[];
};

export function TopEmployeesList({ employees }: TopEmployeesListProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            עובדים מובילים החודש
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            אין נתונים להצגה
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          עובדים מובילים החודש
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {employees.map((employee, index) => (
          <div key={employee.id} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              {index < 3 && (
                <div className="absolute -top-1 -right-1">
                  {getRankIcon(index)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{employee.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{employee.hoursThisMonth} שעות</span>
                {employee.tasksCompleted > 0 && (
                  <>
                    <span>•</span>
                    <span>{employee.tasksCompleted} משימות</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
