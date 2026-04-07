/**
 * Flatten Processor
 *
 * Flattens multiple vector layers into a single layer.
 * Implements Requirements 5.1, 5.2, 5.3, 5.4
 *
 * For functional icons:
 * - Find the Container (first child of component)
 * - Select all direct child layers within the Container
 * - Flatten them into a single vector layer
 *
 * Target structure: Component -> Container -> Vector
 */

import { ProcessingError } from "../utils/error-handler.js";

/**
 * Flatten Processor class
 *
 * Combines multiple vector layers into a single layer.
 */
export class FlattenProcessor {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative" = "functional") {
    this.iconType = iconType;
  }

  /**
   * Flatten all vectors in a component set
   *
   * Requirements:
   * - 5.1: Combine all Vector_Layer nodes into a single layer
   * - 5.2: Perform Flatten_Operation after Outline_Conversion
   * - 5.3: Maintain visual integrity of the icon
   * - 5.4: Preserve all vector paths during flattening
   *
   * @param componentSet - The component set to process
   */
  async flatten(componentSet: ComponentSetNode): Promise<void> {
    try {
      // Requirement 5.1: Combine all Vector_Layer nodes into a single layer
      for (const variant of componentSet.children as ComponentNode[]) {
        await this.flattenVariant(variant);
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to flatten vectors: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Flatten all vectors in a variant
   *
   * NOTE: With the new outline converter strategy, all children are already
   * flattened into a single "Vector" layer during outline conversion.
   * This method now just ensures the layer is named correctly.
   *
   * Strategy:
   * 1. Find the Container (first child)
   * 2. Check if there's already a single "Vector" layer
   * 3. If not, rename the single layer to "Vector"
   *
   * Final structure: Component -> Container -> Vector
   *
   * @param variant - The variant component to process
   */
  private async flattenVariant(variant: ComponentNode): Promise<void> {
    if (this.iconType === "functional") {
      // For functional icons: Component -> Container -> Vector
      const container = this.findContainer(variant);

      if (!container) {
        console.warn(`No container found in variant ${variant.name}`);
        return;
      }

      // Get all direct children of the Container
      const children = this.getDirectChildren(container);

      if (children.length === 0) {
        console.log(
          `No children found in container of ${variant.name} - may be empty`,
        );
        return;
      }

      // If there's only one child, ensure it's named "Vector"
      if (children.length === 1) {
        if (children[0].name !== "Vector") {
          children[0].name = "Vector";
          console.log(`Renamed single layer to "Vector" in ${variant.name}`);
        } else {
          console.log(
            `Single "Vector" layer already exists in ${variant.name}`,
          );
        }
        return;
      }

      // If there are multiple children, flatten them
      // (This should not happen if outline conversion ran first, but handle it anyway)
      try {
        console.log(
          `Warning: Found ${children.length} children in ${variant.name} - flattening them`,
        );

        // Select all children
        figma.currentPage.selection = children;

        // Flatten them
        const flattened = await figma.flatten(children);

        if (flattened) {
          flattened.name = "Vector";
          console.log(
            `Flattened ${children.length} layers in ${variant.name} into single "Vector" layer`,
          );
        }
      } catch (error) {
        console.warn(
          `Could not flatten layers in variant ${variant.name}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      // For illustrative icons: use simple approach
      const vectors = this.findAllVectorsInNode(variant);

      if (vectors.length > 1) {
        try {
          figma.currentPage.selection = vectors;
          await figma.flatten(vectors);
          console.log(`Flattened ${vectors.length} vectors in ${variant.name}`);
        } catch (error) {
          console.warn(
            `Could not flatten vectors in variant ${variant.name}:`,
            error,
          );
        }
      } else if (vectors.length === 1) {
        console.log(`Single vector already exists in ${variant.name}`);
      } else {
        console.log(`No vectors found in ${variant.name}`);
      }
    }
  }

  /**
   * Find the Container node (first child of component)
   */
  private findContainer(variant: ComponentNode): SceneNode | null {
    if (variant.children && variant.children.length > 0) {
      // The container is typically the first child
      const firstChild = variant.children[0];

      // Ensure it's a frame or group
      if (firstChild.type === "FRAME" || firstChild.type === "GROUP") {
        return firstChild;
      }
    }
    return null;
  }

  /**
   * Get all direct children of a node
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

  /**
   * Find all vector-like nodes within a node, including nested in groups
   *
   * Includes: VECTOR, STAR, LINE, ELLIPSE, POLYGON, RECTANGLE, BOOLEAN_OPERATION
   *
   * @param node - The node to search
   * @returns Array of all vector-like nodes found
   */
  private findAllVectorsInNode(node: SceneNode): SceneNode[] {
    const vectors: SceneNode[] = [];

    // Include all vector-like node types
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

    // Recursively search children
    if ("children" in node) {
      for (const child of node.children) {
        vectors.push(...this.findAllVectorsInNode(child));
      }
    }

    return vectors;
  }
}
