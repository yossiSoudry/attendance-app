// app/employee/_components/my-pending-shifts.tsx
"use client";

import {
  AlertCircle,
  Clock,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import * as React from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogIcon } from "@/components/ui/dialog-icon";

import {
  cancelPendingShift,
  getEmployeePendingShifts,
  type PendingShiftInfo,
} from "../_actions/retro-shift-actions";

// ========================================
// Types
// ========================================

type MyPendingShiftsProps = {
  employeeId: string;
};

// ========================================
// Component
// ========================================

export function MyPendingShifts({ employeeId }: MyPendingShiftsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [shifts, setShifts] = React.useState<PendingShiftInfo[]>([]);
  const [cancelingId, setCancelingId] = React.useState<string | null>(null);

  // Load shifts
  const loadShifts = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getEmployeePendingShifts(employeeId);
    setShifts(data);
    setIsLoading(false);
  }, [employeeId]);

  React.useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  // Cancel shift
  async function handleCancel(shiftId: string) {
    setCancelingId(shiftId);
    const result = await cancelPendingShift(employeeId, shiftId);
    setCancelingId(null);

    if (result.success) {
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    }
  }

  // Filter by status
  const pendingShifts = shifts.filter((s) => s.status === "PENDING_APPROVAL");
  const rejectedShifts = shifts.filter((s) => s.status === "REJECTED");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shifts.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-2"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            משמרות בהמתנה
          </span>
          <div className="flex gap-2">
            {pendingShifts.length > 0 && (
              <Badge variant="secondary">{pendingShifts.length} ממתינות</Badge>
            )}
            {rejectedShifts.length > 0 && (
              <Badge variant="destructive">{rejectedShifts.length} נדחו</Badge>
            )}
          </div>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 px-4 pb-4">
        {/* Pending Shifts */}
        {pendingShifts.map((shift) => (
          <div
            key={shift.id}
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-sm font-medium">
                  {shift.date} | {shift.startTime} - {shift.endTime}
                </div>
                {shift.workTypeName && (
                  <div className="text-xs text-muted-foreground">
                    {shift.workTypeName}
                  </div>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  disabled={cancelingId !== null}
                >
                  {cancelingId === shift.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <DialogIcon variant="destructive">
                    <Trash2 className="h-5 w-5" />
                  </DialogIcon>
                  <AlertDialogTitle>ביטול משמרת</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם לבטל את המשמרת מתאריך {shift.date}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>לא</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancel(shift.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    כן, בטל
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}

        {/* Rejected Shifts */}
        {rejectedShifts.map((shift) => (
          <div
            key={shift.id}
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
          >
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {shift.date} | {shift.startTime} - {shift.endTime}
                </div>
                {shift.notesManager && (
                  <div className="mt-1 flex items-start gap-1 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>סיבת הדחייה: {shift.notesManager}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}