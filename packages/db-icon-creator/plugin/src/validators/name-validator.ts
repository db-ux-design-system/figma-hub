/**
 * Name Validator
 *
 * Validates icon names according to naming conventions.
 * Implements Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { NameValidationResult } from "../types/index.js";

/**
 * Name Validator class
 *
 * Validates icon names according to type-specific naming rules.
 */
export class NameValidator {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative") {
    this.iconType = iconType;
  }

  /**
   * Validate an icon name
   *
   * Requirements:
   * - 9.1: Validate the Icon_Name
   * - 9.2: Check Icon_Name against naming convention rules
   * - 9.3: Apply functional icon naming rules
   * - 9.4: Apply illustrative icon naming rules
   * - 9.5: Report specific naming errors
   * - 9.6: Suggest corrected names when validation fails
   *
   * @param name - The icon name to validate
   * @returns Validation result with errors and suggestion
   */
  validate(name: string): NameValidationResult {
    const errors: string[] = [];

    // Common rules
    if (!this.checkKebabCase(name)) {
      errors.push("Name must be in kebab-case format");
    }

    if (!this.checkLength(name)) {
      errors.push("Name must be between 3 and 50 characters");
    }

    // Note: Neither functional nor illustrative icons require a specific prefix

    // Requirement 9.6: Suggest corrected names when validation fails
    const suggestion =
      errors.length > 0 ? this.generateSuggestion(name) : undefined;

    return {
      isValid: errors.length === 0,
      errors,
      suggestion,
    };
  }

  /**
   * Check if name is in kebab-case format
   */
  private checkKebabCase(name: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
  }

  /**
   * Check if name length is valid
   */
  private checkLength(name: string): boolean {
    return name.length >= 3 && name.length <= 50;
  }

  /**
   * Generate a corrected name suggestion
   *
   * Requirement 9.6: Suggest corrected names when validation fails
   *
   * @param name - The invalid name
   * @returns A corrected name suggestion
   */
  private generateSuggestion(name: string): string {
    // Convert to lowercase and replace invalid characters
    let suggestion = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Replace multiple consecutive dashes with single dash
    suggestion = suggestion.replace(/-+/g, "-");

    // Remove leading and trailing dashes
    suggestion = suggestion.replace(/^-|-$/g, "");

    // Ensure minimum length (no prefix required for any icon type)
    if (suggestion.length < 3) {
      suggestion = "icon";
    }

    // Truncate if too long
    if (suggestion.length > 50) {
      suggestion = suggestion.substring(0, 50);
    }

    return suggestion;
  }
}
