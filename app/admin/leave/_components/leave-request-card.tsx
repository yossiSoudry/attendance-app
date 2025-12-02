// app/admin/leave/_components/leave-request-card.tsx
"use client";

import * as React from "react";
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Stethoscope,
  User,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  approveLeaveRequest,
  partiallyApproveLeaveRequest,
  rejectLeaveRequest,
  type LeaveRequestForAdmin,
} from "../_actions/leave-admin-actions";

type LeaveRequestCardProps = {
  request: LeaveRequestForAdmin;
  onAction?: () => void;
};

const leaveTypeConfig = {
  VACATION: {
    label: "חופשה",
    icon: CalendarDays,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  SICK: {
    label: "מחלה",
    icon: Stethoscope,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
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

export function LeaveRequestCard({ request, onAction }: LeaveRequestCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [action, setAction] = React.useState<
    "approve" | "partial" | "reject" | null
  >(null);
  const [managerNote, setManagerNote] = React.useState("");
  const [approvedDays, setApprovedDays] = React.useState(
    Math.floor(request.totalDays / 2)
  );

  const leaveType = leaveTypeConfig[request.leaveType];
  const LeaveTypeIcon = leaveType.icon;

  async function handleApprove() {
    setIsLoading(true);
    const result = await approveLeaveRequest(request.id, managerNote);
    setIsLoading(false);

    if (result.success) {
      onAction?.();
    }
  }

  async function handlePartialApprove() {
    setIsLoading(true);
    const result = await partiallyApproveLeaveRequest(
      request.id,
      approvedDays,
      managerNote
    );
    setIsLoading(false);

    if (result.success) {
      onAction?.();
    }
  }

  async function handleReject() {
    setIsLoading(true);
    const result = await rejectLeaveRequest(request.id, managerNote);
    setIsLoading(false);

    if (result.success) {
      onAction?.();
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Employee Name */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.employeeName}</span>
            </div>

            {/* Leave Type */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`gap-1 ${leaveType.bgColor} ${leaveType.color}`}
              >
                <LeaveTypeIcon className="h-3 w-3" />
                {leaveType.label}
              </Badge>
            </div>
          </div>

          {/* Days Badge */}
          <div className="text-center">
            <div className="text-2xl font-bold">{request.totalDays}</div>
            <div className="text-xs text-muted-foreground">
              {request.totalDays === 1 ? "יום" : "ימים"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDateRange(request.startDate, request.endDate)}</span>
        </div>

        {/* Employee Note */}
        {request.employeeNote && (
          <div className="rounded border-r-2 border-muted-foreground/30 bg-muted/50 py-2 pr-3 text-sm">
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{request.employeeNote}</span>
            </div>
          </div>
        )}

        {/* Attached Document */}
        {request.documentUrl && (
          <a
            href={request.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/20"
          >
            <FileText className="h-4 w-4" />
            <span className="flex-1">
              {request.documentName || "אישור מחלה"}
            </span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Submitted Date */}
        <div className="text-xs text-muted-foreground">
          נשלח ב-{formatDate(request.createdAt)}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-0">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          {/* Quick Actions */}
          {!isOpen && (
            <div className="flex w-full gap-2">
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 gap-1"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                אשר
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  אפשרויות
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <Button
                onClick={handleReject}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="gap-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                דחה
              </Button>
            </div>
          )}

          {/* Expanded Options */}
          <CollapsibleContent className="w-full space-y-4 pt-3">
            {/* Action Selection */}
            <div className="flex gap-2">
              <Button
                variant={action === "approve" ? "default" : "outline"}
                size="sm"
                onClick={() => setAction("approve")}
                className="flex-1"
              >
                אשר הכל
              </Button>
              <Button
                variant={action === "partial" ? "default" : "outline"}
                size="sm"
                onClick={() => setAction("partial")}
                className="flex-1"
              >
                אשר חלקית
              </Button>
              <Button
                variant={action === "reject" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAction("reject")}
                className="flex-1"
              >
                דחה
              </Button>
            </div>

            {/* Partial Approval Days */}
            {action === "partial" && (
              <div className="space-y-2">
                <Label htmlFor="approvedDays">מספר ימים לאישור</Label>
                <Input
                  id="approvedDays"
                  type="number"
                  min={1}
                  max={request.totalDays - 1}
                  value={approvedDays}
                  onChange={(e) =>
                    setApprovedDays(parseInt(e.target.value) || 1)
                  }
                  className="text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  מקסימום: {request.totalDays - 1} ימים (מתוך {request.totalDays}{" "}
                  שהתבקשו)
                </p>
              </div>
            )}

            {/* Manager Note */}
            <div className="space-y-2">
              <Label htmlFor="managerNote">הערה לעובד (אופציונלי)</Label>
              <Textarea
                id="managerNote"
                value={managerNote}
                onChange={(e) => setManagerNote(e.target.value)}
                placeholder="הסבר או הערות..."
                rows={2}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                size="sm"
              >
                ביטול
              </Button>
              <Button
                onClick={
                  action === "approve"
                    ? handleApprove
                    : action === "partial"
                      ? handlePartialApprove
                      : handleReject
                }
                disabled={isLoading || !action}
                variant={action === "reject" ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : null}
                {action === "approve"
                  ? "אשר הכל"
                  : action === "partial"
                    ? `אשר ${approvedDays} ימים`
                    : action === "reject"
                      ? "דחה בקשה"
                      : "בחר פעולה"}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}
