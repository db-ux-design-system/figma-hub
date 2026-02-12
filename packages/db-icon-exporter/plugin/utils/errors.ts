/**
 * Custom error classes for the icon exporter plugin.
 * Provides specific error types for better error handling and user feedback.
 */

/**
 * Error thrown during icon scanning operations.
 *
 * @example
 * ```typescript
 * throw new IconScanError("Failed to load page", "Icons - Functional");
 * ```
 */
export class IconScanError extends Error {
  constructor(
    message: string,
    public page?: string,
  ) {
    super(message);
    this.name = "IconScanError";

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IconScanError);
    }
  }
}

/**
 * Error thrown during export operations.
 *
 * @example
 * ```typescript
 * throw new ExportError("Failed to create export page", "full");
 * ```
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public exportType?: string,
  ) {
    super(message);
    this.name = "ExportError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExportError);
    }
  }
}

/**
 * Error thrown during validation operations.
 *
 * @example
 * ```typescript
 * throw new ValidationError("Invalid version format", "version");
 * ```
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Error thrown when a required node is not found in Figma.
 *
 * @example
 * ```typescript
 * throw new NodeNotFoundError("Icon component not found", "123:456");
 * ```
 */
export class NodeNotFoundError extends Error {
  constructor(
    message: string,
    public nodeId?: string,
  ) {
    super(message);
    this.name = "NodeNotFoundError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeNotFoundError);
    }
  }
}

/**
 * Maps error types to user-friendly messages.
 *
 * @param error - The error to convert
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await scanIcons();
 * } catch (error) {
 *   const userMessage = getUserFriendlyErrorMessage(error);
 *   alert(userMessage);
 * }
 * ```
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof IconScanError) {
    return `Unable to scan icons${error.page ? ` on page "${error.page}"` : ""}. Please ensure the file contains valid icon components.`;
  }

  if (error instanceof ExportError) {
    return `Export failed${error.exportType ? ` (${error.exportType} mode)` : ""}. Please check your selection and try again.`;
  }

  if (error instanceof ValidationError) {
    return `Validation error${error.field ? ` in ${error.field}` : ""}. Please check your input and try again.`;
  }

  if (error instanceof NodeNotFoundError) {
    return `Could not find required component${error.nodeId ? ` (ID: ${error.nodeId})` : ""}. The file may have been modified.`;
  }

  // Generic error
  if (error instanceof Error) {
    // Don't expose technical error messages to users
    console.error("Unexpected error:", error);
    return "An unexpected error occurred. Please try again or contact support if the problem persists.";
  }

  return "An unknown error occurred. Please try again.";
}

/**
 * Logs detailed error information for debugging.
 *
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 *
 * @example
 * ```typescript
 * try {
 *   await exportFullWithAssets(...);
 * } catch (error) {
 *   logDetailedError(error, "exportFullWithAssets");
 *   throw error;
 * }
 * ```
 */
export function logDetailedError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : "";

  if (error instanceof IconScanError) {
    console.error(`${prefix} IconScanError:`, {
      message: error.message,
      page: error.page,
      stack: error.stack,
    });
  } else if (error instanceof ExportError) {
    console.error(`${prefix} ExportError:`, {
      message: error.message,
      exportType: error.exportType,
      stack: error.stack,
    });
  } else if (error instanceof ValidationError) {
    console.error(`${prefix} ValidationError:`, {
      message: error.message,
      field: error.field,
      stack: error.stack,
    });
  } else if (error instanceof NodeNotFoundError) {
    console.error(`${prefix} NodeNotFoundError:`, {
      message: error.message,
      nodeId: error.nodeId,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}
