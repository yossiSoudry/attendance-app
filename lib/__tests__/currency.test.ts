import { describe, it, expect } from "vitest";
import {
  shekelsToAgorot,
  agorotToShekels,
  shekelsToAgorotSafe,
  agorotToShekelsSafe,
  formatShekel,
  validateMonetaryAmount,
} from "../currency";

describe("Currency Utilities", () => {
  describe("shekelsToAgorot", () => {
    it("converts whole shekels correctly", () => {
      expect(shekelsToAgorot(1)).toBe(100);
      expect(shekelsToAgorot(10)).toBe(1000);
      expect(shekelsToAgorot(100)).toBe(10000);
    });

    it("converts fractional shekels correctly", () => {
      expect(shekelsToAgorot(1.5)).toBe(150);
      expect(shekelsToAgorot(1.99)).toBe(199);
      expect(shekelsToAgorot(0.01)).toBe(1);
    });

    it("handles zero correctly", () => {
      expect(shekelsToAgorot(0)).toBe(0);
    });

    it("rounds to avoid floating point issues", () => {
      // 0.1 + 0.2 = 0.30000000000000004 in JS
      expect(shekelsToAgorot(0.1 + 0.2)).toBe(30);
    });
  });

  describe("agorotToShekels", () => {
    it("converts agorot to shekels correctly", () => {
      expect(agorotToShekels(100)).toBe(1);
      expect(agorotToShekels(1000)).toBe(10);
      expect(agorotToShekels(150)).toBe(1.5);
    });

    it("handles zero correctly", () => {
      expect(agorotToShekels(0)).toBe(0);
    });
  });

  describe("shekelsToAgorotSafe", () => {
    it("returns null for null input", () => {
      expect(shekelsToAgorotSafe(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(shekelsToAgorotSafe(undefined)).toBe(null);
    });

    it("converts valid numbers correctly", () => {
      expect(shekelsToAgorotSafe(1.5)).toBe(150);
    });
  });

  describe("agorotToShekelsSafe", () => {
    it("returns null for null input", () => {
      expect(agorotToShekelsSafe(null)).toBe(null);
    });

    it("returns null for undefined input", () => {
      expect(agorotToShekelsSafe(undefined)).toBe(null);
    });

    it("converts valid numbers correctly", () => {
      expect(agorotToShekelsSafe(150)).toBe(1.5);
    });
  });

  describe("formatShekel", () => {
    it("formats whole numbers correctly", () => {
      expect(formatShekel(100)).toBe("100 ₪");
    });

    it("formats fractional amounts correctly", () => {
      expect(formatShekel(1.5)).toBe("1.50 ₪");
      expect(formatShekel(1.99)).toBe("1.99 ₪");
    });

    it("formats large numbers with separators", () => {
      expect(formatShekel(1000)).toBe("1,000 ₪");
      expect(formatShekel(1000000)).toBe("1,000,000 ₪");
    });
  });

  describe("validateMonetaryAmount", () => {
    it("validates valid amounts", () => {
      const result = validateMonetaryAmount(50);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.agorot).toBe(5000);
      }
    });

    it("rejects negative amounts", () => {
      const result = validateMonetaryAmount(-10);
      expect(result.valid).toBe(false);
    });

    it("rejects amounts above max", () => {
      const result = validateMonetaryAmount(200000, 100000);
      expect(result.valid).toBe(false);
    });

    it("rejects NaN", () => {
      const result = validateMonetaryAmount(NaN);
      expect(result.valid).toBe(false);
    });

    it("rejects Infinity", () => {
      const result = validateMonetaryAmount(Infinity);
      expect(result.valid).toBe(false);
    });

    it("respects custom min/max", () => {
      const result = validateMonetaryAmount(5, 1000, 10);
      expect(result.valid).toBe(false);
    });
  });
});
