// app/employee/_components/retro-shift-form-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, Clock, Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { submitRetroShift } from "../_actions/retro-shift-actions";

// ========================================
// Types
// ========================================

type WorkType = {
  id: string;
  name: string;
  isDefault: boolean;
};

type RetroShiftFormDialogProps = {
  employeeId: string;
  workTypes: WorkType[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

// ========================================
// Validation Schema
// ========================================

const formSchema = z
  .object({
    workTypeId: z.string().optional(),
    date: z.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "פורמט שעה לא תקין"),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    {
      message: "שעת סיום חייבת להיות אחרי שעת התחלה",
      path: ["endTime"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// ========================================
// Component
// ========================================

export function RetroShiftFormDialog({
  employeeId,
  workTypes,
  trigger,
  onSuccess,
}: RetroShiftFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  // Find default work type
  const defaultWorkType = workTypes.find((wt) => wt.isDefault);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workTypeId: defaultWorkType?.id ?? "",
      date: undefined,
      startTime: "08:00",
      endTime: "17:00",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        workTypeId: defaultWorkType?.id ?? "",
        date: undefined,
        startTime: "08:00",
        endTime: "17:00",
        notes: "",
      });
    }
  }, [open, form, defaultWorkType?.id]);

  async function onSubmit(values: FormValues) {
    setIsPending(true);

    const result = await submitRetroShift(employeeId, {
      workTypeId: values.workTypeId || undefined,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      notes: values.notes,
    });

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
      onSuccess?.();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            message: messages[0],
          });
        });
      } else {
        form.setError("root", { message: result.message });
      }
    }
  }

  // Disable future dates
  const disableFutureDates = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Plus className="h-4 w-4" />
      דיווח משמרת
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-center gap-2">
            <Clock className="h-5 w-5" />
            דיווח משמרת רטרואקטיבי
          </DialogTitle>
          <DialogDescription>
            דווח על משמרת שעבדת בעבר. המשמרת תישלח לאישור המנהל.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Work Type */}
            {workTypes.length > 0 && (
              <FormField
                control={form.control}
                name="workTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג עבודה</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג עבודה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workTypes.map((wt) => (
                          <SelectItem key={wt.id} value={wt.id}>
                            {wt.name}
                            {wt.isDefault && " (ברירת מחדל)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "EEEE, d בMMMM yyyy", {
                              locale: he,
                            })
                          ) : (
                            <span>בחר תאריך</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={disableFutureDates}
                        locale={he}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>ניתן לבחור רק תאריכים בעבר</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת התחלה</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className="text-center"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שעת סיום</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className="text-center"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="סיבה לדיווח רטרואקטיבי..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    הסבר למנהל למה לא דיווחת בזמן אמת
                  </FormDescription>
                  <FormMessage />
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
                שלח לאישור
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
