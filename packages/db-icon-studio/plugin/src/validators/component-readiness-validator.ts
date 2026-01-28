/**
 * Component Readiness Validator
 *
 * Validates that vectors in components are properly processed:
 * - Outline stroked (no strokes, only fills)
 * - Unified (no overlapping paths)
 * - Flattened (single vector node, no groups)
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";

export class ComponentReadinessValidator {
  /**
   * Validate a single component variant
   */
  validate(component: ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Find the Container frame or use component directly
    const container = this.findContainer(component);
    const childrenToCheck = container ? container.children : component.children;
    const containerName = container ? "Container" : component.name;

    if (!childrenToCheck || childrenToCheck.length === 0) {
      errors.push({
        message: `${containerName} is empty in "${component.name}"<br>Expected: Single flattened vector`,
        node: component.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    if (childrenToCheck.length > 1) {
      errors.push({
        message: `${containerName} has ${childrenToCheck.length} children in "${component.name}"<br>Expected: Single flattened vector<br>Action: Flatten all vectors (Cmd + E)`,
        node: component.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Get the single child
    const child = childrenToCheck[0];

    // Check if it's a vector node
    const vectorTypes = [
      "VECTOR",
      "BOOLEAN_OPERATION",
      "STAR",
      "LINE",
      "ELLIPSE",
      "POLYGON",
      "RECTANGLE",
    ];

    if (!vectorTypes.includes(child.type)) {
      errors.push({
        message: `Container child is not a vector in "${component.name}"<br>Found: ${child.type}<br>Expected: VECTOR`,
        node: component.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Check if it's outline stroked (no strokes, only fills)
    const hasStrokes =
      "strokes" in child &&
      child.strokes &&
      Array.isArray(child.strokes) &&
      child.strokes.length > 0 &&
      "strokeWeight" in child &&
      (child.strokeWeight as number) > 0;

    if (hasStrokes) {
      errors.push({
        message: `Vector still has strokes in "${component.name}"<br>Action: Convert to outline (Shift + Cmd + O)`,
        node: component.name,
      });
    }

    // Check if it has fills
    const hasFills =
      "fills" in child &&
      child.fills &&
      Array.isArray(child.fills) &&
      child.fills.length > 0;

    if (!hasFills) {
      errors.push({
        message: `Vector has no fills in "${component.name}"<br>Expected: Vector with fills after outline stroke`,
        node: component.name,
      });
    }

    // Check if it's a BOOLEAN_OPERATION (indicates not unified)
    if (child.type === "BOOLEAN_OPERATION") {
      warnings.push({
        message: `Vector is a boolean operation in "${component.name}"<br>Consider: Union selection (Cmd + Opt + U) for cleaner paths`,
        node: component.name,
        canProceed: true,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all variants in a component set
   */
  validateComponentSet(componentSet: ComponentSetNode): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    console.log(
      "[ComponentReadinessValidator] Validating component set:",
      componentSet.name,
    );

    // Validate that we have exactly 3 base sizes: 32, 24, 20
    const baseSizes = [32, 24, 20];
    const foundSizes: { [key: number]: number } = {}; // size -> count

    console.log(
      "[ComponentReadinessValidator] Total variants:",
      componentSet.children.length,
    );

    for (const variant of componentSet.children as ComponentNode[]) {
      console.log(
        "[ComponentReadinessValidator] Checking variant:",
        variant.name,
      );
      // Extract size from variant name (e.g., "Size=32, Variant=(Def) Outlined")
      const sizeMatch = variant.name.match(/Size=(\d+)/);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]);
        foundSizes[size] = (foundSizes[size] || 0) + 1;
        console.log(
          "[ComponentReadinessValidator] Found size:",
          size,
          "count:",
          foundSizes[size],
        );
      } else {
        console.log(
          "[ComponentReadinessValidator] No size found in variant name",
        );
      }
    }

    console.log("[ComponentReadinessValidator] All found sizes:", foundSizes);

    // Check for exact duplicate variant names
    const variantNames: { [key: string]: number } = {};
    for (const variant of componentSet.children as ComponentNode[]) {
      const name = variant.name;
      variantNames[name] = (variantNames[name] || 0) + 1;

      if (variantNames[name] > 1) {
        console.log(
          "[ComponentReadinessValidator] ERROR: Duplicate variant detected:",
          name,
        );
        allErrors.push({
          message: `Duplicate variant "${name}" found ${variantNames[name]} times in component set "${componentSet.name}"<br>Expected: Each variant should be unique`,
          node: componentSet.name,
        });
      }
    }

    // Check for duplicate sizes (more than 2 variants per size)
    for (const [size, count] of Object.entries(foundSizes)) {
      console.log(
        "[ComponentReadinessValidator] Checking size:",
        size,
        "count:",
        count,
      );
      if (count > 2) {
        console.log(
          "[ComponentReadinessValidator] ERROR: Too many variants for size",
        );
        allErrors.push({
          message: `Size ${size}px has ${count} variants in component set "${componentSet.name}"<br>Expected: Maximum 2 variants per size (Outlined + Filled)`,
          node: componentSet.name,
        });
      }
    }

    // Check for additional/wrong sizes (sizes that are not in base sizes)
    const allSizes = Object.keys(foundSizes).map(Number);
    const wrongSizes = allSizes.filter((size) => !baseSizes.includes(size));

    console.log("[ComponentReadinessValidator] All sizes:", allSizes);
    console.log("[ComponentReadinessValidator] Wrong sizes:", wrongSizes);

    if (wrongSizes.length > 0) {
      console.log(
        "[ComponentReadinessValidator] ERROR: Invalid sizes detected",
      );
      allErrors.push({
        message: `Invalid size(s) found: ${wrongSizes.join("px, ")}px in component set "${componentSet.name}"<br>Only base sizes allowed before scaling: 32px, 24px, 20px<br>Action: Remove invalid sizes or run "Create Icon Set" to generate scaled variants`,
        node: componentSet.name,
      });
    }

    // Validate each variant
    for (const variant of componentSet.children as ComponentNode[]) {
      const result = this.validate(variant);
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    console.log(
      "[ComponentReadinessValidator] Total errors:",
      allErrors.length,
    );
    console.log(
      "[ComponentReadinessValidator] Total warnings:",
      allWarnings.length,
    );

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Find the Container frame in a component
   */
  private findContainer(component: ComponentNode): FrameNode | null {
    if (!component.children) {
      return null;
    }

    for (const child of component.children) {
      if (
        child.type === "FRAME" &&
        child.name.toLowerCase().includes("container")
      ) {
        return child as FrameNode;
      }
    }

    return null;
  }
}
