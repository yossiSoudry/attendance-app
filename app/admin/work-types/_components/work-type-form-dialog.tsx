// app/admin/work-types/_components/work-type-form-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Loader2, Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/animate-ui/components/radix/checkbox";
import {
  workTypeFormSchema,
  type WorkTypeFormValues,
  rateTypes,
  rateTypeLabels,
  type RateType,
} from "@/lib/validations/work-type";
import {
  createWorkType,
  updateWorkType,
  type ActionResult,
} from "../_actions/work-type-actions";
import type { WorkTypeRateType } from "@prisma/client";

type WorkTypeFormDialogProps = {
  mode: "create" | "edit";
  workType?: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    rateType: WorkTypeRateType;
    rateValue: number;
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
      rateType: (workType?.rateType as RateType) ?? "BASE_RATE",
      rateValue: workType?.rateValue
        ? workType.rateType === "BONUS_PERCENT"
          ? workType.rateValue / 100 // Convert from stored format (2500 -> 25)
          : workType.rateValue / 100 // Convert from agorot to shekels
        : 0,
    },
  });

  const watchedRateType = useWatch({
    control: form.control,
    name: "rateType",
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: workType?.name ?? "",
        description: workType?.description ?? "",
        isDefault: workType?.isDefault ?? false,
        rateType: (workType?.rateType as RateType) ?? "BASE_RATE",
        rateValue: workType?.rateValue
          ? workType.rateType === "BONUS_PERCENT"
            ? workType.rateValue / 100
            : workType.rateValue / 100
          : 0,
      });
    }
  }, [open, workType, form]);

  async function onSubmit(values: WorkTypeFormValues) {
    setIsPending(true);

    // Convert values for storage
    const dataToSend = {
      ...values,
      rateValue:
        values.rateType === "BASE_RATE"
          ? 0
          : values.rateType === "BONUS_PERCENT"
            ? Math.round(values.rateValue * 100) // 25 -> 2500
            : Math.round(values.rateValue * 100), // Convert shekels to agorot
    };

    let result: ActionResult;

    if (mode === "create") {
      result = await createWorkType(dataToSend);
    } else {
      result = await updateWorkType(workType!.id, dataToSend);
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

            <div className="space-y-4 rounded-md border p-4">
              <h4 className="text-sm font-medium">הגדרות תעריף</h4>

              <FormField
                control={form.control}
                name="rateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג תעריף</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג תעריף" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rateTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {rateTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchedRateType === "BASE_RATE" &&
                        "ישתמש בשכר הבסיסי של העובד"}
                      {watchedRateType === "FIXED" &&
                        "תעריף קבוע לשעה עבור סוג עבודה זה"}
                      {watchedRateType === "BONUS_PERCENT" &&
                        "תוספת אחוזים על השכר הבסיסי של העובד"}
                      {watchedRateType === "BONUS_FIXED" &&
                        "תוספת קבועה לשעה על השכר הבסיסי"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRateType !== "BASE_RATE" && (
                <FormField
                  control={form.control}
                  name="rateValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedRateType === "BONUS_PERCENT"
                          ? "אחוז תוספת"
                          : watchedRateType === "FIXED"
                            ? "תעריף לשעה (₪)"
                            : "תוספת לשעה (₪)"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step={watchedRateType === "BONUS_PERCENT" ? "1" : "0.01"}
                            min="0"
                            placeholder={
                              watchedRateType === "BONUS_PERCENT"
                                ? "25"
                                : "50"
                            }
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                          {watchedRateType === "BONUS_PERCENT" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              %
                            </span>
                          )}
                          {(watchedRateType === "FIXED" ||
                            watchedRateType === "BONUS_FIXED") && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ₪
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        {watchedRateType === "BONUS_PERCENT" &&
                          `לדוגמה: 25% תוספת על שכר בסיסי של 50₪ = 62.5₪ לשעה`}
                        {watchedRateType === "FIXED" &&
                          "התעריף יחליף את השכר הבסיסי של העובד עבור משמרות מסוג זה"}
                        {watchedRateType === "BONUS_FIXED" &&
                          `לדוגמה: תוספת של 10₪ על שכר בסיסי של 50₪ = 60₪ לשעה`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
