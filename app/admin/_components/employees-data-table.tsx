// app/admin/_components/employees-data-table.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarIcon, DollarSign, Text } from "lucide-react";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";

import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { EmployeeBonusesDialog } from "./employee-bonuses-dialog";
import { EmployeeDocumentsDialog } from "./employee-documents-dialog";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { EmployeeRatesDialog } from "./employee-rates-dialog";
import type { WorkTypeRateType } from "@prisma/client";

export type EmployeeTableRow = {
  id: string;
  fullName: string;
  nationalId: string;
  status: "ACTIVE" | "BLOCKED";
  baseHourlyRate: number | null;
  createdAt: string;
};

type WorkTypeForAssignment = {
  id: string;
  name: string;
  isDefault: boolean;
  rateType: WorkTypeRateType;
  rateValue: number;
};

type EmployeesDataTableProps = {
  data: EmployeeTableRow[];
  workTypes: WorkTypeForAssignment[];
};

export function EmployeesDataTable({
  data,
  workTypes,
}: EmployeesDataTableProps) {
  const columns = React.useMemo<ColumnDef<EmployeeTableRow>[]>(
    () => [
      {
        id: "fullName",
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="שם מלא"
            label="שם מלא"
          />
        ),
        cell: ({ row }) => <div>{row.getValue("fullName") as string}</div>,
        meta: {
          label: "שם מלא",
          placeholder: "חיפוש לפי שם...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "nationalId",
        accessorKey: "nationalId",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="תעודת זהות"
            label="תעודת זהות"
          />
        ),
        cell: ({ row }) => (
          <div dir="ltr" className="tabular-nums text-right">
            {row.getValue("nationalId") as string}
          </div>
        ),
        meta: {
          label: "תעודת זהות",
          placeholder: "חיפוש לפי ת.ז...",
          variant: "text",
          icon: Text,
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
          const status = row.getValue("status") as EmployeeTableRow["status"];
          const isActive = status === "ACTIVE";

          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                isActive
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
              }`}
            >
              {isActive ? "פעיל" : "חסום"}
            </span>
          );
        },
        meta: {
          label: "סטטוס",
          variant: "select",
          options: [
            { label: "פעיל", value: "ACTIVE" },
            { label: "חסום", value: "BLOCKED" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: "baseHourlyRate",
        accessorKey: "baseHourlyRate",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="שכר לשעה (₪)"
            label="שכר לשעה"
          />
        ),
        cell: ({ row }) => {
          const value = row.getValue("baseHourlyRate") as number | null;
          if (!value) return <span>-</span>;

          return (
            <div className="flex items-center gap-1 tabular-nums">
              <span className="text-xs opacity-60">₪</span>
              <span>{(value / 100).toFixed(2)}</span>
            </div>
          );
        },
        meta: {
          label: "שכר לשעה",
          variant: "number",
          unit: "₪",
          icon: DollarSign,
        },
        enableColumnFilter: false,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="נוצר בתאריך"
            label="נוצר בתאריך"
          />
        ),
        cell: ({ row }) => {
          const iso = row.getValue("createdAt") as string;
          const date = new Date(iso);

          return (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3 opacity-60" />
              <span>{date.toLocaleDateString("he-IL")}</span>
            </div>
          );
        },
        meta: {
          label: "תאריך יצירה",
          variant: "date",
          icon: CalendarIcon,
        },
        enableColumnFilter: false,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">פעולות</span>,
        cell: ({ row }) => {
          const employee = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <EmployeeDocumentsDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
              <EmployeeRatesDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
                baseHourlyRate={employee.baseHourlyRate}
                workTypes={workTypes}
              />
              <EmployeeBonusesDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
              <EmployeeFormDialog mode="edit" employee={employee} />
              <DeleteEmployeeDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [workTypes]
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
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <EmployeeFormDialog mode="create" />
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
