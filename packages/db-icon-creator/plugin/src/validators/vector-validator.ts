/**
 * Vector Validator
 *
 * Validates vector properties according to icon type guidelines.
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { ValidationResult, ValidationError } from "../types/index.js";
import { findVectorNodes } from "../utils/selection.js";

/**
 * Validation rule definition
 */
interface ValidationRule {
  name: string;
  check: (node: VectorNode) => boolean;
  message: string;
}

/**
 * Vector Validator class
 *
 * Validates vectors within component sets according to icon type rules.
 */
export class VectorValidator {
  private rules: ValidationRule[];
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative") {
    this.iconType = iconType;
    this.rules = this.getRulesForIconType(iconType);
  }

  /**
   * Validate all vectors in a component set
   *
   * Requirements:
   * - 3.1: Validate all Vector_Layer nodes within component set
   * - 3.2: Validate stroke width for functional icons
   * - 3.3: Validate stroke width for illustrative icons
   * - 3.4: Validate vector sizes
   * - 3.5: Report specific validation errors with details
   *
   * @param componentSet - The component set to validate
   * @returns Validation result with any errors found
   */
  validate(componentSet: ComponentSetNode): ValidationResult {
    const errors: ValidationError[] = [];

    // Requirement 3.1: Validate all Vector_Layer nodes within all variants
    for (const variant of componentSet.children as ComponentNode[]) {
      const vectors = findVectorNodes(variant);

      for (const vector of vectors) {
        for (const rule of this.rules) {
          if (!rule.check(vector)) {
            // Requirement 3.5: Report specific validation errors with details
            errors.push({
              rule: rule.name,
              message: rule.message,
              nodeName: vector.name,
              nodeId: vector.id,
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation rules for the specified icon type
   *
   * @param iconType - The icon type (functional or illustrative)
   * @returns Array of validation rules
   */
  private getRulesForIconType(
    iconType: "functional" | "illustrative",
  ): ValidationRule[] {
    if (iconType === "functional") {
      return [
        {
          name: "stroke-width",
          check: (node) => this.checkFunctionalStrokeWidth(node),
          message: "Functional icons must have stroke width of 2px",
        },
        {
          name: "size",
          check: (node) => this.checkSize(node),
          message: "Icon size must be 32px, 24px, or 20px",
        },
      ];
    } else {
      return [
        {
          name: "stroke-width",
          check: (node) => this.checkIllustrativeStrokeWidth(node),
          message: "Illustrative icons must have stroke width of 1.5px",
        },
        {
          name: "size",
          check: (node) => this.checkSize(node),
          message: "Icon size must be 32px, 24px, or 20px",
        },
      ];
    }
  }

  /**
   * Check if functional icon stroke width is valid (2px)
   *
   * Requirement 3.2: Validate stroke width for functional icons
   */
  private checkFunctionalStrokeWidth(node: VectorNode): boolean {
    if (typeof node.strokeWeight !== "number") return true;
    return node.strokeWeight === 2;
  }

  /**
   * Check if illustrative icon stroke width is valid (1.5px)
   *
   * Requirement 3.3: Validate stroke width for illustrative icons
   */
  private checkIllustrativeStrokeWidth(node: VectorNode): boolean {
    if (typeof node.strokeWeight !== "number") return true;
    return node.strokeWeight === 1.5;
  }

  /**
   * Check if icon size is valid
   *
   * Requirement 3.4: Validate vector sizes
   */
  private checkSize(node: VectorNode): boolean {
    const validSizes = [32, 24, 20, 28, 16, 14, 12]; // Include scaled sizes
    return validSizes.includes(node.width) && validSizes.includes(node.height);
  }
}
