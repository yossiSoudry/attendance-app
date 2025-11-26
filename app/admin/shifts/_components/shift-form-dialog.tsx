// app/admin/shifts/_components/shift-form-dialog.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Loader2, Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

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

import { shiftFormSchema, type ShiftFormValues } from "@/lib/validations/shift";
import {
  createShift,
  updateShift,
  type ActionResult,
} from "../_actions/shift-actions";

type ShiftFormDialogProps = {
  mode: "create" | "edit";
  shift?: {
    id: string;
    employeeId: string;
    workTypeId: string | null;
    startTime: string;
    endTime: string | null;
    notesManager: string | null;
  };
  employees: { label: string; value: string }[];
  workTypes?: { label: string; value: string }[];
  trigger?: React.ReactNode;
};

export function ShiftFormDialog({
  mode,
  shift,
  employees,
  workTypes = [],
  trigger,
}: ShiftFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const defaultDate = React.useMemo(
    () => (shift?.startTime ? new Date(shift.startTime) : new Date()),
    [shift]
  );

  const defaultStartTime = React.useMemo(
    () =>
      shift?.startTime ? format(new Date(shift.startTime), "HH:mm") : "09:00",
    [shift]
  );

  const defaultEndTime = React.useMemo(
    () => (shift?.endTime ? format(new Date(shift.endTime), "HH:mm") : "17:00"),
    [shift]
  );

  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      employeeId: shift?.employeeId ?? "",
      workTypeId: shift?.workTypeId ?? undefined,
      startDate: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      notesManager: shift?.notesManager ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        employeeId: shift?.employeeId ?? "",
        workTypeId: shift?.workTypeId ?? undefined,
        startDate: defaultDate,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        notesManager: shift?.notesManager ?? "",
      });
    }
  }, [open, shift, form, defaultDate, defaultStartTime, defaultEndTime]);

  async function onSubmit(values: ShiftFormValues) {
    setIsPending(true);

    let result: ActionResult;

    if (mode === "create") {
      result = await createShift(values);
    } else {
      result = await updateShift(shift!.id, values);
    }

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof ShiftFormValues, {
            message: messages[0],
          });
        });
      }
    }
  }

  const defaultTrigger =
    mode === "create" ? (
      <Button variant="gradient">
        <Plus className="ml-2 h-4 w-4" />
        צור משמרת
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-8" asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "יצירת משמרת חדשה" : "עריכת משמרת"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "הזן את פרטי המשמרת החדשה"
              : "ערוך את פרטי המשמרת"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>עובד</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר עובד" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.value} value={emp.value}>
                          {emp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {workTypes.length > 0 && (
              <FormField
                control={form.control}
                name="workTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג עבודה (אופציונלי)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג עבודה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workTypes.map((wt) => (
                          <SelectItem key={wt.value} value={wt.value}>
                            {wt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>תאריך</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: he })
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
                        dir="ltr"
                        className="text-left"
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
                        dir="ltr"
                        className="text-left"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notesManager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות למשמרת..."
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
                {mode === "create" ? "צור משמרת" : "שמור שינויים"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
