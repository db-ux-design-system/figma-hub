/**
 * Illustrative Flatten Processor
 *
 * Flattens all direct children in the Container into a single Vector.
 * This step runs BEFORE color application for illustrative icons.
 *
 * For illustrative icons:
 * - Find the Container (first child of component)
 * - Find all DIRECT child layers within the Container
 * - Flatten all children together into one Vector
 *
 * Target structure: Component > Container > Vector (with black and red fills)
 */

import { ProcessingError } from "../utils/error-handler.js";

/**
 * Illustrative Flatten Processor class
 *
 * Flattens illustrative icon layers into a single Vector.
 */
export class IllustrativeFlattenProcessor {
  /**
   * Apply flatten to an illustrative icon component
   *
   * @param component - The component to process
   */
  async process(component: ComponentNode): Promise<void> {
    try {
      console.log(`\n=== Flatten Illustrative Icon: ${component.name} ===`);

      const container = this.findContainer(component);

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

        if (!flattenedVector) {
          console.warn(`  Flatten operation returned null`);
          return;
        }

        // Rename to "Vector"
        flattenedVector.name = "Vector";
        console.log(`  ✓ Flattened to "Vector"`);

        // Restore position if needed
        if ("absoluteTransform" in parent) {
          const parentAbsX = (parent as any).absoluteTransform[0][2];
          const parentAbsY = (parent as any).absoluteTransform[1][2];
          flattenedVector.x = absX - parentAbsX;
          flattenedVector.y = absY - parentAbsY;
        }
      } catch (error) {
        console.warn(
          `  Could not flatten:`,
          error instanceof Error ? error.message : String(error),
        );
      }

      console.log(`✓ Illustrative flatten complete\n`);
    } catch (error) {
      throw new ProcessingError(
        `Failed to flatten illustrative icon: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Find the Container node (first child of component)
   */
  private findContainer(component: ComponentNode): SceneNode | null {
    if (component.children && component.children.length > 0) {
      const firstChild = component.children[0];

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
