/**
 * Vector Validator
 *
 * Validates vector properties according to icon type guidelines.
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";
import { findVectorNodes } from "../utils/selection.js";

/**
 * Validation rule result
 */
interface ValidationRuleResult {
  type: "pass" | "error" | "warning";
}

/**
 * Validation rule definition
 */
interface ValidationRule {
  name: string;
  check: (node: VectorNode) => ValidationRuleResult;
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
   * - 3.2: Validate stroke width for functional icons (warning if not 2px)
   * - 3.3: Validate stroke width for illustrative icons (error if not 2px)
   * - 3.4: Validate vector sizes
   * - 3.5: Report specific validation errors with details
   *
   * @param componentSet - The component set to validate
   * @returns Validation result with any errors/warnings found
   */
  validate(componentSet: ComponentSetNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Track stroke width issues
    let strokeWidthIssueCount = 0;
    let firstStrokeWidthValue: number | null = null;

    console.log(
      `[VectorValidator] Validating ${this.iconType} icon: ${componentSet.name}`,
    );

    // Requirement 3.1: Validate all Vector_Layer nodes within all variants
    for (const variant of componentSet.children as ComponentNode[]) {
      console.log(
        `[VectorValidator] Checking variant: ${variant.name}, type: ${variant.type}, children count: ${variant.children?.length || 0}`,
      );

      // Log first level children
      if (variant.children) {
        for (const child of variant.children) {
          console.log(
            `[VectorValidator]   Child: ${child.name}, type: ${child.type}`,
          );
        }
      }

      const vectors = findVectorNodes(variant);
      console.log(
        `[VectorValidator] Found ${vectors.length} vector nodes in variant: ${variant.name}`,
      );

      for (const vector of vectors) {
        // Log stroke width for debugging
        if (typeof vector.strokeWeight === "number") {
          console.log(
            `[VectorValidator] Vector "${vector.name}" stroke width: ${vector.strokeWeight}px`,
          );
        } else {
          console.log(
            `[VectorValidator] Vector "${vector.name}" has no stroke weight defined`,
          );
        }

        for (const rule of this.rules) {
          const result = rule.check(vector);

          if (result.type === "error") {
            // Track stroke width issues for summary
            if (rule.name === "stroke-width") {
              strokeWidthIssueCount++;
              if (
                firstStrokeWidthValue === null &&
                typeof vector.strokeWeight === "number"
              ) {
                firstStrokeWidthValue = vector.strokeWeight;
              }
            } else {
              // Add non-stroke-width errors directly
              console.log(
                `[VectorValidator] ❌ Validation failed for "${vector.name}": ${rule.message}`,
              );
              errors.push({
                message: rule.message,
                node: vector.name,
              });
            }
          } else if (result.type === "warning") {
            // Track stroke width warnings for summary
            if (rule.name === "stroke-width") {
              strokeWidthIssueCount++;
              if (
                firstStrokeWidthValue === null &&
                typeof vector.strokeWeight === "number"
              ) {
                firstStrokeWidthValue = vector.strokeWeight;
              }
            } else {
              console.log(
                `[VectorValidator] ⚠️ Warning for "${vector.name}": ${rule.message}`,
              );
              warnings.push({
                message: rule.message,
                node: vector.name,
                canProceed: true,
              });
            }
          } else if (rule.name === "stroke-width") {
            console.log(
              `[VectorValidator] ✓ Stroke width validation passed for "${vector.name}"`,
            );
          }
        }
      }
    }

    // Add summarized stroke width error/warning
    if (strokeWidthIssueCount > 0) {
      const strokeWidthMessage =
        this.iconType === "illustrative"
          ? `The stroke width should be 2px (found ${strokeWidthIssueCount} vector${strokeWidthIssueCount > 1 ? "s" : ""} with ${firstStrokeWidthValue}px)`
          : `The stroke width should be 2px (found ${strokeWidthIssueCount} vector${strokeWidthIssueCount > 1 ? "s" : ""} with ${firstStrokeWidthValue}px). You can proceed, but the result may not match design guidelines.`;

      if (this.iconType === "illustrative") {
        console.log(`[VectorValidator] ❌ ${strokeWidthMessage}`);
        errors.push({
          message: strokeWidthMessage,
        });
      } else {
        console.log(`[VectorValidator] ⚠️ ${strokeWidthMessage}`);
        warnings.push({
          message: strokeWidthMessage,
          canProceed: true,
        });
      }
    }

    console.log(
      `[VectorValidator] Validation complete. Errors: ${errors.length}, Warnings: ${warnings.length}`,
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
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
      // Functional icons only validate stroke width at vector level
      // (size is validated at component level by SizeValidator)
      return [
        {
          name: "stroke-width",
          check: (node) => this.checkStrokeWidthFunctional(node),
          message:
            "The stroke width should be 2px. You can proceed, but the result may not match design guidelines.",
        },
      ];
    } else {
      // Illustrative icons only validate stroke width, not vector sizes
      // (illustrative icons are 64px at component level, not vector level)
      return [
        {
          name: "stroke-width",
          check: (node) => this.checkStrokeWidthIllustrative(node),
          message:
            "Illustrative icons must have stroke width of 2px before processing",
        },
      ];
    }
  }

