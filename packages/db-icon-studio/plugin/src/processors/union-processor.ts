/**
 * Union Processor
 *
 * Flattens all direct children in the Container into a single vector.
 * This step runs BEFORE scaling to ensure all paths are merged into a single unified vector.
 *
 * For functional icons:
 * - Find the Container (first child of component)
 * - Find all DIRECT child layers within the Container
 * - Apply Flatten operation to combine them (creates VectorNode)
 * - Rename the result to "Vector"
 *
 * Target structure: Component -> Container -> Vector (flattened VectorNode)
 */

import { ProcessingError } from "../utils/error-handler.js";

/**
 * Union Processor class
 *
 * Flattens multiple layers into a single vector.
 */
export class UnionProcessor {
  /**
   * Apply flatten operation to all variants in a component set
   *
   * @param componentSet - The component set to process
   */
  async union(componentSet: ComponentSetNode): Promise<void> {
    try {
      console.log(`\n=== Flatten Processor (before scaling) ===`);

      for (const variant of componentSet.children as ComponentNode[]) {
        await this.unionVariant(variant);
      }

      console.log(`✓ Flatten operation complete\n`);
    } catch (error) {
      throw new ProcessingError(
        `Failed to flatten: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Apply flatten operation to direct children of container
   *
   * Strategy:
   * 1. Find the Container (first child)
   * 2. Get all DIRECT children of the Container (not nested)
   * 3. If multiple children exist, apply Flatten operation
   * 4. Rename the result to "Vector"
   *
   * @param variant - The variant component to process
   */
  private async unionVariant(variant: ComponentNode): Promise<void> {
    console.log(`Processing ${variant.name}...`);

    const container = this.findContainer(variant);

    if (!container) {
      console.warn(`  No container found, skipping`);
      return;
    }

    // Get DIRECT children of the container (not nested)
    const directChildren = this.getDirectChildren(container);

    if (directChildren.length === 0) {
      console.log(`  No children found, skipping`);
      return;
    }

    // Always flatten, even if there's only one child
    // (because that child might be a group/frame with nested vectors)
    console.log(`  Found ${directChildren.length} child(ren), flattening...`);

    try {
      // Store the parent and position info before flatten
      const firstChild = directChildren[0];
      const parent = firstChild.parent;

      if (!parent || !("children" in parent)) {
        console.warn(`  Parent is not a valid container`);
        return;
      }

      // Store absolute position of first child
      const absX = firstChild.absoluteTransform[0][2];
      const absY = firstChild.absoluteTransform[1][2];

      // Apply flatten operation (equivalent to Ctrl-E/⌘E)
      // This combines all layers into a single vector
      const flattenedVector = figma.flatten(
        directChildren as ReadonlyArray<SceneNode>,
        parent as BaseNode & ChildrenMixin,
      );

      if (flattenedVector) {
        // Rename the result to "Vector"
        flattenedVector.name = "Vector";

        // Restore position if needed
        if ("absoluteTransform" in parent) {
          const parentAbsX = (parent as any).absoluteTransform[0][2];
          const parentAbsY = (parent as any).absoluteTransform[1][2];
          flattenedVector.x = absX - parentAbsX;
          flattenedVector.y = absY - parentAbsY;
        }

        console.log(`  ✓ Flattened to "Vector" layer (VectorNode)`);
      } else {
        console.warn(`  Flatten operation returned null`);
      }
    } catch (error) {
      console.warn(
        `  Could not flatten:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Find the Container node (first child of component)
   */
  private findContainer(variant: ComponentNode): SceneNode | null {
    if (variant.children && variant.children.length > 0) {
      const firstChild = variant.children[0];

      // Ensure it's a frame or group
      if (firstChild.type === "FRAME" || firstChild.type === "GROUP") {
        return firstChild;
      }
    }
    return null;
  }

  /**
   * Get all DIRECT children of a node (not nested)
   *
   * @param node - The node to get children from
   * @returns Array of direct children
   */
  private getDirectChildren(node: SceneNode): SceneNode[] {
    if ("children" in node) {
      return Array.from(node.children);
    }
    return [];
  }
}
