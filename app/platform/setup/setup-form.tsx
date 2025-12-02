// app/platform/setup/setup-form.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { setupPlatformAdmin } from "../_actions/platform-auth-actions";

export function SetupForm() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    const result = await setupPlatformAdmin(formData);

    if (result.success) {
      router.push("/platform/login");
    } else {
      setError(result.error || "שגיאה ביצירת החשבון");
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">הגדרה ראשונית</CardTitle>
        <CardDescription>
          צור את חשבון בעל הפלטפורמה הראשון
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם מלא</Label>
            <Input
              id="name"
              name="name"
              placeholder="ישראל ישראלי"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@platform.com"
              required
              autoComplete="email"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="לפחות 8 תווים"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              הסיסמה חייבת להכיל לפחות 8 תווים
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                יוצר חשבון...
              </>
            ) : (
              "צור חשבון"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
