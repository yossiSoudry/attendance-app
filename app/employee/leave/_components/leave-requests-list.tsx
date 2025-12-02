// app/employee/leave/_components/leave-requests-list.tsx
"use client";

import * as React from "react";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Stethoscope,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

import {
  cancelLeaveRequest,
  type LeaveRequestWithEmployee,
} from "../../_actions/leave-actions";

type LeaveRequestsListProps = {
  requests: LeaveRequestWithEmployee[];
};

const statusConfig = {
  PENDING: {
    label: "ממתין לאישור",
    variant: "outline" as const,
    icon: Clock,
    color: "text-amber-600",
  },
  APPROVED: {
    label: "אושר",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-emerald-600",
  },
  PARTIALLY_APPROVED: {
    label: "אושר חלקית",
    variant: "secondary" as const,
    icon: CheckCircle2,
    color: "text-blue-600",
  },
  REJECTED: {
    label: "נדחה",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive",
  },
};

const leaveTypeConfig = {
  VACATION: {
    label: "חופשה",
    icon: CalendarDays,
    color: "text-blue-600",
  },
  SICK: {
    label: "מחלה",
    icon: Stethoscope,
    color: "text-orange-600",
  },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(start: Date, end: Date): string {
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
}

function LeaveRequestCard({
  request,
  onCancel,
}: {
  request: LeaveRequestWithEmployee;
  onCancel: (id: string) => Promise<void>;
}) {
  const [isCanceling, setIsCanceling] = React.useState(false);

  const status = statusConfig[request.status];
  const leaveType = leaveTypeConfig[request.leaveType];
  const StatusIcon = status.icon;
  const LeaveTypeIcon = leaveType.icon;

  async function handleCancel() {
    setIsCanceling(true);
    await onCancel(request.id);
    setIsCanceling(false);
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Type & Status */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1 ${leaveType.color}`}>
              <LeaveTypeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{leaveType.label}</span>
            </div>
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(request.startDate, request.endDate)}</span>
          </div>

          {/* Days */}
          <div className="text-sm">
            <span className="text-muted-foreground">ימים: </span>
            <span className="font-medium">
              {request.status === "PARTIALLY_APPROVED" && request.approvedDays
                ? `${request.approvedDays} מתוך ${request.totalDays}`
                : request.totalDays}
            </span>
          </div>

          {/* Employee Note */}
          {request.employeeNote && (
            <div className="mt-2 rounded border-r-2 border-muted-foreground/30 bg-muted/50 py-1 pr-2 text-sm">
              <span className="text-muted-foreground">הערתי: </span>
              {request.employeeNote}
            </div>
          )}

          {/* Manager Note */}
          {request.managerNote && (
            <div className="mt-2 flex items-start gap-2 rounded border-r-2 border-primary/30 bg-primary/5 py-1 pr-2 text-sm">
              <MessageSquare className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <span className="text-muted-foreground">תגובת מנהל: </span>
                {request.managerNote}
              </div>
            </div>
          )}

          {/* Attached Document */}
          {request.documentUrl && (
            <a
              href={request.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 rounded bg-emerald-500/10 px-2 py-1.5 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/20"
            >
              <FileText className="h-4 w-4" />
              <span className="flex-1">
                {request.documentName || "אישור מחלה"}
              </span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Cancel Button - only for pending requests */}
        {request.status === "PENDING" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ביטול בקשת חופשה</AlertDialogTitle>
                <AlertDialogDescription>
                  האם אתה בטוח שברצונך לבטל את הבקשה? פעולה זו לא ניתנת לביטול.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>לא, השאר</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  כן, בטל
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Created date */}
      <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
        נשלח ב-{formatDate(request.createdAt)}
      </div>
    </div>
  );
}

export function LeaveRequestsList({ requests }: LeaveRequestsListProps) {
  const [localRequests, setLocalRequests] = React.useState(requests);

  async function handleCancel(id: string) {
    const result = await cancelLeaveRequest(id);
    if (result.success) {
      setLocalRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const pendingRequests = localRequests.filter((r) => r.status === "PENDING");
  const processedRequests = localRequests.filter((r) => r.status !== "PENDING");

  return (
    <Card>
      <CardHeader>
        <CardTitle>הבקשות שלי</CardTitle>
        <CardDescription>
          {localRequests.length === 0
            ? "עדיין לא הגשת בקשות חופשה"
            : `${localRequests.length} בקשות`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {localRequests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CalendarDays className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>אין בקשות חופשה</p>
            <p className="text-sm">השתמש בטופס למעלה כדי להגיש בקשה חדשה</p>
          </div>
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  ממתינות לאישור ({pendingRequests.length})
                </h3>
                {pendingRequests.map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  היסטוריה ({processedRequests.length})
                </h3>
                {processedRequests.map((request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