  /**
   * Check stroke width for functional icons (warning if not 2px)
   *
   * Requirement 3.2: Validate stroke width for functional icons (2px)
   * Note: Fill-only vectors (without strokes) are valid and should not be checked
   */
  private checkStrokeWidthFunctional(node: VectorNode): ValidationRuleResult {
    // Check if the vector has any strokes applied
    const hasStroke =
      node.strokes && node.strokes.length > 0 && node.strokeWeight !== 0;

    if (!hasStroke) {
      console.log(
        `[VectorValidator] Node "${node.name}" has no stroke (fill-only), skipping stroke width validation`,
      );
      return { type: "pass" };
    }

    if (typeof node.strokeWeight !== "number") {
      console.log(
        `[VectorValidator] Node "${node.name}" has no numeric stroke weight, skipping validation`,
      );
      return { type: "pass" };
    }

    const isValid = node.strokeWeight === 2;

    if (!isValid) {
      console.log(
        `[VectorValidator] ⚠️ Stroke width mismatch for "${node.name}": expected 2px, got ${node.strokeWeight}px (warning)`,
      );
      return { type: "warning" };
    }

    return { type: "pass" };
  }

  /**
   * Check stroke width for illustrative icons (error if not 2px)
   *
   * Requirement 3.3: Validate stroke width for illustrative icons (2px)
   * Note: Fill-only vectors (without strokes) are valid and should not be checked
   */
  private checkStrokeWidthIllustrative(node: VectorNode): ValidationRuleResult {
    // Check if the vector has any strokes applied
    const hasStroke =
      node.strokes && node.strokes.length > 0 && node.strokeWeight !== 0;

    if (!hasStroke) {
      console.log(
        `[VectorValidator] Node "${node.name}" has no stroke (fill-only), skipping stroke width validation`,
      );
      return { type: "pass" };
    }

    if (typeof node.strokeWeight !== "number") {
      console.log(
        `[VectorValidator] Node "${node.name}" has no numeric stroke weight, skipping validation`,
      );
      return { type: "pass" };
    }

    const isValid = node.strokeWeight === 2;

    if (!isValid) {
      console.log(
        `[VectorValidator] ❌ Stroke width mismatch for "${node.name}": expected 2px, got ${node.strokeWeight}px (error)`,
      );
      return { type: "error" };
    }

    return { type: "pass" };
  }

  /**
   * Check if icon size is valid
   *
   * Requirement 3.4: Validate vector sizes
   */
  private checkSize(node: VectorNode): ValidationRuleResult {
    const validSizes = [32, 24, 20, 28, 16, 14, 12]; // Include scaled sizes
    const isValid =
      validSizes.includes(node.width) && validSizes.includes(node.height);
    return { type: isValid ? "pass" : "error" };
  }
}
