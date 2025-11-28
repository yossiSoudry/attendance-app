// app/admin/_components/employee-bonuses-dialog.tsx
"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Gift, Loader2, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogIcon } from "@/components/ui/dialog-icon";

import {
  deleteBonus,
  getEmployeeBonuses,
  type BonusWithDetails,
} from "../_actions/bonus-actions";
import { BonusFormDialog } from "./bonus-form-dialog";

type EmployeeBonusesDialogProps = {
  employeeId: string;
  employeeName: string;
  trigger?: React.ReactNode;
};

export function EmployeeBonusesDialog({
  employeeId,
  employeeName,
  trigger,
}: EmployeeBonusesDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [bonuses, setBonuses] = React.useState<BonusWithDetails[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [bonusToDelete, setBonusToDelete] =
    React.useState<BonusWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadBonuses = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getEmployeeBonuses(employeeId);
    setBonuses(data);
    setIsLoading(false);
  }, [employeeId]);

  React.useEffect(() => {
    if (open) {
      loadBonuses();
    }
  }, [open, loadBonuses]);

  function handleDeleteClick(bonus: BonusWithDetails) {
    setBonusToDelete(bonus);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!bonusToDelete) return;

    setIsDeleting(true);
    await deleteBonus(bonusToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setBonusToDelete(null);
    loadBonuses();
  }

  function formatBonusAmount(bonus: BonusWithDetails): string {
    if (bonus.bonusType === "HOURLY" && bonus.amountPerHour) {
      return `₪${bonus.amountPerHour.toFixed(2)} לשעה`;
    }
    if (bonus.bonusType === "ONE_TIME" && bonus.amountFixed) {
      return `₪${bonus.amountFixed.toFixed(2)} חד-פעמי`;
    }
    return "—";
  }

  function formatDateRange(bonus: BonusWithDetails): string {
    if (!bonus.validFrom || !bonus.validTo) return "—";
    const from = format(new Date(bonus.validFrom), "dd/MM/yy", { locale: he });
    const to = format(new Date(bonus.validTo), "dd/MM/yy", { locale: he });
    return `${from} - ${to}`;
  }

  const defaultTrigger = (
    <Button variant="ghost" size="icon" title="ניהול בונוסים">
      <Gift className="h-4 w-4" />
    </Button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[550px]">
          <DialogHeader>
            <DialogIcon variant="success">
              <Gift className="h-5 w-5" />
            </DialogIcon>
            <DialogTitle>ניהול בונוסים - {employeeName}</DialogTitle>
            <DialogDescription>
              הוסף, ערוך או מחק בונוסים לעובד
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <BonusFormDialog
              mode="create"
              employeeId={employeeId}
              onSuccess={loadBonuses}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bonuses.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              אין בונוסים לעובד זה.
              <br />
              <span className="text-xs">
                לחץ על &quot;בונוס חדש&quot; להוספה.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {bonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${
                    bonus.isActive
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      bonus.isActive
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Gift className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatBonusAmount(bonus)}
                      </span>
                      {bonus.isActive && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          פעיל
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateRange(bonus)}
                    </p>
                    {bonus.description && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {bonus.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <BonusFormDialog
                      mode="edit"
                      employeeId={employeeId}
                      bonus={bonus}
                      onSuccess={loadBonuses}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(bonus)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <DialogIcon variant="destructive">
              <Trash2 className="h-5 w-5" />
            </DialogIcon>
            <AlertDialogTitle>מחיקת בונוס</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הבונוס{" "}
              <span className="font-semibold text-foreground">
                {bonusToDelete && formatBonusAmount(bonusToDelete)}
              </span>
              ?
              <br />
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              מחק בונוס
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
