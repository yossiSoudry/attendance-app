// lib/validations/task.ts
import { z } from "zod";

export const taskStatuses = ["OPEN", "COMPLETED", "POSTPONED", "CANCELED"] as const;
export type TaskStatusType = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatusType, string> = {
  OPEN: "פתוח",
  COMPLETED: "הושלם",
  POSTPONED: "נדחה",
  CANCELED: "בוטל",
};

export const taskStatusColors: Record<TaskStatusType, string> = {
  OPEN: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  POSTPONED: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  CANCELED: "bg-red-500/10 text-red-600 border-red-500/30",
};

// Recurrence types
export const recurrenceTypes = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY_DATE",
  "MONTHLY_DAY",
] as const;
export type RecurrenceTypeValue = (typeof recurrenceTypes)[number];

export const recurrenceTypeLabels: Record<RecurrenceTypeValue, string> = {
  NONE: "ללא חזרה",
  DAILY: "כל יום",
  WEEKLY: "כל שבוע",
  BIWEEKLY: "כל שבועיים",
  MONTHLY_DATE: "כל חודש (תאריך)",
  MONTHLY_DAY: "כל חודש (יום)",
};

export const weekDays = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
] as const;

export const taskFormSchema = z.object({
  employeeId: z.string().uuid("יש לבחור עובד"),
  title: z
    .string()
    .min(2, "כותרת המשימה חייבת להכיל לפחות 2 תווים")
    .max(200, "כותרת המשימה יכולה להכיל עד 200 תווים"),
  description: z
    .string()
    .max(1000, "התיאור יכול להכיל עד 1000 תווים")
    .optional()
    .or(z.literal("")),
  dueDate: z.date().optional().nullable(),
  requiresDocumentUpload: z.boolean(),
  managerNote: z
    .string()
    .max(500, "הערה יכולה להכיל עד 500 תווים")
    .optional()
    .or(z.literal("")),
  // Scheduling fields
  scheduledDate: z.date().optional().nullable(),
  // Recurrence fields
  recurrenceType: z.enum(recurrenceTypes),
  recurrenceValue: z.number().optional().nullable(),
  recurrenceEndDate: z.date().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatuses),
  employeeNote: z
    .string()
    .max(500, "הערה יכולה להכיל עד 500 תווים")
    .optional()
    .or(z.literal("")),
});

export type UpdateTaskStatusValues = z.infer<typeof updateTaskStatusSchema>;
