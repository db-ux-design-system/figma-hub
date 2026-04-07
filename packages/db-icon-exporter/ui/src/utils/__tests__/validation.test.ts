import { describe, it, expect } from "vitest";
import {
  validateVersion,
  sanitizeVersion,
  validateSearchTerm,
} from "../validation";

describe("validation utilities", () => {
  describe("validateVersion", () => {
    it("should accept valid semantic versions", () => {
      expect(validateVersion("1.2.3").isValid).toBe(true);
      expect(validateVersion("0.0.1").isValid).toBe(true);
      expect(validateVersion("10.20.30").isValid).toBe(true);
    });

    it("should accept versions with leading v", () => {
      expect(validateVersion("v1.2.3").isValid).toBe(true);
      expect(validateVersion("v0.0.1").isValid).toBe(true);
    });

    it("should accept versions with pre-release tags", () => {
      expect(validateVersion("1.2.3-beta").isValid).toBe(true);
      expect(validateVersion("1.2.3-rc.1").isValid).toBe(true);
      expect(validateVersion("1.2.3-alpha.2").isValid).toBe(true);
    });

    it("should accept empty version as valid", () => {
      expect(validateVersion("").isValid).toBe(true);
      expect(validateVersion("   ").isValid).toBe(true);
    });

    it("should reject invalid version formats", () => {
      expect(validateVersion("1.2").isValid).toBe(false);
      expect(validateVersion("1").isValid).toBe(false);
      expect(validateVersion("abc").isValid).toBe(false);
      expect(validateVersion("1.2.3.4").isValid).toBe(false);
    });

    it("should provide error message for invalid versions", () => {
      const result = validateVersion("invalid");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sanitizeVersion", () => {
    it("should remove leading v", () => {
      expect(sanitizeVersion("v1.2.3")).toBe("1.2.3");
      expect(sanitizeVersion("v0.0.1")).toBe("0.0.1");
    });

    it("should trim whitespace", () => {
      expect(sanitizeVersion("  1.2.3  ")).toBe("1.2.3");
      expect(sanitizeVersion("  v1.2.3  ")).toBe("1.2.3");
    });

    it("should not modify valid versions without v", () => {
      expect(sanitizeVersion("1.2.3")).toBe("1.2.3");
      expect(sanitizeVersion("1.2.3-beta")).toBe("1.2.3-beta");
    });
  });

  describe("validateSearchTerm", () => {
    it("should accept valid search terms", () => {
      const result = validateSearchTerm("icon-name");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("icon-name");
    });

    it("should remove potentially problematic characters", () => {
      const result = validateSearchTerm("icon<name>");
      expect(result.sanitized).toBe("iconname");
    });

    it("should trim whitespace", () => {
      const result = validateSearchTerm("  icon-name  ");
      expect(result.sanitized).toBe("icon-name");
    });

    it("should preserve spaces, hyphens, and underscores", () => {
      const result = validateSearchTerm("icon name-test_value");
      expect(result.sanitized).toBe("icon name-test_value");
    });

    it("should reject search terms over 100 characters", () => {
      const longTerm = "a".repeat(101);
      const result = validateSearchTerm(longTerm);
      expect(result.isValid).toBe(false);
    });

    it("should accept search terms up to 100 characters", () => {
      const maxTerm = "a".repeat(100);
      const result = validateSearchTerm(maxTerm);
      expect(result.isValid).toBe(true);
    });
  });
});
