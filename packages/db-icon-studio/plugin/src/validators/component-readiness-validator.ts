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
   * Extract variant info from variant name
   * E.g., "Size=32, Variant=(Def) Outlined" -> { variant: "(Def) Outlined", size: "32px" }
   */
  private extractVariantInfo(variantName: string): {
    variant: string;
    size: string;
  } {
    const sizeMatch = variantName.match(/Size=(\d+)/);
    const variantMatch = variantName.match(/Variant=([^,]+)/);

    const size = sizeMatch ? `${sizeMatch[1]}px` : "unknown size";
    const variant = variantMatch ? variantMatch[1].trim() : "unknown variant";

    return { variant, size };
  }

  /**
   * Validate a single component variant
   */
  validate(component: ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Extract variant info for better error messages
    const { variant, size } = this.extractVariantInfo(component.name);

    // Find the Container frame or use component directly
    const container = this.findContainer(component);
    const childrenToCheck = container ? container.children : component.children;

    if (!childrenToCheck || childrenToCheck.length === 0) {
      errors.push({
        message: `<strong>${variant}, ${size}: Empty container in variant</strong><br>Please add vector content to this variant`,
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
        message: `Multiple vectors in variant: ${variant}, ${size}<br>Found ${childrenToCheck.length} separate vectors<br>Please flatten all vectors into one (Cmd + E)`,
        node: component.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Get the single child - can be VECTOR, FRAME, or GROUP
    const child = childrenToCheck[0];

    // Recursively collect all vector nodes
    const vectors = this.collectVectorNodes(child);

    if (vectors.length === 0) {
      errors.push({
        message: `No vector content in variant: <strong>${variant}, ${size}</strong><br>Please add vector shapes to this variant`,
        node: component.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Collect all issues for this variant
    const issues: string[] = [];

    // Check if vectors are outline stroked (no strokes, only fills)
    let hasStrokes = false;
    for (const vector of vectors) {
      const vectorHasStrokes =
        "strokes" in vector &&
        vector.strokes &&
        Array.isArray(vector.strokes) &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        (vector.strokeWeight as number) > 0;

      if (vectorHasStrokes) {
        hasStrokes = true;
        break;
      }
    }

    // Check if there are multiple vectors (not flattened yet)
    const isNotFlattened = vectors.length > 1;

    // Check if vectors have fills
    let hasAnyFills = false;
    for (const vector of vectors) {
      const hasFills =
        "fills" in vector &&
        vector.fills &&
        Array.isArray(vector.fills) &&
        vector.fills.length > 0;

      if (hasFills) {
        hasAnyFills = true;
        break;
      }
    }

    // Determine the current state and required next steps
    if (hasStrokes) {
      // Case 1: Still has strokes → outline stroke → unify → flatten
      issues.push(
        "Strokes not converted<br>➔ Outline Stroke ➔ Unify ➔ Flatten",
      );
    } else if (!hasAnyFills) {
      // No fills and no strokes - something is wrong
      issues.push("No fills found");
    } else if (isNotFlattened) {
      // Case 2 & 3: Already has fills but not flattened
      // We can't detect if unify was done, so we show both steps
      issues.push(
        `<strong>${vectors.length} separate vectors</strong><br>➔ Unify ➔ Flatten`,
      );
    }
    // Case 4: Already flattened (vectors.length === 1) and has fills
    // This is the desired state, no error needed
    // Note: We cannot detect if unify was done before flatten

    // If there are issues, create a single combined error message
    if (issues.length > 0) {
      const issuesText = issues.join(", ");
      errors.push({
        message: `<strong>${variant}, ${size}:</strong> ${issuesText}`,
        node: component.name,
      });
    }

    // Check if any vector is a BOOLEAN_OPERATION (indicates not unified)
    const hasBooleanOps = vectors.some(
      (vector) => vector.type === "BOOLEAN_OPERATION",
    );
    if (hasBooleanOps) {
      warnings.push({
        message: `Boolean operation in variant: ${variant}, ${size}<br>Consider unioning paths for cleaner output (Cmd + Opt + U)`,
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
   * Recursively collect all vector nodes from a node tree
   */
  private collectVectorNodes(node: SceneNode): SceneNode[] {
    const vectorTypes = [
      "VECTOR",
      "STAR",
      "LINE",
      "ELLIPSE",
      "POLYGON",
      "RECTANGLE",
    ];

    // If this node is a vector, return it
    if (vectorTypes.includes(node.type)) {
      return [node];
    }

    // If this node has children (including BOOLEAN_OPERATION), recursively collect vectors from children
    if ("children" in node && node.children) {
      const vectors: SceneNode[] = [];
      for (const child of node.children) {
        vectors.push(...this.collectVectorNodes(child));
      }
      return vectors;
    }

    // Not a vector and has no children
    return [];
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
        const { variant: variantType, size } = this.extractVariantInfo(name);
        console.log(
          "[ComponentReadinessValidator] ERROR: Duplicate variant detected:",
          name,
        );
        allErrors.push({
          message: `Duplicate variant found: ${variantType}, ${size}<br>This variant exists ${variantNames[name]} times<br>Please remove duplicate variants`,
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
          message: `Too many variants for ${size}px<br>Found ${count} variants, expected maximum 2 (Outlined + Filled)<br>Please remove extra variants`,
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
        message: `Invalid icon sizes found: ${wrongSizes.join("px, ")}px<br>Only base sizes allowed before scaling: 32px, 24px, 20px<br>Please remove invalid sizes or run "Create Icon Set" to generate all sizes`,
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

    // Check if any readiness errors exist (empty container, invalid content, strokes not converted, not flattened)
    const hasReadinessErrors = allErrors.some(
      (error) =>
        error.message.includes("Empty container") ||
        error.message.includes("Invalid content") ||
        error.message.includes("Strokes not converted") ||
        error.message.includes("separate vectors"),
    );

    // Add preparation steps hint at the beginning if any readiness errors exist
    if (hasReadinessErrors) {
      allErrors.unshift({
        message: `<p>Please prepare your icon manually in Figma first:</p><ol class="list-decimal list-inside pl-fix-md my-fix-xs">
<li><strong>Select all vectors</strong> in the icon</li>
<li><strong>Outline Stroke</strong> (Opt+Cmd+O / ⌥ ⌘ O)</li>
<li><strong>Boolean Groups > Union</strong> (Opt+Shift+U / ⌥ ⇧ U)</li>
<li><strong>Flatten Selection</strong> (Opt+Shift+F / ⌥ ⇧ F)</li>
</ol>
<p><strong>Note:</strong> Outline BEFORE Flatten to preserve different stroke widths!</p>`,
        node: componentSet.name,
      });
    }

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
