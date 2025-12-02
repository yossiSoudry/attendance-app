// app/admin/_components/employee-form-dialog.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/lib/validations/employee";
import {
  createEmployee,
  updateEmployee,
  type ActionResult,
} from "../_actions/employee-actions";

type EmployeeFormDialogProps = {
  mode: "create" | "edit";
  employee?: {
    id: string;
    fullName: string;
    nationalId: string;
    status: "ACTIVE" | "BLOCKED";
    employmentType: "HOURLY" | "MONTHLY";
    baseHourlyRate: number | null;
    monthlyRate: number | null;
    workDaysPerWeek: number;
    travelAllowanceType: "NONE" | "DAILY" | "MONTHLY";
    travelAllowanceAmount: number | null;
  };
  trigger?: React.ReactNode;
};

export function EmployeeFormDialog({
  mode,
  employee,
  trigger,
}: EmployeeFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      fullName: employee?.fullName ?? "",
      nationalId: employee?.nationalId ?? "",
      status: employee?.status ?? "ACTIVE",
      employmentType: employee?.employmentType ?? "HOURLY",
      baseHourlyRate: employee?.baseHourlyRate
        ? employee.baseHourlyRate / 100
        : 0,
      monthlyRate: employee?.monthlyRate ? employee.monthlyRate / 100 : null,
      workDaysPerWeek: employee?.workDaysPerWeek ?? 5,
      travelAllowanceType: employee?.travelAllowanceType ?? "NONE",
      travelAllowanceAmount: employee?.travelAllowanceAmount
        ? employee.travelAllowanceAmount / 100
        : null,
    },
  });

  const employmentType = form.watch("employmentType");
  const travelAllowanceType = form.watch("travelAllowanceType");

  // איפוס הטופס כשהדיאלוג נפתח
  React.useEffect(() => {
    if (open) {
      form.reset({
        fullName: employee?.fullName ?? "",
        nationalId: employee?.nationalId ?? "",
        status: employee?.status ?? "ACTIVE",
        employmentType: employee?.employmentType ?? "HOURLY",
        baseHourlyRate: employee?.baseHourlyRate
          ? employee.baseHourlyRate / 100
          : 0,
        monthlyRate: employee?.monthlyRate ? employee.monthlyRate / 100 : null,
        workDaysPerWeek: employee?.workDaysPerWeek ?? 5,
        travelAllowanceType: employee?.travelAllowanceType ?? "NONE",
        travelAllowanceAmount: employee?.travelAllowanceAmount
          ? employee.travelAllowanceAmount / 100
          : null,
      });
    }
  }, [open, employee, form]);

  async function onSubmit(values: EmployeeFormValues) {
    setIsPending(true);

    let result: ActionResult;

    if (mode === "create") {
      result = await createEmployee(values);
    } else {
      result = await updateEmployee(employee!.id, values);
    }

    setIsPending(false);

    if (result.success) {
      setOpen(false);
      form.reset();
    } else {
      // הצגת שגיאות בשדות הרלוונטיים
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof EmployeeFormValues, {
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
        עובד חדש
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "יצירת עובד חדש" : "עריכת עובד"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "הזן את פרטי העובד החדש"
              : "ערוך את פרטי העובד"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מלא</FormLabel>
                    <FormControl>
                      <Input placeholder="ישראל ישראלי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תעודת זהות</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        dir="ltr"
                        className="text-left"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">פעיל</SelectItem>
                        <SelectItem value="BLOCKED">חסום</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Employment Type & Salary */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">סוג העסקה ושכר</h4>

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג העסקה</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג העסקה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HOURLY">שעתי</SelectItem>
                        <SelectItem value="MONTHLY">חודשי</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseHourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {employmentType === "HOURLY"
                        ? "שכר לשעה (₪)"
                        : "שכר שעתי בסיסי (₪)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="35.00"
                        dir="ltr"
                        className="text-left"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    {employmentType === "MONTHLY" && (
                      <FormDescription>
                        משמש לחישוב שעות נוספות
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {employmentType === "MONTHLY" && (
                <FormField
                  control={form.control}
                  name="monthlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שכר חודשי (₪)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="10000.00"
                          dir="ltr"
                          className="text-left"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="workDaysPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ימי עבודה בשבוע</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(parseInt(val))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר ימי עבודה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                          <SelectItem key={days} value={days.toString()}>
                            {days} ימים
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Travel Allowance */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">דמי נסיעות</h4>

              <FormField
                control={form.control}
                name="travelAllowanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סוג תשלום נסיעות</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג תשלום" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">ללא</SelectItem>
                        <SelectItem value="DAILY">יומי</SelectItem>
                        <SelectItem value="MONTHLY">חודשי קבוע</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {travelAllowanceType !== "NONE" && (
                <FormField
                  control={form.control}
                  name="travelAllowanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {travelAllowanceType === "DAILY"
                          ? "סכום ליום (₪)"
                          : "סכום חודשי (₪)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={
                            travelAllowanceType === "DAILY" ? "25.00" : "500.00"
                          }
                          dir="ltr"
                          className="text-left"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null
                            )
                          }
                        />
                      </FormControl>
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
                {mode === "create" ? "צור עובד" : "שמור שינויים"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
