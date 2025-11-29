// app/admin/shifts/_components/delete-shift-dialog.tsx
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

import { deleteShift } from "../_actions/shift-actions";

type DeleteShiftDialogProps = {
  shiftId: string;
  employeeName: string;
  shiftDate: string;
};

export function DeleteShiftDialog({
  shiftId,
  employeeName,
  shiftDate,
}: DeleteShiftDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  async function handleDelete() {
    setIsPending(true);
    await deleteShift(shiftId);
    setIsPending(false);
    setOpen(false);
  }

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
          <AlertDialogTitle>מחיקת משמרת</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את המשמרת של{" "}
            <span className="font-semibold text-foreground">{employeeName}</span>{" "}
            מתאריך {shiftDate}?
            <br />
            פעולה זו לא ניתנת לביטול.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            מחק משמרת
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}