"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteAdminSchema, type InviteAdminInput } from "@/lib/validations/admin-auth";
import { inviteAdmin } from "../_actions/admin-actions";
import type { AdminRole } from "@prisma/client";

interface Department {
  id: string;
  name: string;
}

interface InviteAdminDialogProps {
  currentUserRole: AdminRole;
  departments: Department[];
}

export function InviteAdminDialog({ currentUserRole, departments }: InviteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<InviteAdminInput>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
      role: "MANAGER",
      departmentId: null,
    },
  });

  function onSubmit(data: InviteAdminInput) {
    startTransition(async () => {
      const result = await inviteAdmin(data);

      if (result.success && result.inviteLink) {
        setInviteLink(result.inviteLink);
      } else {
        // Show error - in production, use toast
        alert(result.message);
      }
    });
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
      setInviteLink(null);
      setCopied(false);
    }
  }

  const canInviteAdmin = currentUserRole === "OWNER";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          הזמן מנהל חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>הזמנת מנהל חדש</DialogTitle>
          <DialogDescription>
            שלח הזמנה בדוא״ל או שתף קישור הרשמה
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">קישור ההזמנה:</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-2">הקישור הועתק!</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              הקישור תקף ל-7 ימים. המשתמש יכול להירשם עם אימייל/סיסמה או עם Google.
            </p>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>סגור</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימייל</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="manager@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תפקיד</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר תפקיד" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MANAGER">מנהל מחלקה</SelectItem>
                        {canInviteAdmin && (
                          <SelectItem value="ADMIN">מנהל מערכת</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("role") === "MANAGER" && departments.length > 0 && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מחלקה</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר מחלקה (אופציונלי)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "שלח הזמנה"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
