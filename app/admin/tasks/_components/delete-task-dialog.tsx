// app/admin/tasks/_components/delete-task-dialog.tsx
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
import { deleteTask } from "../_actions/task-actions";

type DeleteTaskDialogProps = {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteTaskDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
}: DeleteTaskDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteTask(taskId);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת משימה</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את המשימה &quot;{taskTitle}&quot;?
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
