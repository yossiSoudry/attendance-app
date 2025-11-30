// app/admin/calendar/_components/calendar-data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Calendar,
  Moon,
  MoreHorizontal,
  Pencil,
  Sun,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarEventFormDialog } from "./calendar-event-form-dialog";
import { DeleteCalendarEventDialog } from "./delete-calendar-event-dialog";

// ========================================
// Types
// ========================================

export type CalendarEventTableRow = {
  id: string;
  gregorianDate: string;
  hebrewDate: string | null;
  eventType: "HOLIDAY" | "FAST" | "ROSH_CHODESH" | "MEMORIAL" | "CUSTOM";
  nameHe: string;
  nameEn: string | null;
  isRestDay: boolean;
  isShortDay: boolean;
};

type CalendarDataTableProps = {
  data: CalendarEventTableRow[];
};

// ========================================
// Helpers
// ========================================

const eventTypeLabels: Record<string, string> = {
  HOLIDAY: "חג",
  FAST: "צום",
  ROSH_CHODESH: "ראש חודש",
  MEMORIAL: "יום זיכרון",
  CUSTOM: "מותאם אישית",
};

const eventTypeColors: Record<string, string> = {
  HOLIDAY: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  FAST: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ROSH_CHODESH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MEMORIAL: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  CUSTOM: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("he-IL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ========================================
// Column Definitions
// ========================================

const columns: ColumnDef<CalendarEventTableRow>[] = [
  {
    accessorKey: "gregorianDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        תאריך
        <ArrowUpDown className="mr-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{formatDate(row.getValue("gregorianDate"))}</span>
      </div>
    ),
  },
  {
    accessorKey: "nameHe",
    header: "שם האירוע",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("nameHe")}</div>
    ),
  },
  {
    accessorKey: "eventType",
    header: "סוג",
    cell: ({ row }) => {
      const type = row.getValue("eventType") as string;
      return (
        <Badge className={eventTypeColors[type]} variant="secondary">
          {eventTypeLabels[type]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value === "all" || row.getValue(id) === value;
    },
  },
  {
    accessorKey: "isRestDay",
    header: "יום מנוחה",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.getValue("isRestDay") ? (
          <Moon className="h-4 w-4 text-violet-500" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "isShortDay",
    header: "יום קצר",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.getValue("isShortDay") ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const event = row.original;
      const [showEdit, setShowEdit] = React.useState(false);
      const [showDelete, setShowDelete] = React.useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">פתח תפריט</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Pencil className="ml-2 h-4 w-4" />
                עריכה
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                מחיקה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <CalendarEventFormDialog
            mode="edit"
            event={event}
            open={showEdit}
            onOpenChange={setShowEdit}
          />
          <DeleteCalendarEventDialog
            event={event}
            open={showDelete}
            onOpenChange={setShowDelete}
          />
        </>
      );
    },
  },
];

// ========================================
// Component
// ========================================

export function CalendarDataTable({ data }: CalendarDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "gregorianDate", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [eventTypeFilter, setEventTypeFilter] = React.useState<string>("all");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  React.useEffect(() => {
    if (eventTypeFilter === "all") {
      table.getColumn("eventType")?.setFilterValue(undefined);
    } else {
      table.getColumn("eventType")?.setFilterValue(eventTypeFilter);
    }
  }, [eventTypeFilter, table]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="חיפוש לפי שם..."
          value={(table.getColumn("nameHe")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("nameHe")?.setFilterValue(e.target.value)
          }
          className="max-w-xs"
        />
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="סוג אירוע" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסוגים</SelectItem>
            <SelectItem value="HOLIDAY">חג</SelectItem>
            <SelectItem value="FAST">צום</SelectItem>
            <SelectItem value="ROSH_CHODESH">ראש חודש</SelectItem>
            <SelectItem value="MEMORIAL">יום זיכרון</SelectItem>
            <SelectItem value="CUSTOM">מותאם אישית</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  לא נמצאו אירועים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} אירועים
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            הקודם
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            הבא
          </Button>
        </div>
      </div>
    </div>
  );
}
