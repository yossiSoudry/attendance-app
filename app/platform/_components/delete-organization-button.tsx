// app/platform/_components/delete-organization-button.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { deleteOrganization } from "../_actions/organization-actions";

interface DeleteOrganizationButtonProps {
  id: string;
  name: string;
}

export function DeleteOrganizationButton({
  id,
  name,
}: DeleteOrganizationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");

  const canDelete = confirmText === name;

  async function handleDelete() {
    if (!canDelete) return;

    setIsPending(true);
    const result = await deleteOrganization(id);

    if (result.success) {
      router.push("/platform/organizations");
    } else {
      setIsPending(false);
      // Could show error toast here
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>מחיקת ארגון</AlertDialogTitle>
          <AlertDialogDescription>
            האם אתה בטוח שברצונך למחוק את הארגון &quot;{name}&quot;?
            <br />
            <strong>פעולה זו בלתי הפיכה</strong> ותמחק את כל הנתונים הקשורים לארגון כולל עובדים, משמרות, וכל המידע האחר.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm">
            הקלד את שם הארגון לאישור: <strong>{name}</strong>
          </Label>
          <Input
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={name}
            disabled={isPending}
          />
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending}>ביטול</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מוחק...
              </>
            ) : (
              <>
                <Trash2 className="ml-2 h-4 w-4" />
                מחק ארגון
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
