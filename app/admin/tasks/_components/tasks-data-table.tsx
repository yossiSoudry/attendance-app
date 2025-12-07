// app/admin/tasks/_components/tasks-data-table.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  User,
  FileText,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Repeat,
  CalendarClock,
} from "lucide-react";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  taskStatusLabels,
  taskStatusColors,
  type TaskStatusType,
  recurrenceTypeLabels,
  type RecurrenceTypeValue,
} from "@/lib/validations/task";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { TaskWithEmployee } from "../_actions/task-actions";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskDetailsDialog } from "./task-details-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { QuickStatusDialog } from "./quick-status-dialog";

type Employee = {
  id: string;
  fullName: string;
};

type TasksDataTableProps = {
  data: TaskWithEmployee[];
  employees: Employee[];
};

function isOverdue(task: TaskWithEmployee): boolean {
  if (task.status !== "OPEN" || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

export function TasksDataTable({ data, employees }: TasksDataTableProps) {
  const [selectedTask, setSelectedTask] = React.useState<TaskWithEmployee | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<TaskWithEmployee>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="משימה" label="משימה" />
        ),
        cell: ({ row }) => {
          const task = row.original;
          const overdue = isOverdue(task);
          const isScheduled = task.scheduledDate && !task.isVisible;
          const isRecurring = task.isTemplate && task.recurrenceType !== "NONE";

          return (
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  {task.requiresDocumentUpload && (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  {overdue && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {isScheduled && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CalendarClock className="h-4 w-4 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            מתוזמנת ל-{new Date(task.scheduledDate!).toLocaleDateString("he-IL")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isRecurring && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Repeat className="h-4 w-4 text-purple-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            משימה חוזרת: {recurrenceTypeLabels[task.recurrenceType as RecurrenceTypeValue]}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          );
        },
        meta: {
          label: "משימה",
          placeholder: "חיפוש לפי כותרת...",
          variant: "text",
          icon: FileText,
        },
        enableColumnFilter: true,
      },
      {
        id: "employeeName",
        accessorKey: "employeeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="עובד" label="עובד" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{row.getValue("employeeName") as string}</span>
          </div>
        ),
        meta: {
          label: "עובד",
          variant: "select",
          options: employees.map((e) => ({ label: e.fullName, value: e.fullName })),
          icon: User,
        },
        enableColumnFilter: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="סטטוס" label="סטטוס" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as TaskStatusType;
          return (
            <Badge
              variant="outline"
              className={`${taskStatusColors[status]} text-xs`}
            >
              {taskStatusLabels[status]}
            </Badge>
          );
        },
        meta: {
          label: "סטטוס",
          variant: "select",
          options: Object.entries(taskStatusLabels).map(([value, label]) => ({
            label,
            value,
          })),
        },
        enableColumnFilter: true,
      },
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="תאריך יעד"
            label="תאריך יעד"
          />
        ),
        cell: ({ row }) => {
          const dueDate = row.getValue("dueDate") as Date | null;
          if (!dueDate) return <span className="text-muted-foreground">-</span>;

          const date = new Date(dueDate);
          const overdue = isOverdue(row.original);

          return (
            <div
              className={`flex items-center gap-1 text-xs ${
                overdue ? "text-red-500 font-medium" : "text-muted-foreground"
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              <span>{date.toLocaleDateString("he-IL")}</span>
            </div>
          );
        },
        meta: {
          label: "תאריך יעד",
          variant: "date",
          icon: CalendarIcon,
        },
        enableColumnFilter: false,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="נוצרה בתאריך"
            label="נוצרה בתאריך"
          />
        ),
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt") as Date;
          const date = new Date(createdAt);

          return (
            <div className="text-xs text-muted-foreground">
              {date.toLocaleDateString("he-IL")}
            </div>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">פעולות</span>,
        cell: ({ row }) => {
          const task = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTask(task);
                    setDetailsOpen(true);
                  }}
                >
                  <Eye className="ml-2 h-4 w-4" />
                  צפייה בפרטים
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTask(task);
                    setStatusOpen(true);
                  }}
                >
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                  עדכון סטטוס
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTask(task);
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="ml-2 h-4 w-4" />
                  עריכה
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTask(task);
                    setDeleteOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  מחיקה
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [employees]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <TaskFormDialog mode="create" employees={employees} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>

      {/* Dialogs */}
      {selectedTask && (
        <>
          <TaskDetailsDialog
            task={selectedTask}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <TaskFormDialog
            mode="edit"
            task={selectedTask}
            employees={employees}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteTaskDialog
            taskId={selectedTask.id}
            taskTitle={selectedTask.title}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
          <QuickStatusDialog
            task={selectedTask}
            open={statusOpen}
            onOpenChange={setStatusOpen}
          />
        </>
      )}
    </>
  );
}
