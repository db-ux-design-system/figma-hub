/**
 * Color Variable Applicator
 *
 * Applies color variables to icon fills.
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { ColorVariableConfig } from "../types/index.js";
import { findVectorNodes } from "../utils/selection.js";
import { ProcessingError } from "../utils/error-handler.js";

/**
 * Color Applicator class
 *
 * Applies predefined color variables to icon fills.
 */
export class ColorApplicator {
  private iconType: "functional" | "illustrative";
  private config: ColorVariableConfig;

  constructor(
    iconType: "functional" | "illustrative",
    config: ColorVariableConfig,
  ) {
    this.iconType = iconType;
    this.config = config;
  }

  /**
   * Apply color variables to all vectors in a component set
   *
   * Requirements:
   * - 6.1: Apply predefined Color_Variable values to the Component_Set
   * - 6.2: Apply color variables to all fill properties of Vector_Layer nodes
   * - 6.3: Apply functional icon color variables
   * - 6.4: Apply illustrative icon color variables
   * - 6.5: Report error when color variables are not available
   *
   * @param componentSet - The component set to process
   */
  async apply(componentSet: ComponentSetNode): Promise<void> {
    // Requirement 6.3 & 6.4: Select appropriate variable based on icon type
    const variableId =
      this.iconType === "functional"
        ? this.config.functional
        : this.config.illustrative;

    // Requirement 6.5: Report error when color variables are not available
    if (!variableId) {
      throw new ProcessingError(
        `Color variable not configured for ${this.iconType} icons`,
      );
    }

    let variable: Variable;
    try {
      variable = await figma.variables.getVariableByIdAsync(variableId);
      if (!variable) {
        throw new ProcessingError(`Color variable not found: ${variableId}`);
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to load color variable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Requirement 6.1: Apply color variables to the Component_Set
    for (const variant of componentSet.children as ComponentNode[]) {
      await this.applyToVariant(variant, variable);
    }
  }

  /**
   * Apply color variable to all vectors in a variant
   *
   * @param variant - The variant component to process
   * @param variable - The color variable to apply
   */
  private async applyToVariant(
    variant: ComponentNode,
    variable: Variable,
  ): Promise<void> {
    const vectors = findVectorNodes(variant);

    // Requirement 6.2: Apply color variables to all fill properties
    for (const vector of vectors) {
      this.applyToVector(vector, variable);
    }
  }

  /**
   * Apply color variable to a single vector's fills
   *
   * @param vector - The vector node to process
   * @param variable - The color variable to apply
   */
  private applyToVector(vector: VectorNode, variable: Variable): void {
    // Only apply to vectors with fills
    if (vector.fills !== figma.mixed && Array.isArray(vector.fills)) {
      try {
        // Bind the fill color to the variable
        vector.fills = vector.fills.map((fill) => {
          if (fill.type === "SOLID") {
            return {
              ...fill,
              boundVariables: {
                color: {
                  type: "VARIABLE_ALIAS",
                  id: variable.id,
                },
              },
            };
          }
          return fill;
        });
      } catch (error) {
        console.warn(
          `Could not apply color variable to vector ${vector.name}:`,
          error,
        );
      }
    }
  }
}
