// app/platform/_components/edit-platform-admin-dialog.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updatePlatformAdmin } from "../_actions/platform-admin-actions";

interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
}

interface EditPlatformAdminDialogProps {
  admin: PlatformAdmin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlatformAdminDialog({
  admin,
  open,
  onOpenChange,
}: EditPlatformAdminDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updatePlatformAdmin(admin.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || "שגיאה בעדכון המנהל");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת מנהל פלטפורמה</DialogTitle>
          <DialogDescription>
            עדכן את פרטי המנהל. השאר את שדה הסיסמה ריק אם אינך רוצה לשנות אותה.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                name="name"
                defaultValue={admin.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={admin.email}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">סיסמה חדשה (אופציונלי)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="השאר ריק לשמירת הסיסמה הנוכחית"
                minLength={8}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
