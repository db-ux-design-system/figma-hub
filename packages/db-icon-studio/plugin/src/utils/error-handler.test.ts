/**
 * Tests for error handling utilities
 *
 * Tests cover:
 * - Custom error class instantiation
 * - Error message formatting
 * - Error type detection
 * - Context-aware error handling
 */

import { describe, it, expect } from "vitest";
import {
  ValidationError,
  SelectionError,
  ProcessingError,
  ErrorHandler,
} from "./error-handler";

describe("Custom Error Classes", () => {
  describe("ValidationError", () => {
    it("should create a ValidationError with correct name and message", () => {
      const error = new ValidationError("Invalid stroke width");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Invalid stroke width");
    });

    it("should maintain stack trace", () => {
      const error = new ValidationError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ValidationError");
    });
  });

  describe("SelectionError", () => {
    it("should create a SelectionError with correct name and message", () => {
      const error = new SelectionError("No component set selected");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SelectionError);
      expect(error.name).toBe("SelectionError");
      expect(error.message).toBe("No component set selected");
    });

    it("should maintain stack trace", () => {
      const error = new SelectionError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("SelectionError");
    });
  });

  describe("ProcessingError", () => {
    it("should create a ProcessingError with correct name and message", () => {
      const error = new ProcessingError("Failed to flatten vectors");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ProcessingError);
      expect(error.name).toBe("ProcessingError");
      expect(error.message).toBe("Failed to flatten vectors");
    });

    it("should maintain stack trace", () => {
      const error = new ProcessingError("Test error");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("ProcessingError");
    });
  });
});

describe("ErrorHandler", () => {
  describe("formatErrorMessage", () => {
    it("should format ValidationError with validation prefix", () => {
      const error = new ValidationError("Stroke width must be 2px");
      const formatted = ErrorHandler.formatErrorMessage(
        error,
        "vector validation",
      );

      expect(formatted).toBe("Validation failed: Stroke width must be 2px");
    });

    it("should format SelectionError with selection prefix", () => {
      const error = new SelectionError("Multiple selections not supported");
      const formatted = ErrorHandler.formatErrorMessage(
        error,
        "selection check",
      );

      expect(formatted).toBe(
        "Selection error: Multiple selections not supported",
      );
    });

    it("should format ProcessingError with context", () => {
      const error = new ProcessingError("Color variable not found");
      const formatted = ErrorHandler.formatErrorMessage(
        error,
        "color application",
      );

      expect(formatted).toBe(
        "Processing failed in color application: Color variable not found",
      );
    });

    it("should format generic Error with context", () => {
      const error = new Error("Unexpected failure");
      const formatted = ErrorHandler.formatErrorMessage(
        error,
        "unknown operation",
      );

      expect(formatted).toBe(
        "Unexpected error in unknown operation: Unexpected failure",
      );
    });

    it("should handle errors with empty messages", () => {
      const error = new ValidationError("");
      const formatted = ErrorHandler.formatErrorMessage(error, "test");

      expect(formatted).toBe("Validation failed: ");
    });

    it("should handle errors with special characters in message", () => {
      const error = new ValidationError(
        "Name must match pattern: /^ic-[a-z]+$/",
      );
      const formatted = ErrorHandler.formatErrorMessage(
        error,
        "name validation",
      );

      expect(formatted).toContain("Name must match pattern: /^ic-[a-z]+$/");
    });
  });

  describe("handle", () => {
    it("should return error PluginMessage for ValidationError", () => {
      const error = new ValidationError("Invalid icon size");
      const result = ErrorHandler.handle(error, "size validation");

      expect(result).toEqual({
        type: "error",
        error: "Validation failed: Invalid icon size",
      });
    });

    it("should return error PluginMessage for SelectionError", () => {
      const error = new SelectionError("No selection");
      const result = ErrorHandler.handle(error, "selection check");

      expect(result).toEqual({
        type: "error",
        error: "Selection error: No selection",
      });
    });

    it("should return error PluginMessage for ProcessingError", () => {
      const error = new ProcessingError("Flatten failed");
      const result = ErrorHandler.handle(error, "flatten operation");

      expect(result).toEqual({
        type: "error",
        error: "Processing failed in flatten operation: Flatten failed",
      });
    });

    it("should return error PluginMessage for generic Error", () => {
      const error = new Error("Unknown error");
      const result = ErrorHandler.handle(error, "test operation");

      expect(result).toEqual({
        type: "error",
        error: "Unexpected error in test operation: Unknown error",
      });
    });

    it("should handle errors with different contexts", () => {
      const error = new ProcessingError("Operation failed");

      const result1 = ErrorHandler.handle(error, "outline conversion");
      const result2 = ErrorHandler.handle(error, "scaling");

      expect(result1.error).toContain("outline conversion");
      expect(result2.error).toContain("scaling");
    });
  });

  describe("isCustomError", () => {
    it("should return true for ValidationError", () => {
      const error = new ValidationError("test");
      expect(ErrorHandler.isCustomError(error)).toBe(true);
    });

    it("should return true for SelectionError", () => {
      const error = new SelectionError("test");
      expect(ErrorHandler.isCustomError(error)).toBe(true);
    });

    it("should return true for ProcessingError", () => {
      const error = new ProcessingError("test");
      expect(ErrorHandler.isCustomError(error)).toBe(true);
    });

    it("should return false for generic Error", () => {
      const error = new Error("test");
      expect(ErrorHandler.isCustomError(error)).toBe(false);
    });

    it("should return false for TypeError", () => {
      const error = new TypeError("test");
      expect(ErrorHandler.isCustomError(error)).toBe(false);
    });

    it("should return false for RangeError", () => {
      const error = new RangeError("test");
      expect(ErrorHandler.isCustomError(error)).toBe(false);
    });
  });
});

