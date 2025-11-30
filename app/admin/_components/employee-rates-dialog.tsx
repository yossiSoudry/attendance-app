// app/admin/_components/employee-rates-dialog.tsx
"use client";

import { Banknote, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { DialogIcon } from "@/components/ui/dialog-icon";
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  getEmployeeRates,
  saveEmployeeRates,
  type EmployeeRateInput,
} from "../_actions/employee-work-rate-actions";
import type { WorkTypeRateType } from "@prisma/client";

type WorkType = {
  id: string;
  name: string;
  isDefault: boolean;
  rateType: WorkTypeRateType;
  rateValue: number;
};

function formatRateDisplay(rateType: WorkTypeRateType, rateValue: number): string {
  switch (rateType) {
    case "BASE_RATE":
      return "שכר בסיסי";
    case "FIXED":
      return `${(rateValue / 100).toFixed(0)}₪/שעה`;
    case "BONUS_PERCENT":
      return `+${(rateValue / 100).toFixed(0)}%`;
    case "BONUS_FIXED":
      return `+${(rateValue / 100).toFixed(0)}₪/שעה`;
  }
}

type EmployeeRatesDialogProps = {
  employeeId: string;
  employeeName: string;
  baseHourlyRate: number | null; // in agorot
  workTypes: WorkType[];
  trigger?: React.ReactNode;
};

type AssignmentState = {
  workTypeId: string;
  workTypeName: string;
  isDefault: boolean;
  rateType: WorkTypeRateType;
  rateValue: number;
  isAssigned: boolean;
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
  const [assignments, setAssignments] = React.useState<AssignmentState[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Load existing rates when dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);

      getEmployeeRates(employeeId)
        .then((existingRates) => {
          // Create a set of assigned work type IDs
          const assignedSet = new Set(
            existingRates.map((r: { workTypeId: string }) => r.workTypeId)
          );

          // Initialize assignments for all non-default work types
          const initialAssignments: AssignmentState[] = workTypes
            .filter((wt) => !wt.isDefault) // Don't show default, it's always available
            .map((wt) => ({
              workTypeId: wt.id,
              workTypeName: wt.name,
              isDefault: wt.isDefault,
              rateType: wt.rateType,
              rateValue: wt.rateValue,
              isAssigned: assignedSet.has(wt.id),
            }));

          setAssignments(initialAssignments);
        })
        .catch(() => {
          setError("שגיאה בטעינת ההקצאות");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, employeeId, workTypes]);

  function handleAssignmentChange(workTypeId: string, isAssigned: boolean) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.workTypeId === workTypeId ? { ...a, isAssigned } : a
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    // Save assigned work types with a placeholder rate (1 agorot)
    // The actual rate comes from WorkType.rateType/rateValue
    const ratesToSave: EmployeeRateInput[] = assignments
      .filter((a) => a.isAssigned)
      .map((a) => ({
        workTypeId: a.workTypeId,
        hourlyRate: 1, // Placeholder - actual rate is from WorkType
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
  const nonDefaultWorkTypes = workTypes.filter((wt) => !wt.isDefault);

  const defaultTrigger = (
    <Button variant="ghost" size="icon" title="הקצאת סוגי עבודה">
      <Banknote className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogIcon>
            <Banknote className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>הקצאת סוגי עבודה - {employeeName}</DialogTitle>
          <DialogDescription>
            בחר אילו סוגי עבודה מיוחדים יהיו זמינים לעובד זה. סוג עבודה ברירת מחדל זמין לכולם.
          </DialogDescription>
        </DialogHeader>

        {/* Base rate info */}
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">שכר בסיס לשעה:</span>
            <span className="font-medium">
              {baseRateShekel > 0 ? `₪${baseRateShekel.toFixed(0)}` : "לא הוגדר"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            התעריפים של סוגי העבודה מחושבים ביחס לשכר הבסיס
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : nonDefaultWorkTypes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            אין סוגי עבודה מיוחדים במערכת.
            <br />
            <span className="text-xs">
              הוסף סוגי עבודה בעמוד &quot;סוגי עבודה&quot; תחילה.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.workTypeId}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={`assign-${assignment.workTypeId}`}
                  checked={assignment.isAssigned}
                  onCheckedChange={(checked) =>
                    handleAssignmentChange(assignment.workTypeId, !!checked)
                  }
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`assign-${assignment.workTypeId}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {assignment.workTypeName}
                  </Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatRateDisplay(assignment.rateType, assignment.rateValue)}
                    </Badge>
                  </div>
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
            disabled={isSaving || isLoading}
          >
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            שמור הקצאות
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}