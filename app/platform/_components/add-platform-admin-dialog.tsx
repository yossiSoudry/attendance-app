// app/platform/_components/add-platform-admin-dialog.tsx
"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createPlatformAdmin } from "../_actions/platform-admin-actions";

export function AddPlatformAdminDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createPlatformAdmin(formData);

    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "שגיאה ביצירת המנהל");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="ml-2 h-4 w-4" />
          מנהל חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>הוספת מנהל פלטפורמה</DialogTitle>
          <DialogDescription>
            צור מנהל פלטפורמה חדש שיוכל לנהל את כל הארגונים במערכת.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                name="name"
                placeholder="שם מלא"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="לפחות 8 תווים"
                minLength={8}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              צור מנהל
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
