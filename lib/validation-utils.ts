// lib/validation-utils.ts
// Shared validation utilities for server actions

import { ZodSchema, ZodError } from "zod";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Validate form data against a Zod schema
 * Returns either validation errors or the parsed data
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  data: unknown,
  errorMessage: string = "נתונים לא תקינים"
):
  | { success: false; result: ActionResult }
  | { success: true; data: T } {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      result: {
        success: false,
        message: errorMessage,
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  return { success: true, data: parsed.data };
}

/**
 * Parse time string (HH:MM) and validate
 */
export function parseTimeString(
  time: string
): { valid: true; hours: number; minutes: number } | { valid: false; error: string } {
  const parts = time.split(":");
  if (parts.length !== 2) {
    return { valid: false, error: "פורמט שעה לא תקין" };
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return { valid: false, error: "פורמט שעה לא תקין" };
  }

  if (hours < 0 || hours > 23) {
    return { valid: false, error: "שעות חייבות להיות בין 0 ל-23" };
  }

  if (minutes < 0 || minutes > 59) {
    return { valid: false, error: "דקות חייבות להיות בין 0 ל-59" };
  }

  return { valid: true, hours, minutes };
}

/**
 * Sanitize text input - remove HTML tags and trim
 */
export function sanitizeText(
  text: string | null | undefined,
  maxLength: number = 500
): string | null {
  if (!text) return null;
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, ""); // Remove HTML tags
}

/**
 * Validate and sanitize a national ID (Israeli Teudat Zehut)
 */
export function validateNationalId(id: string): boolean {
  // Remove non-numeric characters
  const cleanId = id.replace(/\D/g, "");

  // Israeli ID is 9 digits
  if (cleanId.length !== 9) {
    return false;
  }

  // Luhn algorithm validation for Israeli ID
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleanId[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}
