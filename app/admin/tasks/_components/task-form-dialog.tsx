// app/admin/tasks/_components/task-form-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, Plus, Clock, Repeat } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  taskFormSchema,
  type TaskFormValues,
  recurrenceTypeLabels,
  weekDays,
  type RecurrenceTypeValue,
} from "@/lib/validations/task";
import { createTask, updateTask, type TaskWithEmployee } from "../_actions/task-actions";

type Employee = {
  id: string;
  fullName: string;
};

type TaskFormDialogProps =
  | {
      mode: "create";
      task?: never;
      employees: Employee[];
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }
  | {
      mode: "edit";
      task: TaskWithEmployee;
      employees: Employee[];
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    };

export function TaskFormDialog({
  mode,
  task,
  employees,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TaskFormDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [showScheduling, setShowScheduling] = React.useState(
    Boolean(task?.scheduledDate || (task?.recurrenceType && task.recurrenceType !== "NONE"))
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      employeeId: task?.employeeId ?? "",
      title: task?.title ?? "",
      description: task?.description ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      requiresDocumentUpload: task?.requiresDocumentUpload ?? false,
      managerNote: task?.managerNote ?? "",
      scheduledDate: task?.scheduledDate ? new Date(task.scheduledDate) : null,
      recurrenceType: (task?.recurrenceType as RecurrenceTypeValue) ?? "NONE",
      recurrenceValue: task?.recurrenceValue ?? null,
      recurrenceEndDate: task?.recurrenceEndDate ? new Date(task.recurrenceEndDate) : null,
    },
  });

  const isPending = form.formState.isSubmitting;
  const watchRecurrenceType = form.watch("recurrenceType");

  async function onSubmit(values: TaskFormValues) {
    try {
      let result;
      if (mode === "edit" && task) {
        result = await updateTask(task.id, values);
      } else {
        result = await createTask(values);
      }

      if (!result.success) {
        console.error("Failed to save task:", result.error);
        return;
      }

      form.reset();
      onOpenChange?.(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "משימה חדשה" : "עריכת משימה"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "הקצה משימה חדשה לעובד."
            : "ערוך את פרטי המשימה."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Employee Select */}
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>עובד</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={mode === "edit"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כותרת המשימה</FormLabel>
                <FormControl>
                  <Input placeholder="לדוגמה: השלמת טופס 101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="פירוט נוסף על המשימה..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>תאריך יעד</FormLabel>
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
                        {field.value
                          ? format(field.value, "PPP", { locale: he })
                          : "בחר תאריך (אופציונלי)"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
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

          {/* Requires Document Upload */}
          <FormField
            control={form.control}
            name="requiresDocumentUpload"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>נדרש העלאת מסמך</FormLabel>
                  <FormDescription>
                    העובד יידרש לצרף מסמך להשלמת המשימה
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Scheduling Section */}
          <Collapsible open={showScheduling} onOpenChange={setShowScheduling}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
              >
                <Clock className="ml-2 h-4 w-4" />
                תזמון משימה
                {showScheduling && (
                  <span className="mr-auto text-xs text-muted-foreground">
                    לחץ לסגירה
                  </span>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Scheduled Date */}
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>תאריך הפעלה</FormLabel>
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
                            {field.value
                              ? format(field.value, "PPP", { locale: he })
                              : "מיידי (ללא תזמון)"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          locale={he}
                          initialFocus
                        />
                        {field.value && (
                          <div className="p-2 border-t">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => field.onChange(null)}
                            >
                              בטל תזמון (מיידי)
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      המשימה תופיע לעובד רק בתאריך זה
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurrence Type */}
              <FormField
                control={form.control}
                name="recurrenceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      חזרה
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג חזרה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(recurrenceTypeLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurrence Value - Day of Week */}
              {(watchRecurrenceType === "WEEKLY" ||
                watchRecurrenceType === "BIWEEKLY") && (
                <FormField
                  control={form.control}
                  name="recurrenceValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>יום בשבוע</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר יום" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem
                              key={day.value}
                              value={day.value.toString()}
                            >
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Recurrence Value - Day of Month */}
              {watchRecurrenceType === "MONTHLY_DATE" && (
                <FormField
                  control={form.control}
                  name="recurrenceValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תאריך בחודש</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר תאריך" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(
                            (day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        אם התאריך לא קיים בחודש מסוים, המשימה תיווצר ביום האחרון
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Recurrence End Date */}
              {watchRecurrenceType !== "NONE" && (
                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>סיום חזרה</FormLabel>
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
                              {field.value
                                ? format(field.value, "PPP", { locale: he })
                                : "ללא הגבלה"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            locale={he}
                            initialFocus
                          />
                          {field.value && (
                            <div className="p-2 border-t">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => field.onChange(null)}
                              >
                                ללא הגבלה
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        לאחר תאריך זה לא ייווצרו משימות חדשות
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Manager Note */}
          <FormField
            control={form.control}
            name="managerNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>הערת מנהל</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="הערה פנימית (לא תוצג לעובד)..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>הערה זו גלויה רק למנהלים</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "שומר..."
                : mode === "create"
                  ? "צור משימה"
                  : "שמור שינויים"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          משימה חדשה
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
