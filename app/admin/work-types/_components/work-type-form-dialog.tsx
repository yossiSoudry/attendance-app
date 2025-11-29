// app/admin/work-types/_components/work-type-form-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Loader2, Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogIcon } from "@/components/ui/dialog-icon";

import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  workTypeFormSchema,
  type WorkTypeFormValues,
} from "@/lib/validations/work-type";
import {
  createWorkType,
  updateWorkType,
  type ActionResult,
} from "../_actions/work-type-actions";

type WorkTypeFormDialogProps = {
  mode: "create" | "edit";
  workType?: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
  };
  trigger?: React.ReactNode;
};

export function WorkTypeFormDialog({
  mode,
  workType,
  trigger,
}: WorkTypeFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<WorkTypeFormValues>({
    resolver: zodResolver(workTypeFormSchema),
    defaultValues: {
      name: workType?.name ?? "",
      description: workType?.description ?? "",
      isDefault: workType?.isDefault ?? false,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: workType?.name ?? "",
        description: workType?.description ?? "",
        isDefault: workType?.isDefault ?? false,
      });
    }
  }, [open, workType, form]);

  async function onSubmit(values: WorkTypeFormValues) {
    setIsPending(true);

    let result: ActionResult;

    if (mode === "create") {
      result = await createWorkType(values);
    } else {
      result = await updateWorkType(workType!.id, values);
    }

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof WorkTypeFormValues, {
            message: messages[0],
          });
        });
      }
    }
  }

  const defaultTrigger =
    mode === "create" ? (
      <Button className="h-8">
        <Plus className="ml-2 h-4 w-4" />
        סוג עבודה חדש
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogIcon>
            <Briefcase className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>
            {mode === "create" ? "יצירת סוג עבודה חדש" : "עריכת סוג עבודה"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "הגדר סוג עבודה חדש במערכת"
              : "ערוך את פרטי סוג העבודה"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם סוג העבודה</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: עבודה רגילה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תיאור קצר של סוג העבודה..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>ברירת מחדל</FormLabel>
                    <FormDescription>
                      סוג עבודה זה ייבחר אוטומטית בעת פתיחת משמרת
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "צור סוג עבודה" : "שמור שינויים"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
