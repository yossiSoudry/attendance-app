// lib/validations/admin-auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "נא להזין אימייל")
    .email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(1, "נא להזין סיסמה")
    .min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "נא להזין אימייל")
    .email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(1, "נא להזין סיסמה")
    .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
    .regex(/[A-Z]/, "סיסמה חייבת להכיל אות גדולה באנגלית")
    .regex(/[a-z]/, "סיסמה חייבת להכיל אות קטנה באנגלית")
    .regex(/[0-9]/, "סיסמה חייבת להכיל מספר"),
  confirmPassword: z.string().min(1, "נא לאשר סיסמה"),
  name: z
    .string()
    .min(2, "שם חייב להכיל לפחות 2 תווים")
    .max(100, "שם ארוך מדי"),
  invitationToken: z.string().min(1, "קוד הזמנה חסר"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const inviteAdminSchema = z.object({
  email: z
    .string()
    .min(1, "נא להזין אימייל")
    .email("כתובת אימייל לא תקינה"),
  role: z.enum(["ADMIN", "MANAGER"], {
    message: "נא לבחור תפקיד",
  }),
  departmentId: z.string().uuid().optional().nullable(),
});

export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;
