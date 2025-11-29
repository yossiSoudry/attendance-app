// app/admin/_components/edit-pending-shift-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, Loader2, Pencil } from "lucide-react";
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
import { DialogIcon } from "@/components/ui/dialog-icon";
import { cn } from "@/lib/utils";

import {
  updatePendingShift,
  type PendingShiftDetails,
} from "../_actions/approval-actions";

// ========================================
// Types
// ========================================

type WorkType = {
  id: string;
  name: string;
};

type EditPendingShiftDialogProps = {
  shift: PendingShiftDetails;
  workTypes: WorkType[];
  managerId: string;
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
    notesManager: z.string().max(500).optional(),
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
// Helper to parse date string (dd/mm/yyyy or dd.mm.yyyy)
// ========================================

function parseHebrewDate(dateStr: string): Date {
  const parts = dateStr.split(/[./]/);
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
}

// ========================================
// Component
// ========================================

export function EditPendingShiftDialog({
  shift,
  workTypes,
  managerId,
  onSuccess,
}: EditPendingShiftDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  // Parse initial values from shift
  const initialDate = parseHebrewDate(shift.date);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workTypeId: "", // Will be set on open
      date: initialDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      notesManager: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        workTypeId: workTypes.find((wt) => wt.name === shift.workTypeName)?.id ?? "",
        date: parseHebrewDate(shift.date),
        startTime: shift.startTime,
        endTime: shift.endTime,
        notesManager: "",
      });
    }
  }, [open, shift, workTypes, form]);

  async function onSubmit(values: FormValues) {
    setIsPending(true);

    const result = await updatePendingShift(shift.id, managerId, {
      workTypeId: values.workTypeId || undefined,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      notesManager: values.notesManager,
    });

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      onSuccess?.();
    } else {
      form.setError("root", { message: result.message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
          title="ערוך"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogIcon>
            <Pencil className="h-5 w-5" />
          </DialogIcon>
          <DialogTitle>עריכת משמרת - {shift.employeeName}</DialogTitle>
          <DialogDescription>
            ערוך את פרטי המשמרת לפני האישור
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
                        <SelectItem value="">ללא</SelectItem>
                        {workTypes.map((wt) => (
                          <SelectItem key={wt.id} value={wt.id}>
                            {wt.name}
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
                        locale={he}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

            {/* Manager Notes */}
            <FormField
              control={form.control}
              name="notesManager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערת מנהל (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערה לעובד על השינויים..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
                שמור ואשר
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}