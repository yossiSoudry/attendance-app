// lib/validations/employee-work-rate.ts
import { z } from "zod";

export const employeeWorkRateSchema = z.object({
  workTypeId: z.string().uuid("יש לבחור סוג עבודה"),
  hourlyRate: z
    .number()
    .min(0, "שכר לשעה חייב להיות חיובי")
    .max(1000, "שכר לשעה לא יכול לעלות על 1000 ₪"),
});

export type EmployeeWorkRateFormValues = z.infer<typeof employeeWorkRateSchema>;

// Schema for batch update (multiple rates at once)
export const employeeWorkRatesBatchSchema = z.object({
  rates: z.array(
    z.object({
      workTypeId: z.string().uuid(),
      hourlyRate: z.number().min(0).max(100000), // in agorot
    })
  ),
});

export type EmployeeWorkRatesBatchValues = z.infer<typeof employeeWorkRatesBatchSchema>;