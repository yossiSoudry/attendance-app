// lib/validations/casual-worker-entry.ts
import { z } from "zod";

export const casualWorkerEntryFormSchema = z
  .object({
    workerName: z
      .string()
      .min(2, { message: "שם העובד חייב להכיל לפחות 2 תווים" })
      .max(100, { message: "שם העובד לא יכול להכיל יותר מ-100 תווים" }),
    workDate: z.date({ message: "יש לבחור תאריך" }),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "שעת התחלה לא תקינה",
    }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "שעת סיום לא תקינה",
    }),
    notes: z.string().max(500, { message: "הערות לא יכולות להכיל יותר מ-500 תווים" }).optional(),
  })
  .refine(
    (data) => {
      // Validate that shift duration is reasonable (max 16 hours)
      // Allows overnight shifts (e.g., 17:00 to 01:15)
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // If end time is "before" start time, it's an overnight shift
      // Calculate duration accounting for crossing midnight
      const duration = endMinutes > startMinutes
        ? endMinutes - startMinutes
        : (24 * 60 - startMinutes) + endMinutes; // Overnight shift

      // Duration must be positive and not exceed 16 hours
      return duration > 0 && duration <= 16 * 60;
    },
    {
      message: "משמרת לא יכולה להיות ארוכה מ-16 שעות",
      path: ["endTime"],
    }
  );

export type CasualWorkerEntryFormValues = z.infer<typeof casualWorkerEntryFormSchema>;

/**
 * Calculate duration in minutes from start and end time strings
 * Supports overnight shifts (e.g., 17:00 to 01:15)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // If end time is "before" start time, it's an overnight shift
  if (endMinutes <= startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes;
  }
  return endMinutes - startMinutes;
}

/**
 * Format minutes to HH:MM display string
 */
export function formatMinutesToDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}
