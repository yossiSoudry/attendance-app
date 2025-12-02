// app/admin/tasks/_components/task-details-dialog.tsx
"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  CalendarIcon,
  User,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  taskStatusLabels,
  taskStatusColors,
  type TaskStatusType,
} from "@/lib/validations/task";
import type { TaskWithEmployee } from "../_actions/task-actions";

type TaskDetailsDialogProps = {
  task: TaskWithEmployee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskDetailsDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailsDialogProps) {
  const isOverdue =
    task.status === "OPEN" &&
    task.dueDate &&
    new Date(task.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{task.title}</span>
            {task.requiresDocumentUpload && (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">סטטוס</span>
            <Badge
              variant="outline"
              className={`${taskStatusColors[task.status as TaskStatusType]}`}
            >
              {taskStatusLabels[task.status as TaskStatusType]}
            </Badge>
          </div>

          <Separator />

          {/* Employee */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">עובד:</span>
            <span className="text-sm font-medium">{task.employeeName}</span>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">תאריך יעד:</span>
              <span
                className={`text-sm font-medium ${isOverdue ? "text-red-500" : ""}`}
              >
                {format(new Date(task.dueDate), "PPP", { locale: he })}
                {isOverdue && " (באיחור)"}
              </span>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">נוצרה:</span>
            <span className="text-sm">
              {format(new Date(task.createdAt), "PPP", { locale: he })}
            </span>
          </div>

          {/* Completed At */}
          {task.completedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">הושלמה:</span>
              <span className="text-sm">
                {format(new Date(task.completedAt), "PPP", { locale: he })}
              </span>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-medium">תיאור</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </>
          )}

          {/* Manager Note */}
          {task.managerNote && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">הערת מנהל</h4>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.managerNote}
                </p>
              </div>
            </>
          )}

          {/* Employee Note */}
          {task.employeeNote && (
            <>
              <Separator />
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-medium">הערת עובד</h4>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.employeeNote}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
