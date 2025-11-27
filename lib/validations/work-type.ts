// lib/validations/work-type.ts
import { z } from "zod";

export const workTypeFormSchema = z.object({
  name: z
    .string()
    .min(2, "שם סוג העבודה חייב להכיל לפחות 2 תווים")
    .max(100, "שם סוג העבודה יכול להכיל עד 100 תווים"),
  description: z
    .string()
    .max(500, "התיאור יכול להכיל עד 500 תווים")
    .optional()
    .or(z.literal("")),
  isDefault: z.boolean(),
});

export type WorkTypeFormValues = z.infer<typeof workTypeFormSchema>;