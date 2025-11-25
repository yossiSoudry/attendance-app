// lib/validations/shift.ts
import { z } from "zod";

export const shiftFormSchema = z.object({
  employeeId: z.string().uuid({ message: "יש לבחור עובד" }),
  workTypeId: z.string().uuid().nullable().optional(),
  startDate: z.date({ message: "יש לבחור תאריך" }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "פורמט שעה לא תקין" }),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "פורמט שעה לא תקין" }),
  notesManager: z.string().optional(),
});

export type ShiftFormValues = z.infer<typeof shiftFormSchema>;