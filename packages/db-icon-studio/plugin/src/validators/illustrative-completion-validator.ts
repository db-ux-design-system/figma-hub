/**
 * Illustrative Icon Completion Validator
 *
 * Validates that illustrative icons are complete and ready for export:
 * - Has exactly 1 Vector layer in Container
 * - Vector has color variables bound (not just solid colors)
 * - Structure is: Component > Container > Vector
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";

export class IllustrativeCompletionValidator {
  private readonly baseColorKey = "497497bca9694f6004d1667de59f1a903b3cd3ef"; // Black
  private readonly pulseColorKey = "998998d67d3ebef6f2692db932bce69431b3d0cc"; // Red pulse

  /**
   * Validate that illustrative icon is complete
   */
  validate(component: ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let isComplete = false;

    console.log(
      `[IllustrativeCompletionValidator] Validating: ${component.name}`,
    );

    // Get container (first child)
    if (!component.children || component.children.length === 0) {
      errors.push({ message: "Component has no container" });
      return { isValid: false, errors, warnings, isComplete };
    }

    const container = component.children[0];
    if (!("children" in container) || !container.children) {
      errors.push({ message: "Container has no children" });
      return { isValid: false, errors, warnings, isComplete };
    }

    // Check 1: Exactly 1 child in container (the Vector)
    if (container.children.length !== 1) {
      errors.push({
        message: `Container should have exactly 1 Vector layer, found ${container.children.length}`,
      });
      return { isValid: false, errors, warnings, isComplete };
    }

    const vector = container.children[0];

    // Check 2: Child is named "Vector"
    if (vector.name !== "Vector") {
      errors.push({
        message: `Layer should be named "Vector", found "${vector.name}"`,
      });
      return { isValid: false, errors, warnings, isComplete };
    }

    // Check 3: Vector has color variables bound
    const hasVariables = this.hasColorVariablesBound(vector);
    if (!hasVariables) {
      errors.push({
        message:
          "Vector does not have color variables bound. Run the workflow to apply colors.",
      });
      return { isValid: false, errors, warnings, isComplete };
    }

    // All checks passed
    isComplete = true;
    console.log(
      `[IllustrativeCompletionValidator] ✓ Icon is complete and ready`,
    );

    return {
      isValid: true,
      errors,
      warnings,
      isComplete,
    };
  }

  /**
   * Check if vector has color variables bound (not just solid colors)
   */
  private hasColorVariablesBound(node: SceneNode): boolean {
    console.log(
      `  Checking for bound variables in: ${node.name} (${node.type})`,
    );

    // For Vector Networks with mixed fills, check if vectorNetwork regions have bound variables
    if (node.type === "VECTOR" && "vectorNetwork" in node) {
      const vectorNode = node as VectorNode;
      const network = vectorNode.vectorNetwork;

      if (network.regions && network.regions.length > 0) {
        console.log(`    Vector has ${network.regions.length} regions`);

        let hasBase = false;
        let hasPulse = false;

        // Check each region's fills for bound variables
        for (let i = 0; i < network.regions.length; i++) {
          const region = network.regions[i];
          if (region.fills && region.fills.length > 0) {
            for (const fill of region.fills) {
              if (
                fill.type === "SOLID" &&
                "boundVariables" in fill &&
                fill.boundVariables &&
                "color" in fill.boundVariables
              ) {
                const colorVar = fill.boundVariables.color;
                if (
                  colorVar &&
                  typeof colorVar === "object" &&
                  "id" in colorVar
                ) {
                  const varId = String(colorVar.id);
                  console.log(`      Region ${i} has variable ID: ${varId}`);

                  // Check if it matches our expected variables
                  if (varId.includes(this.baseColorKey)) {
                    hasBase = true;
                    console.log(`      ✓ Found base color variable`);
                  }
                  if (varId.includes(this.pulseColorKey)) {
                    hasPulse = true;
                    console.log(`      ✓ Found pulse color variable`);
                  }
                }
              }
            }
          }
        }

        if (hasBase && hasPulse) {
          console.log(`    ✓ Vector has both base and pulse variables bound`);
          return true;
        } else {
          console.log(
            `    ✗ Missing variables: base=${hasBase}, pulse=${hasPulse}`,
          );
          return false;
        }
      }
    }

    // Fallback: Check if node has fills property with boundVariables (for non-Vector-Network nodes)
    if ("fills" in node) {
      const fills = node.fills;

      if (Array.isArray(fills)) {
        for (const fill of fills) {
          if (
            fill.type === "SOLID" &&
            "boundVariables" in fill &&
            fill.boundVariables &&
            "color" in fill.boundVariables
          ) {
            console.log(`    ✓ Found bound variable on fill`);
            return true;
          }
        }
      }
    }

    console.log(`    ✗ No bound variables found`);
    return false;
  }
}
