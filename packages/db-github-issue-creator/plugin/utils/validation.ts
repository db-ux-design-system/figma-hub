// Validation utilities
// Validates: Requirements 3.2, 4.2

/**
 * Validates that a title is not empty or whitespace-only
 * @param title - The title string to validate
 * @returns true if the title is valid (not empty and not whitespace-only), false otherwise
 */
export function validateTitle(title: string): boolean {
  // Reject empty strings and whitespace-only strings
  return title.trim().length > 0;
}
