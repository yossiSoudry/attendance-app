// app/admin/work-types/_components/delete-work-type-dialog.tsx
"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DialogIcon } from "@/components/ui/dialog-icon";

import { deleteWorkType } from "../_actions/work-type-actions";

type DeleteWorkTypeDialogProps = {
  workTypeId: string;
  workTypeName: string;
  shiftsCount: number;
};

export function DeleteWorkTypeDialog({
  workTypeId,
  workTypeName,
  shiftsCount,
}: DeleteWorkTypeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setIsPending(true);
    setError(null);

    const result = await deleteWorkType(workTypeId);

    setIsPending(false);

    if (result.success) {
      setOpen(false);
    } else {
      setError(result.message);
    }
  }

  const hasShifts = shiftsCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <DialogIcon variant="destructive">
            <Trash2 className="h-5 w-5" />
          </DialogIcon>
          <AlertDialogTitle>מחיקת סוג עבודה</AlertDialogTitle>
          <AlertDialogDescription>
            {hasShifts ? (
              <>
                לא ניתן למחוק את סוג העבודה{" "}
                <span className="font-semibold text-foreground">
                  {workTypeName}
                </span>{" "}
                כיוון שיש {shiftsCount} משמרות משויכות אליו.
              </>
            ) : (
              <>
                האם אתה בטוח שברצונך למחוק את סוג העבודה{" "}
                <span className="font-semibold text-foreground">
                  {workTypeName}
                </span>
                ?
                <br />
                פעולה זו לא ניתנת לביטול.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          {!hasShifts && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              מחק סוג עבודה
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}