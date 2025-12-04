// app/platform/(authenticated)/organizations/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Loader2, User, Upload, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";

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

import { createOrganization } from "../../../_actions/organization-actions";

type LogoUpload = {
  secure_url: string;
  public_id: string;
};

export default function NewOrganizationPage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logo, setLogo] = React.useState<LogoUpload | null>(null);

  function handleLogoUpload(result: CloudinaryUploadWidgetResults) {
    if (result.info && typeof result.info !== "string") {
      setLogo({
        secure_url: result.info.secure_url,
        public_id: result.info.public_id,
      });
    }
  }

  function removeLogo() {
    setLogo(null);
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    // Add logo URL to form data if exists
    if (logo) {
      formData.set("logoUrl", logo.secure_url);
    }

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
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>לוגו הארגון</Label>
              <div className="flex items-center gap-4">
                {logo ? (
                  <div className="relative">
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                      <Image
                        src={logo.secure_url}
                        alt="לוגו"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -left-2 -top-2 h-6 w-6"
                      onClick={removeLogo}
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <CldUploadWidget
                    signatureEndpoint="/api/sign-cloudinary-params"
                    options={{
                      folder: "attendance-app/logos",
                      resourceType: "image",
                      maxFiles: 1,
                      clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
                      maxFileSize: 2000000, // 2MB
                      sources: ["local"],
                      cropping: true,
                      croppingAspectRatio: 1,
                      croppingShowDimensions: true,
                      language: "he",
                      text: {
                        he: {
                          or: "או",
                          menu: {
                            files: "מהמחשב",
                          },
                          local: {
                            browse: "בחר קובץ",
                            dd_title_single: "גרור תמונה לכאן",
                          },
                          crop: {
                            title: "חתוך תמונה",
                            crop_btn: "חתוך",
                            skip_btn: "דלג",
                          },
                        },
                      },
                    }}
                    onSuccess={handleLogoUpload}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        disabled={isPending}
                        className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted disabled:opacity-50"
                      >
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">העלה לוגו</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
                <div className="text-sm text-muted-foreground">
                  <p>תמונה מרובעת מומלצת</p>
                  <p>עד 2MB, פורמטים: JPG, PNG, SVG</p>
                </div>
              </div>
            </div>

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

        {/* Actions - Sticky at bottom */}
        <div className="sticky bottom-0 -mx-6 border-t bg-background px-6 py-4">
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
        </div>
      </form>
    </div>
  );
}
