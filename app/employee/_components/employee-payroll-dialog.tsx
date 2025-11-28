// app/employee/_components/employee-payroll-dialog.tsx
"use client";

import {
  Calculator,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  getEmployeeMonthlyPayroll,
  getEmployeeAvailableMonths,
  type EmployeePayrollSummary,
  type EmployeeShiftPayroll,
} from "../_actions/payroll-actions";

// ========================================
// Types
// ========================================

type EmployeePayrollDialogProps = {
  employeeId: string;
  trigger?: React.ReactNode;
};

// ========================================
// Shift Row Component
// ========================================

function ShiftRow({ shift }: { shift: EmployeeShiftPayroll }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hasOvertime =
    shift.overtime125Time !== "0:00" ||
    shift.overtime150Time !== "0:00" ||
    shift.shabbatTime !== "0:00";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-3 text-right hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>יום {shift.dayOfWeek}</span>
                  <span className="text-muted-foreground">{shift.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span dir="ltr">
                    {shift.startTime} - {shift.endTime}
                  </span>
                  <span>({shift.duration})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasOvertime && (
                <Badge variant="secondary" className="text-xs">
                  שעות נוספות
                </Badge>
              )}
              <span className="font-semibold text-emerald-600">
                {shift.totalPay}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-3 pb-3 pt-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {/* Work Type */}
              {shift.workTypeName && (
                <div className="col-span-2 flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">סוג עבודה:</span>
                  <span>{shift.workTypeName}</span>
                </div>
              )}

              {/* Shift Type */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">סוג משמרת:</span>
                <span>{shift.shiftType}</span>
              </div>

              {/* Hourly Rate */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">שכר לשעה:</span>
                <span>{shift.hourlyRate}</span>
              </div>

              {/* Regular */}
              {shift.regularTime !== "0:00" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">שעות רגילות:</span>
                    <span>{shift.regularTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">שכר רגיל:</span>
                    <span>{shift.regularPay}</span>
                  </div>
                </>
              )}

              {/* Overtime 125% */}
              {shift.overtime125Time !== "0:00" && (
                <>
                  <div className="flex justify-between text-amber-600">
                    <span>שעות 125%:</span>
                    <span>{shift.overtime125Time}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>שכר 125%:</span>
                    <span>{shift.overtime125Pay}</span>
                  </div>
                </>
              )}

              {/* Overtime 150% */}
              {shift.overtime150Time !== "0:00" && (
                <>
                  <div className="flex justify-between text-orange-600">
                    <span>שעות 150%:</span>
                    <span>{shift.overtime150Time}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>שכר 150%:</span>
                    <span>{shift.overtime150Pay}</span>
                  </div>
                </>
              )}

              {/* Shabbat */}
              {shift.shabbatTime !== "0:00" && (
                <>
                  <div className="flex justify-between text-purple-600">
                    <span>שעות שבת/חג:</span>
                    <span>{shift.shabbatTime}</span>
                  </div>
                  <div className="flex justify-between text-purple-600">
                    <span>שכר שבת/חג:</span>
                    <span>{shift.shabbatPay}</span>
                  </div>
                </>
              )}

              {/* Bonus */}
              {shift.bonusPay !== "₪0.00" && (
                <div className="col-span-2 flex justify-between border-t pt-2 text-emerald-600">
                  <span>בונוסים:</span>
                  <span>{shift.bonusPay}</span>
                </div>
              )}

              {/* Total */}
              <div className="col-span-2 flex justify-between border-t pt-2 font-semibold">
                <span>סה״כ למשמרת:</span>
                <span className="text-emerald-600">{shift.totalPay}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ========================================
// Summary Card Component
// ========================================

function SummaryCard({
  summary,
}: {
  summary: EmployeePayrollSummary["summary"];
}) {
  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
      <h3 className="mb-3 font-semibold text-emerald-700 dark:text-emerald-400">
        סיכום חודשי
      </h3>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">משמרות:</span>
          <span>{summary.totalShifts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">סה״כ שעות:</span>
          <span>{summary.totalDuration}</span>
        </div>

        {summary.regularTime !== "0:00" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">שעות רגילות:</span>
            <span>{summary.regularTime}</span>
          </div>
        )}

        {summary.overtime125Time !== "0:00" && (
          <div className="flex justify-between text-amber-600">
            <span>שעות 125%:</span>
            <span>{summary.overtime125Time}</span>
          </div>
        )}

        {summary.overtime150Time !== "0:00" && (
          <div className="flex justify-between text-orange-600">
            <span>שעות 150%:</span>
            <span>{summary.overtime150Time}</span>
          </div>
        )}

        {summary.shabbatTime !== "0:00" && (
          <div className="flex justify-between text-purple-600">
            <span>שעות שבת/חג:</span>
            <span>{summary.shabbatTime}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {summary.regularPay !== "₪0.00" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">שכר רגיל:</span>
              <span>{summary.regularPay}</span>
            </div>
          )}

          {summary.overtime125Pay !== "₪0.00" && (
            <div className="flex justify-between text-amber-600">
              <span>שכר 125%:</span>
              <span>{summary.overtime125Pay}</span>
            </div>
          )}

          {summary.overtime150Pay !== "₪0.00" && (
            <div className="flex justify-between text-orange-600">
              <span>שכר 150%:</span>
              <span>{summary.overtime150Pay}</span>
            </div>
          )}

          {summary.shabbatPay !== "₪0.00" && (
            <div className="flex justify-between text-purple-600">
              <span>שכר שבת/חג:</span>
              <span>{summary.shabbatPay}</span>
            </div>
          )}

          {summary.bonusPay !== "₪0.00" && (
            <div className="flex justify-between text-emerald-600">
              <span>בונוסים:</span>
              <span>{summary.bonusPay}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
          <span>סה״כ לתשלום:</span>
          <span className="text-emerald-600">{summary.totalPay}</span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Main Component
// ========================================

export function EmployeePayrollDialog({
  employeeId,
  trigger,
}: EmployeePayrollDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [availableMonths, setAvailableMonths] = React.useState<
    { label: string; year: number; month: number }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = React.useState<{
    year: number;
    month: number;
  } | null>(null);
  const [payrollData, setPayrollData] =
    React.useState<EmployeePayrollSummary | null>(null);

  // Define callbacks before useEffects
  const loadAvailableMonths = React.useCallback(async () => {
    setIsLoading(true);
    const months = await getEmployeeAvailableMonths(employeeId);
    setAvailableMonths(months);

    // Select current or most recent month
    if (months.length > 0) {
      const now = new Date();
      const currentMonth = months.find(
        (m) => m.year === now.getFullYear() && m.month === now.getMonth() + 1
      );
      setSelectedMonth(currentMonth ?? months[0]);
    }

    setIsLoading(false);
  }, [employeeId]);

  const loadPayroll = React.useCallback(
    async (year: number, month: number) => {
      setIsLoading(true);
      const data = await getEmployeeMonthlyPayroll(employeeId, year, month);
      setPayrollData(data);
      setIsLoading(false);
    },
    [employeeId]
  );

  // Load available months on open
  React.useEffect(() => {
    if (open) {
      loadAvailableMonths();
    }
  }, [open, loadAvailableMonths]);

  // Load payroll when month changes
  React.useEffect(() => {
    if (selectedMonth) {
      loadPayroll(selectedMonth.year, selectedMonth.month);
    }
  }, [selectedMonth, loadPayroll]);

  function navigateMonth(direction: "prev" | "next") {
    if (!selectedMonth || availableMonths.length === 0) return;

    const currentIndex = availableMonths.findIndex(
      (m) => m.year === selectedMonth.year && m.month === selectedMonth.month
    );

    const newIndex = direction === "prev" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < availableMonths.length) {
      setSelectedMonth(availableMonths[newIndex]);
    }
  }

  const currentIndex = selectedMonth
    ? availableMonths.findIndex(
        (m) => m.year === selectedMonth.year && m.month === selectedMonth.month
      )
    : -1;

  const canGoPrev = currentIndex < availableMonths.length - 1;
  const canGoNext = currentIndex > 0;

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Calculator className="h-4 w-4" />
      חישוב שכר
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="flex h-[85vh] max-h-[700px] flex-col sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            חישוב שכר חודשי
          </DialogTitle>
          <DialogDescription>
            פירוט שכר לפי חוק שעות עבודה ומנוחה
          </DialogDescription>
        </DialogHeader>

        {/* Month Selector */}
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("prev")}
            disabled={!canGoPrev || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Select
            value={
              selectedMonth
                ? `${selectedMonth.year}-${selectedMonth.month}`
                : ""
            }
            onValueChange={(value) => {
              const [year, month] = value.split("-").map(Number);
              setSelectedMonth({ year, month });
            }}
            disabled={isLoading || availableMonths.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="ml-2 h-4 w-4" />
              <SelectValue placeholder="בחר חודש" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem
                  key={`${m.year}-${m.month}`}
                  value={`${m.year}-${m.month}`}
                >
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("next")}
            disabled={!canGoNext || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !payrollData || payrollData.shifts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">אין משמרות בחודש זה</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <SummaryCard summary={payrollData.summary} />

            {/* Shifts List */}
            <div className="mt-3 flex-1 overflow-hidden">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                פירוט משמרות ({payrollData.shifts.length})
              </h4>
              <ScrollArea className="h-full max-h-[280px]">
                <div className="space-y-2 pl-1 pr-3">
                  {payrollData.shifts.map((shift) => (
                    <ShiftRow key={shift.id} shift={shift} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {/* Legal Note */}
        <div className="border-t pt-3 text-[11px] text-muted-foreground">
          * החישוב לפי חוק שעות עבודה ומנוחה. ייתכנו הפרשים קטנים בעיגול.
        </div>
      </DialogContent>
    </Dialog>
  );
}