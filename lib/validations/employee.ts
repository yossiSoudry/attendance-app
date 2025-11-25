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
  baseHourlyRate: z
    .number()
    .min(0, { message: "שכר לא יכול להיות שלילי" })
    .max(100000, { message: "שכר לא יכול לעלות על 1000 ₪ לשעה" }),
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;