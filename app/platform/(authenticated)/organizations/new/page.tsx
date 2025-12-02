// app/platform/(authenticated)/organizations/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Loader2, User } from "lucide-react";
import Link from "next/link";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { createOrganization } from "../../../_actions/organization-actions";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    const result = await createOrganization(formData);

    if (result.success) {
      router.push(`/platform/organizations/${result.organizationId}`);
    } else {
      setError(result.error || "שגיאה ביצירת הארגון");
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/platform/organizations">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ארגון חדש</h1>
          <p className="text-muted-foreground">
            צור ארגון חדש במערכת
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        {/* Organization Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              פרטי הארגון
            </CardTitle>
            <CardDescription>
              מידע בסיסי על הארגון
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">שם הארגון *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="לדוגמה: חברת טכנולוגיה בע״מ"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">אימייל הארגון *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="info@company.com"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalName">שם משפטי (לחשבוניות)</Label>
                <Input
                  id="legalName"
                  name="legalName"
                  placeholder="שם החברה הרשום"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">ח.פ. / מספר עוסק</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  placeholder="123456789"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">תוכנית</Label>
              <Select name="plan" defaultValue="FREE" disabled={isPending}>
                <SelectTrigger id="plan">
                  <SelectValue placeholder="בחר תוכנית" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">חינם</SelectItem>
                  <SelectItem value="BASIC">בסיסי</SelectItem>
                  <SelectItem value="PREMIUM">פרימיום</SelectItem>
                  <SelectItem value="ENTERPRISE">ארגוני</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Admin Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              מנהל ראשי
            </CardTitle>
            <CardDescription>
              פרטי המנהל הראשי של הארגון (יקבל הרשאות Owner)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminName">שם מלא *</Label>
                <Input
                  id="adminName"
                  name="adminName"
                  placeholder="ישראל ישראלי"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">אימייל *</Label>
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">סיסמה *</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                placeholder="לפחות 8 תווים"
                minLength={8}
                required
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                הסיסמה חייבת להכיל לפחות 8 תווים
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                יוצר ארגון...
              </>
            ) : (
              <>
                <Building2 className="ml-2 h-4 w-4" />
                צור ארגון
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild disabled={isPending}>
            <Link href="/platform/organizations">ביטול</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
