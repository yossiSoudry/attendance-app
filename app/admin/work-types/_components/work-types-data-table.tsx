// app/admin/work-types/_components/work-types-data-table.tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Briefcase, CalendarIcon, Check, Text, Users, Coins } from "lucide-react";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";

import { DeleteWorkTypeDialog } from "./delete-work-type-dialog";
import { WorkTypeFormDialog } from "./work-type-form-dialog";
import type { WorkTypeRateType } from "@prisma/client";

export type WorkTypeTableRow = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  rateType: WorkTypeRateType;
  rateValue: number;
  employeesCount: number;
  shiftsCount: number;
  createdAt: string;
};

const rateTypeLabels: Record<WorkTypeRateType, string> = {
  BASE_RATE: "שכר בסיסי",
  FIXED: "קבוע",
  BONUS_PERCENT: "תוספת %",
  BONUS_FIXED: "תוספת ₪",
};

function formatRateDisplay(rateType: WorkTypeRateType, rateValue: number): string {
  switch (rateType) {
    case "BASE_RATE":
      return "שכר בסיסי";
    case "FIXED":
      return `${(rateValue / 100).toFixed(0)}₪/שעה`;
    case "BONUS_PERCENT":
      return `+${(rateValue / 100).toFixed(0)}%`;
    case "BONUS_FIXED":
      return `+${(rateValue / 100).toFixed(0)}₪/שעה`;
  }
}

type WorkTypesDataTableProps = {
  data: WorkTypeTableRow[];
};

export function WorkTypesDataTable({ data }: WorkTypesDataTableProps) {
  const columns = React.useMemo<ColumnDef<WorkTypeTableRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="שם" label="שם" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                <Check className="h-3 w-3" />
                ברירת מחדל
              </span>
            )}
          </div>
        ),
        meta: {
          label: "שם",
          placeholder: "חיפוש לפי שם...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="תיאור" label="תיאור" />
        ),
        cell: ({ row }) => {
          const description = row.getValue("description") as string | null;
          return (
            <span className="text-sm text-muted-foreground">
              {description || "—"}
            </span>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "rateType",
        accessorKey: "rateType",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="תעריף"
            label="תעריף"
          />
        ),
        cell: ({ row }) => {
          const rateType = row.original.rateType;
          const rateValue = row.original.rateValue;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Coins className="h-3 w-3 opacity-60" />
              <span>{formatRateDisplay(rateType, rateValue)}</span>
            </div>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "employeesCount",
        accessorKey: "employeesCount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="עובדים"
            label="מספר עובדים"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("employeesCount") as number;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-3 w-3 opacity-60" />
              <span>{count}</span>
            </div>
          );
        },
        enableColumnFilter: false,
      },
      {
        id: "shiftsCount",
        accessorKey: "shiftsCount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="משמרות"
            label="מספר משמרות"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("shiftsCount") as number;
          return (
            <span className="text-sm text-muted-foreground">{count}</span>
          );
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
          const workType = row.original;

          return (
            <div className="flex items-center justify-end gap-1">
              <WorkTypeFormDialog
                mode="edit"
                workType={{
                  id: workType.id,
                  name: workType.name,
                  description: workType.description,
                  isDefault: workType.isDefault,
                  rateType: workType.rateType,
                  rateValue: workType.rateValue,
                }}
              />
              <DeleteWorkTypeDialog
                workTypeId={workType.id}
                workTypeName={workType.name}
                shiftsCount={workType.shiftsCount}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
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
        <WorkTypeFormDialog mode="create" />
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}