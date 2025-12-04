// app/platform/_components/edit-organization-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Edit, Loader2, X, ImageIcon } from "lucide-react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateOrganization } from "../_actions/organization-actions";

interface Organization {
  id: string;
  name: string;
  email: string;
  legalName: string | null;
  taxId: string | null;
  logoUrl: string | null;
  status: string;
  plan: string;
}

interface EditOrganizationDialogProps {
  organization: Organization;
}

export function EditOrganizationDialog({
  organization,
}: EditOrganizationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(organization.logoUrl);

  function handleLogoUpload(result: CloudinaryUploadWidgetResults) {
    if (result.info && typeof result.info !== "string") {
      setLogoUrl(result.info.secure_url);
    }
  }

  function removeLogo() {
    setLogoUrl(null);
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);

    // Add logo URL to form data
    if (logoUrl) {
      formData.set("logoUrl", logoUrl);
    } else {
      formData.set("logoUrl", "");
    }

    const result = await updateOrganization(organization.id, formData);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setError(result.error || "שגיאה בעדכון הארגון");
    }

    setIsPending(false);
  }

  // Reset logo when dialog opens
  React.useEffect(() => {
    if (open) {
      setLogoUrl(organization.logoUrl);
    }
  }, [open, organization.logoUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>עריכת ארגון</DialogTitle>
          <DialogDescription>
            עדכן את פרטי הארגון
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>לוגו הארגון</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                    <Image
                      src={logoUrl}
                      alt="לוגו"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -left-2 -top-2 h-5 w-5"
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
                    maxFileSize: 2000000,
                    sources: ["local"],
                    cropping: true,
                    croppingAspectRatio: 1,
                    language: "he",
                  }}
                  onSuccess={handleLogoUpload}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      disabled={isPending}
                      className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted disabled:opacity-50"
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="mt-1 text-[10px] text-muted-foreground">העלה</span>
                    </button>
                  )}
                </CldUploadWidget>
              )}
              <p className="text-xs text-muted-foreground">תמונה מרובעת, עד 2MB</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">שם הארגון *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={organization.name}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={organization.email}
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legalName">שם משפטי</Label>
              <Input
                id="legalName"
                name="legalName"
                defaultValue={organization.legalName || ""}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">ח.פ.</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={organization.taxId || ""}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select
                name="status"
                defaultValue={organization.status}
                disabled={isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">פעיל</SelectItem>
                  <SelectItem value="TRIAL">ניסיון</SelectItem>
                  <SelectItem value="SUSPENDED">מושעה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">תוכנית</Label>
              <Select
                name="plan"
                defaultValue={organization.plan}
                disabled={isPending}
              >
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">חינם</SelectItem>
                  <SelectItem value="BASIC">בסיסי</SelectItem>
                  <SelectItem value="PREMIUM">פרימיום</SelectItem>
                  <SelectItem value="ENTERPRISE">ארגוני</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                "שמור שינויים"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
