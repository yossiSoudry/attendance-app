// lib/validations/bonus.ts
import { z } from "zod";

export const bonusFormSchema = z
  .object({
    bonusType: z.enum(["HOURLY", "ONE_TIME"]),
    amountPerHour: z
      .number()
      .min(0, "סכום חייב להיות חיובי")
      .max(1000, "סכום לא יכול לעלות על 1000 ₪")
      .optional(),
    amountFixed: z
      .number()
      .min(0, "סכום חייב להיות חיובי")
      .max(100000, "סכום לא יכול לעלות על 100,000 ₪")
      .optional(),
    validFrom: z.date(),
    validTo: z.date(),
    description: z
      .string()
      .max(500, "התיאור יכול להכיל עד 500 תווים")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.bonusType === "HOURLY") {
        return data.amountPerHour !== undefined && data.amountPerHour > 0;
      }
      return true;
    },
    {
      message: "יש להזין סכום לשעה",
      path: ["amountPerHour"],
    }
  )
  .refine(
    (data) => {
      if (data.bonusType === "ONE_TIME") {
        return data.amountFixed !== undefined && data.amountFixed > 0;
      }
      return true;
    },
    {
      message: "יש להזין סכום קבוע",
      path: ["amountFixed"],
    }
  )
  .refine(
    (data) => {
      return data.validTo >= data.validFrom;
    },
    {
      message: "תאריך סיום חייב להיות אחרי תאריך התחלה",
      path: ["validTo"],
    }
  );

export type BonusFormValues = z.infer<typeof bonusFormSchema>;