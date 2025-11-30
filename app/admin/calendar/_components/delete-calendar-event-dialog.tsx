// app/admin/calendar/_components/delete-calendar-event-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCalendarEvent } from "../_actions/calendar-actions";
import type { CalendarEventTableRow } from "./calendar-data-table";

// ========================================
// Types
// ========================================

type DeleteCalendarEventDialogProps = {
  event: CalendarEventTableRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ========================================
// Component
// ========================================

export function DeleteCalendarEventDialog({
  event,
  open,
  onOpenChange,
}: DeleteCalendarEventDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteCalendarEvent(event.id);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete event:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת אירוע</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את האירוע &quot;{event.nameHe}&quot;?
            <br />
            פעולה זו אינה ניתנת לביטול.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "מוחק..." : "מחק"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
