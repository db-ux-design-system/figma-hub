/**
 * Error handling utilities for the DB Icon Creator plugin
 *
 * This module provides custom error classes and error handling logic
 * to ensure consistent error reporting across the plugin.
 *
 * Requirements: 11.1, 11.2, 11.3
 */

import { PluginMessage } from "../types";

/**
 * Custom error class for validation failures
 * Used when icon validation rules are not met
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Custom error class for selection-related errors
 * Used when the user's selection is invalid or incompatible
 */
export class SelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelectionError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelectionError);
    }
  }
}

/**
 * Custom error class for processing failures
 * Used when operations like outline conversion, flattening, etc. fail
 */
export class ProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcessingError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProcessingError);
    }
  }
}

/**
 * Central error handler for the plugin
 * Provides consistent error formatting and logging
 */
export class ErrorHandler {
  /**
   * Handle an error and return a formatted plugin message
   *
   * @param error - The error to handle
   * @param context - Context string describing where the error occurred
   * @returns A PluginMessage with type "error" and formatted error message
   *
   * Requirements: 11.1, 11.3
   */
  static handle(error: Error, context: string): PluginMessage {
    // Log error for debugging
    console.error(`Error in ${context}:`, error);

    return {
      type: "error",
      error: this.formatErrorMessage(error, context),
    };
  }

  /**
   * Format an error message based on error type and context
   *
   * @param error - The error to format
   * @param context - Context string describing where the error occurred
   * @returns A formatted error message string
   *
   * Requirements: 11.1, 11.2, 11.3
   */
  static formatErrorMessage(error: Error, context: string): string {
    if (error instanceof ValidationError) {
      return `Validation failed: ${error.message}`;
    }

    if (error instanceof SelectionError) {
      return `Selection error: ${error.message}`;
    }

    if (error instanceof ProcessingError) {
      return `Processing failed in ${context}: ${error.message}`;
    }

    // Generic error fallback
    return `Unexpected error in ${context}: ${error.message}`;
  }

  /**
   * Check if an error is a known custom error type
   *
   * @param error - The error to check
   * @returns true if the error is a custom error type
   */
  static isCustomError(error: Error): boolean {
    return (
      error instanceof ValidationError ||
      error instanceof SelectionError ||
      error instanceof ProcessingError
    );
  }
}
