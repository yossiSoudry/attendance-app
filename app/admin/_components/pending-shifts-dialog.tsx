// app/admin/_components/pending-shifts-dialog.tsx
"use client";

import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  MessageSquare,
  X,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogIcon } from "@/components/ui/dialog-icon";

import {
  approveAllPendingShifts,
  approveShift,
  getPendingShifts,
  rejectShift,
  type PendingShiftDetails,
} from "../_actions/approval-actions";
import { EditPendingShiftDialog } from "./edit-pending-shift-dialog";

// ========================================
// Types
// ========================================

type WorkType = {
  id: string;
  name: string;
};

type PendingShiftsDialogProps = {
  managerId: string;
  initialCount?: number;
  workTypes?: WorkType[];
  trigger?: React.ReactNode;
};

// ========================================
// Component
// ========================================

export function PendingShiftsDialog({
  managerId,
  initialCount = 0,
  workTypes = [],
  trigger,
}: PendingShiftsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [shifts, setShifts] = React.useState<PendingShiftDetails[]>([]);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectingShift, setRejectingShift] =
    React.useState<PendingShiftDetails | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  // Load shifts
  const loadShifts = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getPendingShifts();
    setShifts(data);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    if (open) {
      loadShifts();
    }
  }, [open, loadShifts]);

  // Approve single shift
  async function handleApprove(shiftId: string) {
    setProcessingId(shiftId);
    const result = await approveShift(shiftId, managerId);
    setProcessingId(null);

    if (result.success) {
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    }
  }

  // Open reject dialog
  function handleRejectClick(shift: PendingShiftDetails) {
    setRejectingShift(shift);
    setRejectReason("");
    setRejectDialogOpen(true);
  }

  // Confirm reject
  async function handleRejectConfirm() {
    if (!rejectingShift || !rejectReason.trim()) return;

    setProcessingId(rejectingShift.id);
    setRejectDialogOpen(false);

    const result = await rejectShift(
      rejectingShift.id,
      managerId,
      rejectReason
    );

    setProcessingId(null);
    setRejectingShift(null);
    setRejectReason("");

    if (result.success) {
      setShifts((prev) => prev.filter((s) => s.id !== rejectingShift.id));
    }
  }

  // Approve all
  async function handleApproveAll() {
    setProcessingId("all");
    const result = await approveAllPendingShifts(managerId);
    setProcessingId(null);

    if (result.success) {
      setShifts([]);
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative gap-2">
      <Clock className="h-4 w-4" />
      משמרות ממתינות
      {initialCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
        >
          {initialCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogIcon variant="warning">
              <Clock className="h-5 w-5" />
            </DialogIcon>
            <DialogTitle className="flex items-center gap-2">
              משמרות ממתינות לאישור
              {shifts.length > 0 && (
                <Badge variant="secondary">{shifts.length}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              אשר או דחה משמרות רטרואקטיביות שדווחו על ידי עובדים
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCheck className="mb-2 h-12 w-12 text-emerald-500" />
              <p className="text-lg font-medium">אין משמרות ממתינות</p>
              <p className="text-sm text-muted-foreground">
                כל המשמרות אושרו
              </p>
            </div>
          ) : (
            <>
              {/* Approve All Button */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleApproveAll}
                  disabled={processingId !== null}
                  className="gap-2"
                >
                  {processingId === "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  אשר הכל ({shifts.length})
                </Button>
              </div>

              {/* Shifts List */}
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Shift Info */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {shift.employeeName}
                            </span>
                            {shift.workTypeName && (
                              <Badge variant="outline" className="text-xs">
                                {shift.workTypeName}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              יום {shift.dayOfWeek}, {shift.date}
                            </span>
                            <span dir="ltr">
                              {shift.startTime} - {shift.endTime}
                            </span>
                            <span>({shift.duration} שעות)</span>
                          </div>

                          {shift.notesEmployee && (
                            <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/50 p-2 text-sm">
                              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <span>{shift.notesEmployee}</span>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            נשלח ב-{shift.createdAt}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <EditPendingShiftDialog
                            shift={shift}
                            workTypes={workTypes}
                            managerId={managerId}
                            onSuccess={loadShifts}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700"
                            onClick={() => handleApprove(shift.id)}
                            disabled={processingId !== null}
                            title="אשר"
                          >
                            {processingId === shift.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRejectClick(shift)}
                            disabled={processingId !== null}
                            title="דחה"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <DialogIcon variant="destructive">
              <AlertCircle className="h-5 w-5" />
            </DialogIcon>
            <AlertDialogTitle>
              דחיית משמרת
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rejectingShift && (
                <>
                  האם לדחות את המשמרת של{" "}
                  <strong>{rejectingShift.employeeName}</strong> מתאריך{" "}
                  <strong>{rejectingShift.date}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <label className="mb-2 block text-sm font-medium">
              סיבת הדחייה *
            </label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="נא לציין את סיבת הדחייה..."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              דחה משמרת
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}