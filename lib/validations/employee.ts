// lib/validations/employee.ts
import { z } from "zod";

export const employeeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "שם חייב להכיל לפחות 2 תווים" })
    .max(100, { message: "שם לא יכול להכיל יותר מ-100 תווים" }),
  nationalId: z
    .string()
    .min(5, { message: "תעודת זהות חייבת להכיל לפחות 5 ספרות" })
    .max(15, { message: "תעודת זהות לא יכולה להכיל יותר מ-15 ספרות" })
    .regex(/^\d+$/, { message: "תעודת זהות חייבת להכיל ספרות בלבד" }),
  status: z.enum(["ACTIVE", "BLOCKED"]),

  // Employment type
  employmentType: z.enum(["HOURLY", "MONTHLY"]),
  baseHourlyRate: z
    .number()
    .min(0, { message: "שכר לא יכול להיות שלילי" })
    .max(100000, { message: "שכר לא יכול לעלות על 1000 ₪ לשעה" }),
  monthlyRate: z
    .number()
    .min(0, { message: "שכר לא יכול להיות שלילי" })
    .max(10000000, { message: "שכר חודשי לא יכול לעלות על 100,000 ₪" })
    .nullable()
    .optional(),
  workDaysPerWeek: z
    .number()
    .min(1, { message: "ימי עבודה חייבים להיות לפחות 1" })
    .max(7, { message: "ימי עבודה לא יכולים לעלות על 7" }),

  // Travel allowance
  travelAllowanceType: z.enum(["NONE", "DAILY", "MONTHLY"]),
  travelAllowanceAmount: z
    .number()
    .min(0, { message: "סכום נסיעות לא יכול להיות שלילי" })
    .max(1000000, { message: "סכום נסיעות לא יכול לעלות על 10,000 ₪" })
    .nullable()
    .optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;