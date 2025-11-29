// app/admin/shifts/_components/shift-payroll-dialog.tsx
"use client";

import { Calculator, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogIcon } from "@/components/ui/dialog-icon";

import {
  calculateShiftPayDetails,
  type ShiftPayrollDetails,
} from "../_actions/calculate-shift-pay";

type ShiftPayrollDialogProps = {
  shiftId: string;
  employeeName: string;
  trigger?: React.ReactNode;
};

export function ShiftPayrollDialog({
  shiftId,
  employeeName,
  trigger,
}: ShiftPayrollDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [details, setDetails] = React.useState<ShiftPayrollDetails | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadDetails = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateShiftPayDetails(shiftId);
      if (result) {
        setDetails(result);
      } else {
        setError("לא ניתן לחשב שכר למשמרת פתוחה");
      }
    } catch {
      setError("שגיאה בחישוב השכר");
    }

    setIsLoading(false);
  }, [shiftId]);

  React.useEffect(() => {
    if (open) {
      loadDetails();
    }
  }, [open, loadDetails]);

  const defaultTrigger = (
    <Button variant="ghost" size="icon" title="חישוב שכר">
      <Calculator className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogIcon variant="success">
            <Calculator className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>פירוט שכר - {employeeName}</DialogTitle>
          <DialogDescription>
            חישוב שכר למשמרת כולל שעות נוספות ובונוסים
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* פרטי משמרת */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">תאריך:</span>{" "}
                  <span className="font-medium">
                    {new Date(details.startTime).toLocaleDateString("he-IL")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">סוג עבודה:</span>{" "}
                  <span className="font-medium">
                    {details.workTypeName ?? "רגיל"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">שעות:</span>{" "}
                  <span className="font-medium" dir="ltr">
                    {new Date(details.startTime).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(details.endTime).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">שכר לשעה:</span>{" "}
                  <span className="font-medium">{details.hourlyRate}</span>
                </div>
              </div>
            </div>

            {/* חלוקת שעות */}
            <div>
              <h4 className="mb-2 text-sm font-medium">חלוקת שעות</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>שעות רגילות (100%)</span>
                  <span className="font-medium tabular-nums" dir="ltr">
                    {details.regularTime}
                  </span>
                </div>
                {details.overtime125Time !== "0:00" && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>שעות נוספות (125%)</span>
                    <span className="font-medium tabular-nums" dir="ltr">
                      {details.overtime125Time}
                    </span>
                  </div>
                )}
                {details.overtime150Time !== "0:00" && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>שעות נוספות (150%)</span>
                    <span className="font-medium tabular-nums" dir="ltr">
                      {details.overtime150Time}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>סה״כ</span>
                  <span className="tabular-nums" dir="ltr">
                    {details.totalTime}
                  </span>
                </div>
              </div>
            </div>

            {/* חישוב שכר */}
            <div>
              <h4 className="mb-2 text-sm font-medium">חישוב שכר</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>שכר רגיל</span>
                  <span className="font-medium">{details.regularPay}</span>
                </div>
                {details.overtime125Pay !== "₪0.00" && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>שעות נוספות 125%</span>
                    <span className="font-medium">{details.overtime125Pay}</span>
                  </div>
                )}
                {details.overtime150Pay !== "₪0.00" && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>שעות נוספות 150%</span>
                    <span className="font-medium">{details.overtime150Pay}</span>
                  </div>
                )}
                {details.bonusPay !== "₪0.00" && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>בונוסים</span>
                    <span className="font-medium">{details.bonusPay}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1">
                  <span className="font-semibold">סה״כ לתשלום</span>
                  <span className="text-lg font-bold text-primary">
                    {details.totalPay}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}