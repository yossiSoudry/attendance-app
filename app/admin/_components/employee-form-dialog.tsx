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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    baseHourlyRate: number | null;
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
      baseHourlyRate: employee?.baseHourlyRate
        ? employee.baseHourlyRate / 100
        : 0,
    },
  });

  // איפוס הטופס כשהדיאלוג נפתח
  React.useEffect(() => {
    if (open) {
      form.reset({
        fullName: employee?.fullName ?? "",
        nationalId: employee?.nationalId ?? "",
        status: employee?.status ?? "ACTIVE",
        baseHourlyRate: employee?.baseHourlyRate
          ? employee.baseHourlyRate / 100
          : 0,
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
      <Button>
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
      <DialogContent className="sm:max-w-[425px]">
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
              name="baseHourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שכר לשעה (₪)</FormLabel>
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