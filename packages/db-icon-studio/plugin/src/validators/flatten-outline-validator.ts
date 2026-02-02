/**
 * Flatten & Outline Validator
 *
 * Validates that icons are properly flattened and outlined before processing.
 * Checks if vectors still have strokes (not outlined) or if there are multiple vectors (not flattened).
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";

/**
 * Flatten & Outline Validator class
 *
 * Validates that icons are ready for processing (flattened and outlined).
 */
export class FlattenOutlineValidator {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative") {
    this.iconType = iconType;
  }

  /**
   * Validate that icons are flattened and outlined
   *
   * @param componentSetOrComponent - The component set or component to validate
   * @returns Validation result with instructions if not ready
   */
  validate(
    componentSetOrComponent: ComponentSetNode | ComponentNode,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    console.log(
      `[FlattenOutlineValidator] Validating ${this.iconType} icon: ${componentSetOrComponent.name}`,
    );

    // Get all variants to check
    const variants: ComponentNode[] =
      componentSetOrComponent.type === "COMPONENT_SET"
        ? (componentSetOrComponent.children as ComponentNode[])
        : [componentSetOrComponent];

    let hasStrokesCount = 0;
    let notFlattenedCount = 0;

    for (const variant of variants) {
      const result = this.validateVariant(variant);
      if (result.hasStrokes) hasStrokesCount++;
      if (result.notFlattened) notFlattenedCount++;
    }

    // Generate error messages based on findings
    if (hasStrokesCount > 0 || notFlattenedCount > 0) {
      let instructions = "";

      if (hasStrokesCount > 0 && notFlattenedCount > 0) {
        // Both issues - show correct order: Outline FIRST, then Flatten
        instructions = `<ol class="list-decimal list-inside pl-fix-md my-fix-xs">
<li>Select all vectors in the icon</li>
<li>Outline Stroke (Opt+Cmd+O / ⌥ ⌘ O)</li>
<li>Boolean Groups > Union (Opt+Shift+U / ⌥ ⇧ U)</li>
<li>Flatten Selection (Opt+Shift+F / ⌥ ⇧ F)</li>
</ol>
<p class="mt-2"><strong>Note:</strong> Outline BEFORE Flatten to preserve different stroke widths!</p>`;
      } else if (hasStrokesCount > 0) {
        // Only outline needed
        instructions = `<ol class="list-decimal list-inside pl-fix-md my-fix-xs">
<li>Outline Stroke (Opt+Cmd+O / ⌥ ⌘ O)</li>
</ol>`;
      } else if (notFlattenedCount > 0) {
        // Only flatten needed (strokes already outlined)
        instructions = `<ol class="list-decimal list-inside pl-fix-md my-fix-xs">
<li>Select all vectors in the icon</li>
<li>Flatten Selection (Opt+Shift+F / ⌥ ⇧ F)</li>
</ol>`;
      }

      errors.push({
        message: `Please prepare your icon manually in Figma first:${instructions}`,
      });
    }

    console.log(
      `[FlattenOutlineValidator] Validation complete. Ready: ${errors.length === 0}`,
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single variant
   */
  private validateVariant(variant: ComponentNode): {
    hasStrokes: boolean;
    notFlattened: boolean;
  } {
    console.log(`[FlattenOutlineValidator] Checking variant: ${variant.name}`);

    // Get container (first child)
    if (!variant.children || variant.children.length === 0) {
      console.log(`  No container found`);
      return { hasStrokes: false, notFlattened: false };
    }

    const container = variant.children[0];
    if (!("children" in container) || !container.children) {
      console.log(`  Container has no children`);
      return { hasStrokes: false, notFlattened: false };
    }

    // Find all vectors recursively
    const vectors = this.findAllVectorsInNode(container);
    console.log(`  Found ${vectors.length} vectors`);

    // Check if any vector has strokes
    let hasStrokes = false;
    for (const vector of vectors) {
      if (
        "strokes" in vector &&
        Array.isArray(vector.strokes) &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        typeof vector.strokeWeight === "number" &&
        vector.strokeWeight > 0
      ) {
        hasStrokes = true;
        console.log(`  Vector "${vector.name}" has strokes (not outlined)`);
        break;
      }
    }

    // Check if vectors are flattened (should be 1 or 2 vectors max)
    // For functional icons: 1 vector
    // For illustrative icons: 2 vectors (Base and Pulse)
    const expectedVectorCount = this.iconType === "illustrative" ? 2 : 1;
    const notFlattened = vectors.length > expectedVectorCount;

    if (notFlattened) {
      console.log(
        `  Not flattened: found ${vectors.length} vectors, expected ${expectedVectorCount}`,
      );
    }

    return { hasStrokes, notFlattened };
  }

  /**
   * Find all vector nodes recursively
   */
  private findAllVectorsInNode(node: SceneNode): SceneNode[] {
    const vectors: SceneNode[] = [];
    const vectorTypes = [
      "VECTOR",
      "STAR",
      "LINE",
      "ELLIPSE",
      "POLYGON",
      "RECTANGLE",
      "BOOLEAN_OPERATION",
    ];

    if (vectorTypes.includes(node.type)) {
      vectors.push(node);
    }

    if ("children" in node) {
      for (const child of node.children) {
        vectors.push(...this.findAllVectorsInNode(child));
      }
    }

    return vectors;
  }

  /**
   * Remove empty groups and flatten structure
   * This is called after validation passes to clean up the structure
   */
  cleanupStructure(variant: ComponentNode): void {
    console.log(
      `[FlattenOutlineValidator] Cleaning up structure for: ${variant.name}`,
    );

    // Get container
    if (!variant.children || variant.children.length === 0) {
      return;
    }

    const container = variant.children[0];
    if (!("children" in container) || !container.children) {
      return;
    }

    // Find the icon frame (direct child of container)
    let iconFrame: SceneNode | null = null;
    for (const child of container.children) {
      if (child.type === "FRAME" || child.type === "GROUP") {
        iconFrame = child;
        break;
      }
    }

    if (!iconFrame || !("children" in iconFrame)) {
      return;
    }

    // Move all vectors from subgroups to iconFrame
    const vectorsToMove: SceneNode[] = [];
    const groupsToRemove: SceneNode[] = [];

    for (const child of Array.from(iconFrame.children)) {
      if (child.type === "GROUP" || child.type === "FRAME") {
        // This is a subgroup - collect its vectors
        const vectors = this.findAllVectorsInNode(child);
        vectorsToMove.push(...vectors);
        groupsToRemove.push(child);
      }
    }

    // Move vectors to iconFrame
    for (const vector of vectorsToMove) {
      if (vector.parent !== iconFrame) {
        const absX = vector.absoluteTransform[0][2];
        const absY = vector.absoluteTransform[1][2];
        const iconFrameAbsX = (iconFrame as any).absoluteTransform[0][2];
        const iconFrameAbsY = (iconFrame as any).absoluteTransform[1][2];

        (iconFrame as any).appendChild(vector);
        vector.x = absX - iconFrameAbsX;
        vector.y = absY - iconFrameAbsY;

        console.log(
          `  Moved vector "${vector.name}" to iconFrame at (${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`,
        );
      }
    }

    // Remove empty groups
    for (const group of groupsToRemove) {
      if (
        !group.removed &&
        "children" in group &&
        group.children.length === 0
      ) {
        console.log(`  Removing empty group: "${group.name}"`);
        group.remove();
      }
    }

    console.log(`  ✓ Structure cleanup complete`);
  }
}
