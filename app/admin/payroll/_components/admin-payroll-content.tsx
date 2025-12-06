// app/admin/payroll/_components/admin-payroll-content.tsx
"use client";

import {
  Calculator,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  User,
  Users,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  getAllEmployeesMonthlyPayroll,
  getGlobalAvailableMonths,
  type AdminPayrollSummary,
  type AdminShiftPayroll,
} from "../_actions/admin-payroll-actions";
import { ExportPayrollDialog } from "./export-payroll-dialog";

// ========================================
// Types
// ========================================

type AdminPayrollContentProps = {
  employees: { id: string; fullName: string }[];
};

// ========================================
// Shift Row Component (for accordion details)
// ========================================

function ShiftDetailRow({ shift }: { shift: AdminShiftPayroll }) {
  const hasOvertime =
    shift.overtime125Time !== "0:00" ||
    shift.overtime150Time !== "0:00" ||
    shift.shabbatTime !== "0:00";

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
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
              {shift.workTypeName && (
                <Badge variant="outline" className="text-[10px]">
                  {shift.workTypeName}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasOvertime && (
            <Badge variant="secondary" className="text-xs">
              שעות נוספות
            </Badge>
          )}
          <span className="font-semibold text-emerald-600">{shift.totalPay}</span>
        </div>
      </div>

      {/* Expanded details */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-2 text-xs sm:grid-cols-4">
        {shift.regularTime !== "0:00" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">רגיל:</span>
            <span>
              {shift.regularTime} / {shift.regularPay}
            </span>
          </div>
        )}
        {shift.overtime125Time !== "0:00" && (
          <div className="flex justify-between text-amber-600">
            <span>125%:</span>
            <span>
              {shift.overtime125Time} / {shift.overtime125Pay}
            </span>
          </div>
        )}
        {shift.overtime150Time !== "0:00" && (
          <div className="flex justify-between text-orange-600">
            <span>150%:</span>
            <span>
              {shift.overtime150Time} / {shift.overtime150Pay}
            </span>
          </div>
        )}
        {shift.shabbatTime !== "0:00" && (
          <div className="flex justify-between text-purple-600">
            <span>שבת:</span>
            <span>
              {shift.shabbatTime} / {shift.shabbatPay}
            </span>
          </div>
        )}
        {shift.bonusPay !== "₪0.00" && (
          <div className="flex justify-between text-emerald-600">
            <span>בונוס:</span>
            <span>{shift.bonusPay}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Employee Payroll Row Component
// ========================================

function EmployeePayrollRow({ payroll }: { payroll: AdminPayrollSummary }) {
  const isMonthly = payroll.employeeInfo?.employmentType === "MONTHLY";

  return (
    <AccordionItem value={payroll.employeeId} className="border-b">
      <AccordionTrigger className="hover:no-underline px-2 py-3">
        <div className="flex w-full items-center justify-between pl-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 font-medium">
                {payroll.employeeName}
                {isMonthly && (
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-400">
                    חודשי
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {payroll.summary.totalShifts} משמרות • {payroll.summary.totalDuration}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Hours breakdown badges */}
            <div className="hidden gap-2 sm:flex">
              {payroll.summary.overtime125Time !== "0:00" && (
                <Badge variant="secondary" className="text-xs text-amber-600">
                  125%: {payroll.summary.overtime125Time}
                </Badge>
              )}
              {payroll.summary.overtime150Time !== "0:00" && (
                <Badge variant="secondary" className="text-xs text-orange-600">
                  150%: {payroll.summary.overtime150Time}
                </Badge>
              )}
              {payroll.summary.shabbatTime !== "0:00" && (
                <Badge variant="secondary" className="text-xs text-purple-600">
                  שבת: {payroll.summary.shabbatTime}
                </Badge>
              )}
            </div>
            <span className="text-lg font-bold text-emerald-600">
              {payroll.summary.totalPay}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-2 pb-4">
          {/* Monthly employee info */}
          {isMonthly && payroll.employeeInfo?.monthlyRate && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm">
              <div className="font-medium text-blue-700 dark:text-blue-400">
                עובד בשכר חודשי גלובלי
              </div>
              <div className="mt-1 text-blue-600 dark:text-blue-300">
                שכר חודשי: <span className="font-semibold">{payroll.employeeInfo.monthlyRate}</span>
              </div>
              <div className="mt-1 text-xs text-blue-500/80">
                * פירוט השעות למטה הוא לצורכי מעקב בלבד
              </div>
            </div>
          )}

          {/* Summary breakdown */}
          <div className="rounded-lg border bg-emerald-500/5 p-3">
            <h4 className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              סיכום תשלום
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {payroll.summary.regularPay !== "₪0.00" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שכר רגיל:</span>
                  <span>{payroll.summary.regularPay}</span>
                </div>
              )}
              {payroll.summary.overtime125Pay !== "₪0.00" && (
                <div className="flex justify-between text-amber-600">
                  <span>שכר 125%:</span>
                  <span>{payroll.summary.overtime125Pay}</span>
                </div>
              )}
              {payroll.summary.overtime150Pay !== "₪0.00" && (
                <div className="flex justify-between text-orange-600">
                  <span>שכר 150%:</span>
                  <span>{payroll.summary.overtime150Pay}</span>
                </div>
              )}
              {payroll.summary.shabbatPay !== "₪0.00" && (
                <div className="flex justify-between text-purple-600">
                  <span>שכר שבת:</span>
                  <span>{payroll.summary.shabbatPay}</span>
                </div>
              )}
              {payroll.summary.bonusPay !== "₪0.00" && (
                <div className="flex justify-between text-emerald-600">
                  <span>בונוסים:</span>
                  <span>{payroll.summary.bonusPay}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shifts list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                פירוט משמרות ({payroll.shifts.length})
              </h4>
              <ExportPayrollDialog payroll={payroll} mode="single" />
            </div>
            <div className="space-y-2">
              {payroll.shifts.map((shift) => (
                <ShiftDetailRow key={shift.id} shift={shift} />
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ========================================
// Totals Summary Component
// ========================================

function TotalsSummary({ payrolls }: { payrolls: AdminPayrollSummary[] }) {
  // Calculate totals
  const totals = payrolls.reduce(
    (acc, p) => {
      // Parse the formatted string back to number (remove ₪ and commas)
      const parseAmount = (str: string) => {
        const num = parseFloat(str.replace(/[₪,]/g, ""));
        return isNaN(num) ? 0 : num;
      };

      // Parse time string (H:MM) to minutes
      const parseTime = (str: string) => {
        const parts = str.split(":");
        if (parts.length !== 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };

      return {
        shifts: acc.shifts + p.summary.totalShifts,
        totalMinutes: acc.totalMinutes + parseTime(p.summary.totalDuration),
        regularPay: acc.regularPay + parseAmount(p.summary.regularPay),
        overtime125Pay: acc.overtime125Pay + parseAmount(p.summary.overtime125Pay),
        overtime150Pay: acc.overtime150Pay + parseAmount(p.summary.overtime150Pay),
        shabbatPay: acc.shabbatPay + parseAmount(p.summary.shabbatPay),
        bonusPay: acc.bonusPay + parseAmount(p.summary.bonusPay),
        totalPay: acc.totalPay + parseAmount(p.summary.totalPay),
      };
    },
    {
      shifts: 0,
      totalMinutes: 0,
      regularPay: 0,
      overtime125Pay: 0,
      overtime150Pay: 0,
      shabbatPay: 0,
      bonusPay: 0,
      totalPay: 0,
    }
  );

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString("he-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
          סיכום כללי
        </h3>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          {payrolls.length} עובדים
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">משמרות:</span>
          <span className="font-medium">{totals.shifts}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">שעות:</span>
          <span className="font-medium">{formatMinutes(totals.totalMinutes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">שכר רגיל:</span>
          <span>{formatCurrency(totals.regularPay)}</span>
        </div>
        {totals.overtime125Pay > 0 && (
          <div className="flex justify-between text-amber-600">
            <span>שכר 125%:</span>
            <span>{formatCurrency(totals.overtime125Pay)}</span>
          </div>
        )}
        {totals.overtime150Pay > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>שכר 150%:</span>
            <span>{formatCurrency(totals.overtime150Pay)}</span>
          </div>
        )}
        {totals.shabbatPay > 0 && (
          <div className="flex justify-between text-purple-600">
            <span>שכר שבת:</span>
            <span>{formatCurrency(totals.shabbatPay)}</span>
          </div>
        )}
        {totals.bonusPay > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>בונוסים:</span>
            <span>{formatCurrency(totals.bonusPay)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
        <span>סה״כ לתשלום:</span>
        <span className="text-emerald-600">{formatCurrency(totals.totalPay)}</span>
      </div>
    </div>
  );
}

// ========================================
// Main Component
// ========================================

export function AdminPayrollContent({ employees }: AdminPayrollContentProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [availableMonths, setAvailableMonths] = React.useState<
    { label: string; year: number; month: number }[]
  >([]);
  const [selectedMonth, setSelectedMonth] = React.useState<{
    year: number;
    month: number;
  } | null>(null);
  const [payrollsData, setPayrollsData] = React.useState<AdminPayrollSummary[]>([]);

  // Load available months on mount
  React.useEffect(() => {
    async function loadMonths() {
      setIsLoading(true);
      const months = await getGlobalAvailableMonths();
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
  }, []);

  // Load payroll when month changes
  React.useEffect(() => {
    if (selectedMonth) {
      async function loadPayroll() {
        setIsLoading(true);
        const data = await getAllEmployeesMonthlyPayroll(
          selectedMonth!.year,
          selectedMonth!.month
        );
        setPayrollsData(data);
        setIsLoading(false);
      }

      loadPayroll();
    }
  }, [selectedMonth]);

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

  const periodLabel = selectedMonth
    ? availableMonths.find(
        (m) => m.year === selectedMonth.year && m.month === selectedMonth.month
      )?.label ?? ""
    : "";

  if (employees.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <User className="mb-2 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">אין עובדים פעילים במערכת</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Month Selector */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth("prev")}
              disabled={!canGoPrev || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Select
              value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ""}
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
                  <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
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

          {payrollsData.length > 0 && (
            <ExportPayrollDialog
              allPayrolls={payrollsData}
              periodLabel={periodLabel}
              mode="all"
            />
          )}
        </div>
      </section>

      {/* Content */}
      {isLoading ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </section>
      ) : availableMonths.length === 0 ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">אין משמרות סגורות במערכת</p>
          </div>
        </section>
      ) : payrollsData.length === 0 ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">אין משמרות בחודש זה</p>
          </div>
        </section>
      ) : (
        <>
          {/* Totals Summary */}
          <section className="rounded-2xl border bg-card p-4 shadow-sm">
            <TotalsSummary payrolls={payrollsData} />
          </section>

          {/* Employees List with Accordion */}
          <section className="rounded-2xl border bg-card shadow-sm">
            <Accordion type="multiple" className="w-full">
              {payrollsData.map((payroll) => (
                <EmployeePayrollRow key={payroll.employeeId} payroll={payroll} />
              ))}
            </Accordion>
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
