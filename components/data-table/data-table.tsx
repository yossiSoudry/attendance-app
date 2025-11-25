"use client";

import {
  flexRender,
  type Table as TanstackTable,
  type ColumnSort,
} from "@tanstack/react-table";
import type * as React from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * ✅ טיפוסים ש-DiceUI וה-Hooks שלה מצפים לקבל
 * כאן אנחנו פשוט עוטפים את ColumnSort המקורי של TanStack
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ExtendedColumnSort<TData> = ColumnSort;

export type QueryKeys = {
  page: string;
  perPage: string;
  sort?: string;
  filters?: string;
  joinOperator?: string; // 👈 מוסיפים את זה
};

/**
 * ✅ טיפוס Option שמשמש את DataTableFacetedFilter / Column Meta
 *   options: [{ label, value, count?, icon? }]
 */
export type Option = {
  label: string;
  value: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
};

// DiceUI קורא לזה עם { column }, אצלנו אין צורך בלוגיקה – מחזירים אובייקט ריק.
export function getCommonPinningStyles(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: { column: unknown } = { column: null },
) {
  return {};
}

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {children}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getCommonPinningStyles({ column: cell.column }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  אין נתונים להצגה.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
