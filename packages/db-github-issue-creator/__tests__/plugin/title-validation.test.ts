import { describe, it, expect } from "vitest";
import { validateTitle } from "../../plugin/utils/validation";
import * as fc from "fast-check";

describe("Title Validation", () => {
  describe("validateTitle", () => {
    it("should accept a valid non-empty title", () => {
      const validTitle = "Bug: Login button not working";
      expect(validateTitle(validTitle)).toBe(true);
    });

    it("should accept a title with leading and trailing spaces", () => {
      const titleWithSpaces = "  Valid Title  ";
      expect(validateTitle(titleWithSpaces)).toBe(true);
    });

    it("should accept a single character title", () => {
      const singleChar = "A";
      expect(validateTitle(singleChar)).toBe(true);
    });

    it("should accept a title with special characters", () => {
      const specialTitle = "Bug: [CRITICAL] Login fails with 401 error!";
      expect(validateTitle(specialTitle)).toBe(true);
    });

    it("should accept a very long title", () => {
      const longTitle = "A".repeat(1000);
      expect(validateTitle(longTitle)).toBe(true);
    });

    it("should reject an empty string", () => {
      const emptyTitle = "";
      expect(validateTitle(emptyTitle)).toBe(false);
    });

    it("should reject a string with only spaces", () => {
      const spacesOnly = "   ";
      expect(validateTitle(spacesOnly)).toBe(false);
    });

    it("should reject a string with only tabs", () => {
      const tabsOnly = "\t\t\t";
      expect(validateTitle(tabsOnly)).toBe(false);
    });

    it("should reject a string with only newlines", () => {
      const newlinesOnly = "\n\n\n";
      expect(validateTitle(newlinesOnly)).toBe(false);
    });

    it("should reject a string with mixed whitespace characters", () => {
      const mixedWhitespace = " \t\n\r ";
      expect(validateTitle(mixedWhitespace)).toBe(false);
    });

    it("should reject a string with only carriage returns", () => {
      const carriageReturns = "\r\r\r";
      expect(validateTitle(carriageReturns)).toBe(false);
    });

    it("should accept a title with whitespace in the middle", () => {
      const titleWithMiddleSpace = "Bug Report: Login Issue";
      expect(validateTitle(titleWithMiddleSpace)).toBe(true);
    });

    it("should accept a title with multiple words", () => {
      const multiWordTitle = "Feature Request: Add dark mode support";
      expect(validateTitle(multiWordTitle)).toBe(true);
    });
  });

  // Feature: db-github-issue-creator, Property 4: Title Validation Rejects Empty
  // Validates: Requirements 3.2, 4.2
  describe("Property 4: Title Validation Rejects Empty", () => {
    it("should reject any string composed entirely of whitespace or empty string", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.trim().length === 0),
          (emptyOrWhitespaceTitle) => {
            // For any string that is empty or contains only whitespace,
            // validateTitle should return false
            expect(validateTitle(emptyOrWhitespaceTitle)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should accept any string with at least one non-whitespace character", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.trim().length > 0),
          (validTitle) => {
            // For any string that contains at least one non-whitespace character,
            // validateTitle should return true
            expect(validateTitle(validTitle)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
