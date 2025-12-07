// lib/currency.ts
// Currency conversion utilities for Shekel <-> Agorot

/**
 * Convert Shekels to Agorot (multiply by 100)
 * Used when storing monetary values in the database
 */
export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

/**
 * Convert Agorot to Shekels (divide by 100)
 * Used when displaying monetary values from the database
 */
export function agorotToShekels(agorot: number): number {
  return agorot / 100;
}

/**
 * Safely convert Shekels to Agorot, handling null values
 */
export function shekelsToAgorotSafe(shekels: number | null | undefined): number | null {
  if (shekels === null || shekels === undefined) return null;
  return shekelsToAgorot(shekels);
}

/**
 * Safely convert Agorot to Shekels, handling null values
 */
export function agorotToShekelsSafe(agorot: number | null | undefined): number | null {
  if (agorot === null || agorot === undefined) return null;
  return agorotToShekels(agorot);
}

/**
 * Format Agorot as a Shekel string with 2 decimal places
 */
export function formatAgorotAsShekels(agorot: number): string {
  return agorotToShekels(agorot).toFixed(2);
}

/**
 * Format a number as Shekel currency string
 */
export function formatShekel(amount: number): string {
  return amount.toLocaleString("he-IL", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }) + " ₪";
}

/**
 * Validate monetary amount is within reasonable bounds
 * @param amount Amount in Shekels
 * @param max Maximum allowed (default 100,000)
 * @param min Minimum allowed (default 0)
 */
export function validateMonetaryAmount(
  amount: number,
  max: number = 100000,
  min: number = 0
): { valid: true; agorot: number } | { valid: false; error: string } {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: "סכום לא תקין" };
  }
  if (amount < min) {
    return { valid: false, error: `הסכום חייב להיות לפחות ${min} ש"ח` };
  }
  if (amount > max) {
    return { valid: false, error: `הסכום לא יכול לעלות על ${max} ש"ח` };
  }
  return { valid: true, agorot: shekelsToAgorot(amount) };
}
