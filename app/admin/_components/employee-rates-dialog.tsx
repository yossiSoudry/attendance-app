// app/admin/_components/employee-rates-dialog.tsx
"use client";

import { Banknote, Loader2, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getEmployeeRates,
  saveEmployeeRates,
  type EmployeeRateInput,
} from "../_actions/employee-work-rate-actions";

type WorkType = {
  id: string;
  name: string;
};

type EmployeeRatesDialogProps = {
  employeeId: string;
  employeeName: string;
  baseHourlyRate: number | null; // in agorot
  workTypes: WorkType[];
  trigger?: React.ReactNode;
};

type RateState = {
  workTypeId: string;
  workTypeName: string;
  hourlyRate: number; // in shekels
};

export function EmployeeRatesDialog({
  employeeId,
  employeeName,
  baseHourlyRate,
  workTypes,
  trigger,
}: EmployeeRatesDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [rates, setRates] = React.useState<RateState[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Load existing rates when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      getEmployeeRates(employeeId)
        .then((existingRates) => {
          // Create a map of existing rates
          const existingMap = new Map(
            existingRates.map((r: { workTypeId: string; hourlyRate: number }) => [r.workTypeId, r.hourlyRate])
          );

          // Initialize rates for all work types
          const initialRates: RateState[] = workTypes.map((wt) => ({
            workTypeId: wt.id,
            workTypeName: wt.name,
            hourlyRate: (existingMap.get(wt.id) ?? 0) as number,
          }));

          setRates(initialRates);
        })
        .catch(() => {
          setError("שגיאה בטעינת התעריפים");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, employeeId, workTypes]);

  function handleRateChange(workTypeId: string, value: string) {
    const numValue = parseFloat(value) || 0;
    setRates((prev) =>
      prev.map((r) =>
        r.workTypeId === workTypeId ? { ...r, hourlyRate: numValue } : r
      )
    );
  }

  function handleClearRate(workTypeId: string) {
    setRates((prev) =>
      prev.map((r) =>
        r.workTypeId === workTypeId ? { ...r, hourlyRate: 0 } : r
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const ratesToSave: EmployeeRateInput[] = rates
      .filter((r) => r.hourlyRate > 0)
      .map((r) => ({
        workTypeId: r.workTypeId,
        hourlyRate: r.hourlyRate,
      }));

    const result = await saveEmployeeRates(employeeId, ratesToSave);

    setIsSaving(false);

    if (result.success) {
      setOpen(false);
    } else {
      setError(result.message);
    }
  }

  const baseRateShekel = baseHourlyRate ? baseHourlyRate / 100 : 0;

  const defaultTrigger = (
    <Button variant="ghost" size="icon" title="ניהול תעריפים">
      <Banknote className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ניהול תעריפים - {employeeName}</DialogTitle>
          <DialogDescription>
            הגדר שכר לשעה עבור כל סוג עבודה. השאר ריק או 0 לשימוש בשכר הבסיס.
          </DialogDescription>
        </DialogHeader>

        {/* Base rate info */}
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">שכר בסיס לשעה:</span>
            <span className="font-medium">
              {baseRateShekel > 0 ? `₪${baseRateShekel.toFixed(2)}` : "לא הוגדר"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            שכר הבסיס ישמש כשלא מוגדר תעריף ספציפי לסוג עבודה
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : workTypes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            אין סוגי עבודה במערכת.
            <br />
            <span className="text-xs">
              הוסף סוגי עבודה בעמוד &quot;סוגי עבודה&quot; תחילה.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {rates.map((rate) => (
              <div
                key={rate.workTypeId}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex-1">
                  <Label
                    htmlFor={`rate-${rate.workTypeId}`}
                    className="text-sm font-medium"
                  >
                    {rate.workTypeName}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ₪
                    </span>
                    <Input
                      id={`rate-${rate.workTypeId}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      placeholder={baseRateShekel > 0 ? baseRateShekel.toFixed(2) : "0.00"}
                      value={rate.hourlyRate || ""}
                      onChange={(e) =>
                        handleRateChange(rate.workTypeId, e.target.value)
                      }
                      className="w-28 pr-7 text-left"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleClearRate(rate.workTypeId)}
                    disabled={rate.hourlyRate === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading || workTypes.length === 0}
          >
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            שמור תעריפים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}