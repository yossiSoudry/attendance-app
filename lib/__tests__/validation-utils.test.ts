import { describe, it, expect } from "vitest";
import {
  parseTimeString,
  sanitizeText,
  validateNationalId,
} from "../validation-utils";

describe("Validation Utilities", () => {
  describe("parseTimeString", () => {
    it("parses valid time strings correctly", () => {
      const result = parseTimeString("09:30");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.hours).toBe(9);
        expect(result.minutes).toBe(30);
      }
    });

    it("parses midnight correctly", () => {
      const result = parseTimeString("00:00");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.hours).toBe(0);
        expect(result.minutes).toBe(0);
      }
    });

    it("parses end of day correctly", () => {
      const result = parseTimeString("23:59");
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.hours).toBe(23);
        expect(result.minutes).toBe(59);
      }
    });

    it("rejects invalid hours", () => {
      expect(parseTimeString("25:00").valid).toBe(false);
      expect(parseTimeString("-1:00").valid).toBe(false);
    });

    it("rejects invalid minutes", () => {
      expect(parseTimeString("12:60").valid).toBe(false);
      expect(parseTimeString("12:-5").valid).toBe(false);
    });

    it("rejects invalid format", () => {
      expect(parseTimeString("0930").valid).toBe(false);
      expect(parseTimeString("not a time").valid).toBe(false);
      expect(parseTimeString("12:ab").valid).toBe(false);
      expect(parseTimeString("").valid).toBe(false);
    });

    it("accepts flexible hour/minute format", () => {
      // The function uses parseInt which accepts single digits
      expect(parseTimeString("9:30").valid).toBe(true);
      expect(parseTimeString("09:5").valid).toBe(true);
    });
  });

  describe("sanitizeText", () => {
    it("returns null for null input", () => {
      expect(sanitizeText(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(sanitizeText(undefined)).toBe(null);
    });

    it("trims whitespace", () => {
      expect(sanitizeText("  hello  ")).toBe("hello");
    });

    it("returns empty string for whitespace-only input after trim", () => {
      // The function trims and returns empty string, not null
      expect(sanitizeText("   ")).toBe("");
    });

    it("truncates long text", () => {
      const longText = "a".repeat(1000);
      const result = sanitizeText(longText, 100);
      expect(result?.length).toBe(100);
    });

    it("preserves short text", () => {
      expect(sanitizeText("hello", 100)).toBe("hello");
    });

    it("handles Hebrew text correctly", () => {
      expect(sanitizeText("  שלום עולם  ")).toBe("שלום עולם");
    });
  });

  describe("validateNationalId", () => {
    it("validates correct Israeli ID numbers", () => {
      // These are valid Israeli ID numbers based on the Luhn algorithm variant
      expect(validateNationalId("123456782")).toBe(true);
      expect(validateNationalId("000000018")).toBe(true);
    });

    it("rejects wrong length", () => {
      expect(validateNationalId("12345678")).toBe(false);
      expect(validateNationalId("1234567890")).toBe(false);
    });

    it("rejects non-numeric input", () => {
      expect(validateNationalId("12345678a")).toBe(false);
      expect(validateNationalId("abcdefghi")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateNationalId("")).toBe(false);
    });

    it("rejects short numbers without padding", () => {
      // The function does not auto-pad, requires exactly 9 digits
      expect(validateNationalId("18")).toBe(false);
      expect(validateNationalId("123")).toBe(false);
    });
  });
});
