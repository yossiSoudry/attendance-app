// app/admin/shifts/_components/shifts-data-table.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, Clock, User } from "lucide-react";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { ShiftStatus } from "@prisma/client";
import { DeleteShiftDialog } from "./delete-shift-dialog";
import { ExportShiftsButton } from "./export-shifts-button";
import { ShiftFormDialog } from "./shift-form-dialog";

export type ShiftTableRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  workTypeId: string | null;
  workTypeName: string | null;
  startTime: string;
  endTime: string | null;
  status: ShiftStatus;
  source: string;
  isRetro: boolean;
  notesManager: string | null;
};

type ShiftsDataTableProps = {
  data: ShiftTableRow[];
  employees: { label: string; value: string }[];
  workTypes?: { label: string; value: string }[];
};

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";

  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL");
}

const statusLabels: Record<ShiftStatus, string> = {
  OPEN: "פתוחה",
  CLOSED: "סגורה",
  PENDING_APPROVAL: "ממתינה לאישור",
  CORRECTED: "תוקנה",
  REJECTED: "נדחתה",
};

const statusColors: Record<ShiftStatus, string> = {
  OPEN: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  CLOSED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  PENDING_APPROVAL:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  CORRECTED:
    "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

export function ShiftsDataTable({
  data,
  employees,
  workTypes = [],
}: ShiftsDataTableProps) {
  const columns = React.useMemo<ColumnDef<ShiftTableRow>[]>(
    () => [
      {
        id: "employeeName",
        accessorKey: "employeeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="עובד" label="עובד" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("employeeName")}</div>
        ),
        meta: {
          label: "עובד",
          variant: "select",
          options: employees,
          icon: User,
        },
        filterFn: (row, id, filterValue) => {
          return row.original.employeeId === filterValue;
        },
        enableColumnFilter: true,
      },
      {
        id: "date",
        accessorFn: (row) => row.startTime,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="תאריך" label="תאריך" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm">
            <CalendarIcon className="h-3 w-3 opacity-60" />
            {formatDate(row.original.startTime)}
          </div>
        ),
        meta: {
          label: "תאריך",
          variant: "date",
          icon: CalendarIcon,
        },
        enableColumnFilter: false,
      },
      {
        id: "timeRange",
        header: () => <span>שעות</span>,
        cell: ({ row }) => {
          const { startTime, endTime } = row.original;
          return (
            <div
              className="flex items-center gap-1 tabular-nums text-sm"
              dir="ltr"
            >
              <Clock className="h-3 w-3 opacity-60" />
              <span>
                {formatTime(startTime)} -{" "}
                {endTime ? formatTime(endTime) : "..."}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "duration",
        header: () => <span>משך</span>,
        cell: ({ row }) => {
          const { startTime, endTime } = row.original;
          return (
            <div className="tabular-nums text-sm text-muted-foreground">
              {formatDuration(startTime, endTime)}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="סטטוס" label="סטטוס" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as ShiftStatus;
          return (
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusColors[status]}`}
            >
              {statusLabels[status]}
            </span>
          );
        },
        meta: {
          label: "סטטוס",
          variant: "select",
          options: [
            { label: "פתוחה", value: "OPEN" },
            { label: "סגורה", value: "CLOSED" },
            { label: "ממתינה לאישור", value: "PENDING_APPROVAL" },
            { label: "תוקנה", value: "CORRECTED" },
            { label: "נדחתה", value: "REJECTED" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "source",
        accessorKey: "source",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="מקור" label="מקור" />
        ),
        cell: ({ row }) => {
          const source = row.getValue("source") as string;
          const labels: Record<string, string> = {
            web: "אתר",
            mobile: "אפליקציה",
            import: "ייבוא",
          };
          return (
            <span className="text-xs text-muted-foreground">
              {labels[source] ?? source}
            </span>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "isRetro",
        accessorKey: "isRetro",
        header: () => <span>רטרו</span>,
        cell: ({ row }) => {
          const isRetro = row.getValue("isRetro") as boolean;
          if (!isRetro) return null;
          return (
            <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-600 dark:text-orange-300">
              רטרואקטיבי
            </span>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">פעולות</span>,
        cell: ({ row }) => {
          const shift = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <ShiftFormDialog
                mode="edit"
                shift={{
                  id: shift.id,
                  employeeId: shift.employeeId,
                  workTypeId: null, // נצטרך להוסיף זאת ל-ShiftTableRow
                  startTime: shift.startTime,
                  endTime: shift.endTime,
                  notesManager: null,
                }}
                employees={employees}
                workTypes={workTypes}
              />
              <DeleteShiftDialog
                shiftId={shift.id}
                employeeName={shift.employeeName}
                shiftDate={formatDate(shift.startTime)}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [employees, workTypes]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "date", desc: true }],
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
    getRowId: (row) => row.id,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <ShiftFormDialog
          mode="create"
          employees={employees}
          workTypes={workTypes}
        />
        <ExportShiftsButton />
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
