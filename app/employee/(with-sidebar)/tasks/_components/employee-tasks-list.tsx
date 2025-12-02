// app/employee/(with-sidebar)/tasks/_components/employee-tasks-list.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ChevronDown,
  MessageSquare,
  Upload,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import {
  taskStatusLabels,
  taskStatusColors,
  type TaskStatusType,
} from "@/lib/validations/task";
import {
  completeTask,
  attachDocumentToTask,
  removeDocumentFromTask,
  type EmployeeTask,
} from "@/app/employee/_actions/task-actions";

type EmployeeTasksListProps = {
  openTasks: EmployeeTask[];
  completedTasks: EmployeeTask[];
  otherTasks: EmployeeTask[];
  employeeId: string;
};

function isOverdue(task: EmployeeTask): boolean {
  if (task.status !== "OPEN" || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

function TaskCard({ task, employeeId }: { task: EmployeeTask; employeeId: string }) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [note, setNote] = React.useState(task.employeeNote ?? "");
  const [showNoteInput, setShowNoteInput] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const overdue = isOverdue(task);
  const needsDocument = task.requiresDocumentUpload && !task.attachedDocumentId;

  async function handleComplete() {
    setError(null);

    // Double check on client side
    if (task.requiresDocumentUpload && !task.attachedDocumentId) {
      setError("יש להעלות מסמך לפני השלמת המשימה");
      return;
    }

    setIsCompleting(true);
    try {
      const result = await completeTask(task.id, note || undefined);
      if (!result.success) {
        setError(result.error || "אירעה שגיאה");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
      setError("אירעה שגיאה בהשלמת המשימה");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleUploadSuccess(result: CloudinaryUploadWidgetResults) {
    if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
      setIsUploading(true);
      setError(null);
      try {
        const uploadResult = await attachDocumentToTask(
          task.id,
          employeeId,
          result.info.secure_url
        );
        if (!uploadResult.success) {
          setError(uploadResult.error || "אירעה שגיאה בהעלאת המסמך");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to attach document:", err);
        setError("אירעה שגיאה בהעלאת המסמך");
      } finally {
        setIsUploading(false);
      }
    }
  }

  async function handleRemoveDocument() {
    setIsRemoving(true);
    setError(null);
    try {
      const result = await removeDocumentFromTask(task.id);
      if (!result.success) {
        setError(result.error || "אירעה שגיאה בהסרת המסמך");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to remove document:", err);
      setError("אירעה שגיאה בהסרת המסמך");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Card className={overdue ? "border-red-300 dark:border-red-800" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{task.title}</CardTitle>
              {task.requiresDocumentUpload && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="ml-1 h-3 w-3" />
                  נדרש מסמך
                </Badge>
              )}
              {overdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="ml-1 h-3 w-3" />
                  באיחור
                </Badge>
              )}
            </div>
            {task.dueDate && (
              <CardDescription className="mt-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                תאריך יעד:{" "}
                {format(new Date(task.dueDate), "d בMMMM yyyy", { locale: he })}
              </CardDescription>
            )}
          </div>
          <Badge
            variant="outline"
            className={taskStatusColors[task.status as TaskStatusType]}
          >
            {taskStatusLabels[task.status as TaskStatusType]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}

        {task.status === "OPEN" && (
          <div className="space-y-3 pt-2">
            {/* Document Upload Section - visible when required */}
            {task.requiresDocumentUpload && (
              <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">העלאת מסמך נדרשת</span>
                </div>

                {task.attachedDocumentUrl ? (
                  // Document is attached - show preview
                  <div className="flex items-center justify-between rounded-md bg-background p-3 border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm">מסמך הועלה בהצלחה</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={task.attachedDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDocument}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // No document - show upload button
                  <CldUploadWidget
                    signatureEndpoint="/api/sign-cloudinary-params"
                    options={{
                      maxFiles: 1,
                      resourceType: "auto",
                      folder: `attendance-app/task-documents/${employeeId}`,
                      clientAllowedFormats: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
                    }}
                    onSuccess={handleUploadSuccess}
                  >
                    {({ open }) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => open()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            מעלה...
                          </>
                        ) : (
                          <>
                            <Upload className="ml-2 h-4 w-4" />
                            העלה מסמך
                          </>
                        )}
                      </Button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
            )}

            {/* Note Section */}
            <Collapsible open={showNoteInput} onOpenChange={setShowNoteInput}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <MessageSquare className="ml-2 h-4 w-4" />
                  {task.employeeNote ? "עריכת הערה" : "הוספת הערה"}
                  <ChevronDown
                    className={`mr-auto h-4 w-4 transition-transform ${
                      showNoteInput ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Textarea
                  placeholder="הערה למנהל (אופציונלי)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Complete Button - disabled if document required but not uploaded */}
            <Button
              onClick={handleComplete}
              disabled={isCompleting || needsDocument}
              className="w-full"
              title={needsDocument ? "יש להעלות מסמך לפני השלמת המשימה" : undefined}
            >
              <CheckCircle2 className="ml-2 h-4 w-4" />
              {isCompleting ? "משלים..." : needsDocument ? "יש להעלות מסמך תחילה" : "סמן כהושלם"}
            </Button>
          </div>
        )}

        {task.status === "COMPLETED" && task.completedAt && (
          <p className="text-xs text-muted-foreground">
            הושלם ב-{format(new Date(task.completedAt), "d/M/yyyy", { locale: he })}
          </p>
        )}

        {task.employeeNote && task.status !== "OPEN" && (
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">
              <MessageSquare className="inline-block ml-1 h-3 w-3" />
              {task.employeeNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeTasksList({
  openTasks,
  completedTasks,
  otherTasks,
  employeeId,
}: EmployeeTasksListProps) {
  const [showCompleted, setShowCompleted] = React.useState(false);

  if (openTasks.length === 0 && completedTasks.length === 0 && otherTasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
          <h3 className="text-lg font-medium">אין משימות</h3>
          <p className="text-sm text-muted-foreground">
            אין לך משימות פתוחות כרגע
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open Tasks */}
      {openTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">
              משימות פתוחות ({openTasks.length})
            </h2>
          </div>
          <div className="grid gap-3">
            {openTasks.map((task) => (
              <TaskCard key={task.id} task={task} employeeId={employeeId} />
            ))}
          </div>
        </div>
      )}

      {/* Other Tasks (Postponed/Canceled) */}
      {otherTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">משימות נוספות ({otherTasks.length})</h2>
          <div className="grid gap-3">
            {otherTasks.map((task) => (
              <TaskCard key={task.id} task={task} employeeId={employeeId} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>משימות שהושלמו ({completedTasks.length})</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showCompleted ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid gap-3">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} employeeId={employeeId} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
