// app/employee/history/_components/shift-history-list.tsx
"use client";

import type { ShiftStatus } from "@/types/prisma";
import { Clock, CalendarIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


type ShiftRow = {
  id: string;
  startTime: string;
  endTime: string | null;
  status: ShiftStatus;
  isRetro: boolean;
};

type ShiftHistoryListProps = {
  shifts: ShiftRow[];
  timezone: string;
};

type GroupedShifts = {
  date: string;
  dateFormatted: string;
  shifts: ShiftRow[];
  totalMinutes: number;
};

function formatDate(iso: string, timezone: string): string {
  return new Date(iso).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
}

function formatDateKey(iso: string, timezone: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-CA", { timeZone: timezone });
}

function formatTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function getDurationMinutes(startIso: string, endIso: string | null): number {
  if (!endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

function formatDurationFromShift(
  startIso: string,
  endIso: string | null
): string {
  return formatDuration(getDurationMinutes(startIso, endIso));
}

const statusLabels: Record<ShiftStatus, string> = {
  OPEN: "פתוחה",
  CLOSED: "סגורה",
  PENDING_APPROVAL: "ממתינה",
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
  REJECTED:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

function groupShiftsByDay(shifts: ShiftRow[], timezone: string): GroupedShifts[] {
  const grouped = new Map<string, ShiftRow[]>();

  for (const shift of shifts) {
    const dateKey = formatDateKey(shift.startTime, timezone);
    const existing = grouped.get(dateKey) ?? [];
    existing.push(shift);
    grouped.set(dateKey, existing);
  }

  return Array.from(grouped.entries())
    .map(([date, dayShifts]) => ({
      date,
      dateFormatted: formatDate(dayShifts[0].startTime, timezone),
      shifts: dayShifts.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
      totalMinutes: dayShifts.reduce(
        (sum, shift) =>
          sum + getDurationMinutes(shift.startTime, shift.endTime),
        0
      ),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function ShiftHistoryList({ shifts, timezone }: ShiftHistoryListProps) {
  if (shifts.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">אין משמרות להצגה.</p>
      </section>
    );
  }

  const groupedShifts = groupShiftsByDay(shifts, timezone);

  return (
    <Accordion type="single" collapsible className="flex flex-col gap-3">
      {groupedShifts.map((day) => (
        <AccordionItem
          key={day.date}
          value={day.date}
          className="border-2 whitespace-nowrap dark:shadow-secondary/50 bg-card shadow-sm rounded-2xl"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30">
            <div className="flex w-full items-center justify-between pr-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {day.dateFormatted}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {day.shifts.length} משמרות
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">סה״כ:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatDuration(day.totalMinutes)}
                  </span>
                </div>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-0">
            <div className="divide-y divide-border border-t border-border">
              {day.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      dir="ltr"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="tabular-nums">
                        {formatTime(shift.startTime, timezone)} -{" "}
                        {shift.endTime ? formatTime(shift.endTime, timezone) : "..."}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      (
                      {formatDurationFromShift(shift.startTime, shift.endTime)}
                      )
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {shift.isRetro && (
                      <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-600 dark:text-orange-300">
                        רטרו
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${statusColors[shift.status]}`}
                    >
                      {statusLabels[shift.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}