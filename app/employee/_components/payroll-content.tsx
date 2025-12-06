// app/employee/_components/payroll-content.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type PayrollContentProps = {
  employeeId: string;
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
  employeeInfo,
}: {
  summary: EmployeePayrollSummary["summary"];
  employeeInfo?: EmployeePayrollSummary["employeeInfo"];
}) {
  const isMonthly = employeeInfo?.employmentType === "MONTHLY";

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
      <h3 className="mb-3 font-semibold text-emerald-700 dark:text-emerald-400">
        סיכום חודשי
      </h3>

      {isMonthly && employeeInfo?.monthlyRate && (
        <div className="mb-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm">
          <div className="font-medium text-blue-700 dark:text-blue-400">
            עובד בשכר חודשי גלובלי
          </div>
          <div className="mt-1 text-blue-600 dark:text-blue-300">
            שכר חודשי: <span className="font-semibold">{employeeInfo.monthlyRate}</span>
          </div>
          <div className="mt-1 text-xs text-blue-500/80">
            * פירוט השעות למטה הוא לצורכי מעקב בלבד
          </div>
        </div>
      )}

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

export function PayrollContent({ employeeId }: PayrollContentProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [availableMonths, setAvailableMonths] = React.useState<
    { label: string; year: number; month: number }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = React.useState<{
    year: number;
    month: number;
  } | null>(null);
  const [payrollData, setPayrollData] =
    React.useState<EmployeePayrollSummary | null>(null);

  // Load available months on mount
  React.useEffect(() => {
    async function loadMonths() {
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
    }

    loadMonths();
  }, [employeeId]);

  // Load payroll when month changes
  React.useEffect(() => {
    if (selectedMonth) {
      async function loadPayroll() {
        setIsLoading(true);
        const data = await getEmployeeMonthlyPayroll(
          employeeId,
          selectedMonth!.year,
          selectedMonth!.month
        );
        setPayrollData(data);
        setIsLoading(false);
      }

      loadPayroll();
    }
  }, [selectedMonth, employeeId]);

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

  if (isLoading && availableMonths.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (availableMonths.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">אין משמרות סגורות במערכת</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            חישוב השכר יהיה זמין לאחר סגירת משמרות
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Month Selector */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2">
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
            disabled={isLoading}
          >
            <SelectTrigger className="w-[200px]">
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
      </section>

      {/* Content */}
      {isLoading ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </section>
      ) : !payrollData || payrollData.shifts.length === 0 ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">אין משמרות בחודש זה</p>
          </div>
        </section>
      ) : (
        <>
          {/* Summary Card */}
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <SummaryCard
              summary={payrollData.summary}
              employeeInfo={payrollData.employeeInfo}
            />
          </section>

          {/* Shifts List */}
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Calculator className="h-4 w-4" />
              פירוט משמרות ({payrollData.shifts.length})
            </h4>
            <div className="space-y-2">
              {payrollData.shifts.map((shift) => (
                <ShiftRow key={shift.id} shift={shift} />
              ))}
            </div>
          </section>

          {/* Legal Note */}
          <div className="text-center text-[11px] text-muted-foreground">
            * החישוב לפי חוק שעות עבודה ומנוחה. ייתכנו הפרשים קטנים בעיגול.
          </div>
        </>
      )}
    </>
  );
}
