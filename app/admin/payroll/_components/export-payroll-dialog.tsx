// app/admin/payroll/_components/export-payroll-dialog.tsx
"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AdminPayrollSummary } from "../_actions/admin-payroll-actions";
import {
  exportEmployeePayroll,
  exportAllEmployeesPayrollSummary,
} from "@/lib/exports/payroll-export";
import type { ExportFormat } from "@/lib/exports/export-utils";

type ExportPayrollDialogProps = {
  payroll?: AdminPayrollSummary;
  allPayrolls?: AdminPayrollSummary[];
  periodLabel?: string;
  mode: "single" | "all";
};

export function ExportPayrollDialog({
  payroll,
  allPayrolls,
  periodLabel,
  mode,
}: ExportPayrollDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mode === "single" && payroll) {
        exportEmployeePayroll(payroll, format);
      } else if (mode === "all" && allPayrolls && periodLabel) {
        exportAllEmployeesPayrollSummary(allPayrolls, periodLabel, format);
      }

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 ml-2" />
          ייצוא
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>ייצוא דוח שכר</DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? `ייצוא דוח שכר עבור ${payroll?.employeeName}`
              : "ייצוא דוח מסכם לכל העובדים"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>בחר פורמט</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="xlsx"
                  id="xlsx"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="xlsx"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileSpreadsheet className="mb-3 h-6 w-6 text-emerald-600" />
                  <span className="text-sm font-medium">Excel</span>
                  <span className="text-xs text-muted-foreground">.xlsx</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="mb-3 h-6 w-6 text-red-600" />
                  <span className="text-sm font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">.pdf</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "single" && payroll && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">עובד:</span>
                <span className="font-medium">{payroll.employeeName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">תקופה:</span>
                <span>{payroll.period.month}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">משמרות:</span>
                <span>{payroll.summary.totalShifts}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">סה״כ:</span>
                <span className="font-bold text-primary">
                  {payroll.summary.totalPay}
                </span>
              </div>
            </div>
          )}

          {mode === "all" && allPayrolls && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">תקופה:</span>
                <span className="font-medium">{periodLabel}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">עובדים:</span>
                <span>{allPayrolls.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">סה״כ משמרות:</span>
                <span>
                  {allPayrolls.reduce((sum, p) => sum + p.summary.totalShifts, 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מייצא...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 ml-2" />
                הורד {format === "xlsx" ? "Excel" : "PDF"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
