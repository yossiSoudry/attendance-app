// lib/validations/work-type.ts
import { z } from "zod";

export const rateTypes = ["BASE_RATE", "FIXED", "BONUS_PERCENT", "BONUS_FIXED"] as const;
export type RateType = (typeof rateTypes)[number];

export const rateTypeLabels: Record<RateType, string> = {
  BASE_RATE: "שכר בסיסי של העובד",
  FIXED: "תעריף קבוע לשעה",
  BONUS_PERCENT: "תוספת אחוזים",
  BONUS_FIXED: "תוספת קבועה לשעה",
};

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
  rateType: z.enum(rateTypes),
  rateValue: z.number().min(0, "הערך חייב להיות חיובי"),
});

export type WorkTypeFormValues = z.infer<typeof workTypeFormSchema>;