// app/contractor/_components/monthly-summary.tsx
"use client";

import { Clock, FileText, Wallet, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ContractorPayrollSummary } from "@/lib/calculations/contractor-payroll";

type MonthlySummaryProps = {
  summary: ContractorPayrollSummary;
  monthLabel: string;
  hourlyRateDisplay: string;
};

export function MonthlySummary({
  summary,
  monthLabel,
  hourlyRateDisplay,
}: MonthlySummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entries */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">רשומות</p>
                <p className="text-2xl font-semibold">{summary.totalEntries}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">סה״כ שעות</p>
                <p className="text-2xl font-semibold" dir="ltr">
                  {summary.totalHoursFormatted}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Rate */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">תעריף לשעה</p>
                <p className="text-2xl font-semibold">{hourlyRateDisplay}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Pay */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">סה״כ לתשלום</p>
                <p className="text-2xl font-semibold">{summary.formattedPay}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation */}
      <p className="text-sm text-muted-foreground text-center">
        {summary.totalHoursFormatted} שעות × {hourlyRateDisplay} ={" "}
        <span className="font-medium text-foreground">{summary.formattedPay}</span>
      </p>
    </div>
  );
}
