// app/admin/tasks/page.tsx
import { ClipboardList, AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";
import {
  getAllTasks,
  getActiveEmployees,
  getTasksStats,
} from "./_actions/task-actions";
import { TasksDataTable } from "./_components/tasks-data-table";
import { TaskFormDialog } from "./_components/task-form-dialog";

export default async function TasksPage() {
  const [tasks, employees, stats] = await Promise.all([
    getAllTasks(),
    getActiveEmployees(),
    getTasksStats(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ניהול משימות</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              הקצאת משימות לעובדים ומעקב אחר ביצוען
            </p>
          </div>
          <TaskFormDialog mode="create" employees={employees} />
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ משימות</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות פתוחות</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">באיחור</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <section className="rounded-3xl border border-border bg-card p-4">
        <TasksDataTable data={tasks} employees={employees} hideCreateButton />
      </section>
    </div>
  );
}