describe("Error Handler Edge Cases", () => {
  it("should handle null context gracefully", () => {
    const error = new ValidationError("test");
    const formatted = ErrorHandler.formatErrorMessage(error, "");

    expect(formatted).toBe("Validation failed: test");
  });

  it("should handle very long error messages", () => {
    const longMessage = "a".repeat(1000);
    const error = new ValidationError(longMessage);
    const formatted = ErrorHandler.formatErrorMessage(error, "test");

    expect(formatted).toContain(longMessage);
    expect(formatted.length).toBeGreaterThan(1000);
  });

  it("should handle error messages with newlines", () => {
    const error = new ValidationError("Line 1\nLine 2\nLine 3");
    const formatted = ErrorHandler.formatErrorMessage(error, "test");

    expect(formatted).toContain("Line 1\nLine 2\nLine 3");
  });

  it("should handle multiple error types in sequence", () => {
    const errors = [
      new ValidationError("validation"),
      new SelectionError("selection"),
      new ProcessingError("processing"),
      new Error("generic"),
    ];

    const results = errors.map((error, index) =>
      ErrorHandler.handle(error, `operation-${index}`),
    );

    expect(results).toHaveLength(4);
    expect(results[0].error).toContain("Validation failed");
    expect(results[1].error).toContain("Selection error");
    expect(results[2].error).toContain("Processing failed");
    expect(results[3].error).toContain("Unexpected error");
  });
});

describe("Error Handler Requirements Validation", () => {
  // Requirement 11.1: Display descriptive error messages
  it("should provide descriptive error messages for all error types", () => {
    const testCases = [
      {
        error: new ValidationError("Icon must be 32px, 24px, or 20px"),
        expectedSubstring: "Validation failed",
      },
      {
        error: new SelectionError("Please select a Component Set"),
        expectedSubstring: "Selection error",
      },
      {
        error: new ProcessingError("Unable to apply color variables"),
        expectedSubstring: "Processing failed",
      },
    ];

    testCases.forEach(({ error, expectedSubstring }) => {
      const result = ErrorHandler.handle(error, "test");
      expect(result.type).toBe("error");
      expect(result.error).toContain(expectedSubstring);
      expect(result.error).toContain(error.message);
    });
  });

  // Requirement 11.2: Handle invalid selections gracefully
  it("should handle selection errors without crashing", () => {
    const selectionErrors = [
      new SelectionError("No selection"),
      new SelectionError("Multiple selections"),
      new SelectionError("Invalid node type"),
    ];

    selectionErrors.forEach((error) => {
      expect(() => ErrorHandler.handle(error, "selection")).not.toThrow();
      const result = ErrorHandler.handle(error, "selection");
      expect(result.type).toBe("error");
      expect(result.error).toContain("Selection error");
    });
  });

  // Requirement 11.3: Report Figma API operation failures
  it("should report processing failures with context", () => {
    const processingErrors = [
      new ProcessingError("Figma API call failed"),
      new ProcessingError("Unable to flatten vectors"),
      new ProcessingError("Color variable not found"),
    ];

    processingErrors.forEach((error) => {
      const result = ErrorHandler.handle(error, "API operation");
      expect(result.type).toBe("error");
      expect(result.error).toContain("Processing failed");
      expect(result.error).toContain("API operation");
      expect(result.error).toContain(error.message);
    });
  });
});
