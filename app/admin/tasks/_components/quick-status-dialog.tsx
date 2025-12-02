// app/admin/tasks/_components/quick-status-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  taskStatuses,
  taskStatusLabels,
  taskStatusColors,
  type TaskStatusType,
} from "@/lib/validations/task";
import { updateTaskStatus, type TaskWithEmployee } from "../_actions/task-actions";

type QuickStatusDialogProps = {
  task: TaskWithEmployee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickStatusDialog({
  task,
  open,
  onOpenChange,
}: QuickStatusDialogProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<TaskStatusType>(
    task.status as TaskStatusType
  );
  const [isPending, setIsPending] = React.useState(false);

  async function handleUpdate() {
    setIsPending(true);
    try {
      await updateTaskStatus(task.id, status);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>עדכון סטטוס משימה</DialogTitle>
          <DialogDescription>{task.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">סטטוס נוכחי:</span>
            <Badge
              variant="outline"
              className={taskStatusColors[task.status as TaskStatusType]}
            >
              {taskStatusLabels[task.status as TaskStatusType]}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>סטטוס חדש</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as TaskStatusType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${taskStatusColors[s]} text-xs`}
                      >
                        {taskStatusLabels[s]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            ביטול
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isPending || status === task.status}
          >
            {isPending ? "מעדכן..." : "עדכן סטטוס"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
