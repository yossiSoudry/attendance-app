"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";

import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableSliderFilter } from "@/components/data-table/data-table-slider-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  // Get columns that have select/multiSelect filters (not text filters)
  const selectColumns = React.useMemo(
    () => table.getAllColumns().filter((column) => {
      const meta = column.columnDef.meta;
      return column.getCanFilter() && meta?.variant &&
        ["select", "multiSelect", "date", "dateRange", "range"].includes(meta.variant);
    }),
    [table],
  );

  // Handle global search across all text-searchable columns
  React.useEffect(() => {
    table.setGlobalFilter(globalFilter);
  }, [globalFilter, table]);

  const onReset = React.useCallback(() => {
    table.resetColumnFilters();
    setGlobalFilter("");
    table.setGlobalFilter("");
  }, [table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Global search input */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-8 w-40 pr-8 lg:w-64"
          />
        </div>
        {/* Only show select/date/range filters, not text filters */}
        {selectColumns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label="איפוס סינונים"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <X />
            איפוס
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  {
    const columnMeta = column.columnDef.meta;

    const onFilterRender = React.useCallback(() => {
      if (!columnMeta?.variant) return null;

      switch (columnMeta.variant) {
        // Text filters are now handled by global search
        case "text":
          return null;

        case "number":
          return (
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder={columnMeta.placeholder ?? columnMeta.label}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
              />
              {columnMeta.unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {columnMeta.unit}
                </span>
              )}
            </div>
          );

        case "range":
          return (
            <DataTableSliderFilter
              column={column}
              title={columnMeta.label ?? column.id}
            />
          );

        case "date":
        case "dateRange":
          return (
            <DataTableDateFilter
              column={column}
              title={columnMeta.label ?? column.id}
              multiple={columnMeta.variant === "dateRange"}
            />
          );

        case "select":
        case "multiSelect":
          return (
            <DataTableFacetedFilter
              column={column}
              title={columnMeta.label ?? column.id}
              options={columnMeta.options ?? []}
              multiple={columnMeta.variant === "multiSelect"}
            />
          );

        default:
          return null;
      }
    }, [column, columnMeta]);

    return onFilterRender();
  }
}
