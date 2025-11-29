// app/employee/_components/work-type-select-dialog.tsx
"use client";

import { Briefcase, Check, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogIcon } from "@/components/ui/dialog-icon";
import { cn } from "@/lib/utils";

import { clockIn } from "../_actions/clock-actions";

type WorkType = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

type WorkTypeSelectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workTypes: WorkType[];
  onSuccess: () => void;
};

export function WorkTypeSelectDialog({
  open,
  onOpenChange,
  workTypes,
  onSuccess,
}: WorkTypeSelectDialogProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Set default selection when dialog opens
  React.useEffect(() => {
    if (open) {
      const defaultWorkType = workTypes.find((wt) => wt.isDefault);
      setSelectedId(defaultWorkType?.id ?? workTypes[0]?.id ?? null);
      setError(null);
    }
  }, [open, workTypes]);

  async function handleConfirm() {
    if (!selectedId) {
      setError("יש לבחור סוג עבודה");
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await clockIn(selectedId);

    setIsPending(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogIcon>
            <Briefcase className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>בחירת סוג עבודה</DialogTitle>
          <DialogDescription>
            בחר את סוג העבודה למשמרת זו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {workTypes.map((workType) => (
            <button
              key={workType.id}
              type="button"
              onClick={() => setSelectedId(workType.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-right transition-all",
                selectedId === workType.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  selectedId === workType.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {selectedId === workType.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Briefcase className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{workType.name}</span>
                  {workType.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                      ברירת מחדל
                    </span>
                  )}
                </div>
                {workType.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {workType.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            ביטול
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !selectedId}>
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            כניסה למשמרת
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}