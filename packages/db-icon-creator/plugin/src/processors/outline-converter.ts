/**
 * Outline Converter
 *
 * Converts vector strokes to fills (outline conversion).
 * Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * Strategy:
 * 1. Set all strokes to CENTER alignment
 * 2. Flatten all direct children in Container into one layer (groups are flattened WITH their content)
 * 3. Apply outline stroke to the flattened layer
 */

import { ProcessingError } from "../utils/error-handler.js";

/**
 * Outline Converter class
 *
 * Converts strokes to fills for all vectors in a component set.
 */
export class OutlineConverter {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative" = "functional") {
    this.iconType = iconType;
  }

  /**
   * Convert all vectors in a component set to outlines
   *
   * Requirements:
   * - 4.1: Convert all strokes to fills in the Component_Set
   * - 4.2: Perform Outline_Conversion on all Vector_Layer nodes
   * - 4.3: Preserve visual appearance of vectors
   * - 4.4: Apply functional icon outline conversion rules
   * - 4.5: Apply illustrative icon outline conversion rules
   *
   * @param componentSet - The component set to process
   */
  async convert(componentSet: ComponentSetNode): Promise<void> {
    try {
      // Requirement 4.2: Perform Outline_Conversion on all Vector_Layer nodes
      for (const variant of componentSet.children as ComponentNode[]) {
        await this.convertVariant(variant);
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to convert outlines: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Convert all vectors in a variant to outlines
   *
   * Strategy:
   * 1. Find all direct children in the Container
   * 2. Set all strokes to CENTER alignment (recursively, including in groups)
   * 3. Flatten all children into one layer (groups are flattened WITH their content)
   * 4. Apply outline stroke to the flattened layer
   * 5. Rename to "Vector"
   *
   * @param variant - The variant component to process
   */
  private async convertVariant(variant: ComponentNode): Promise<void> {
    if (this.iconType === "functional") {
      // For functional icons: Component -> Container -> [vectors/groups]
      const container = this.findContainer(variant);
      if (!container) {
        console.warn(`No container found in variant ${variant.name}`);
        return;
      }

      // Get all direct children of container
      const children =
        "children" in container ? Array.from(container.children) : [];

      if (children.length === 0) {
        console.log(
          `No children found in container of ${variant.name} - may be empty`,
        );
        return;
      }

      try {
        console.log(`Processing variant: ${variant.name}`);
        console.log(
          `Container type: ${container.type}, name: ${container.name}`,
        );
        console.log(`Number of children: ${children.length}`);

        // Log child types
        children.forEach((child, index) => {
          console.log(
            `  Child ${index}: type=${child.type}, name=${child.name}`,
          );
        });

        // Step 1: Set all strokes to CENTER (recursively in all children, including in groups)
        const allVectors = children.flatMap((child) =>
          this.findAllVectorsInNode(child),
        );

        console.log(`Found ${allVectors.length} vectors to process`);

        for (const vector of allVectors) {
          if ("strokeAlign" in vector && vector.strokeAlign !== "CENTER") {
            console.log(
              `Setting stroke alignment to CENTER for ${vector.name}`,
            );
            vector.strokeAlign = "CENTER";
          }
        }

        // Step 2: Store container position
        const containerAbsoluteX =
          "absoluteTransform" in container
            ? container.absoluteTransform[0][2]
            : 0;
        const containerAbsoluteY =
          "absoluteTransform" in container
            ? container.absoluteTransform[1][2]
            : 0;

        console.log(
          `Container position: (${containerAbsoluteX}, ${containerAbsoluteY})`,
        );

        // Check if container has Auto Layout
        const hasAutoLayout =
          "layoutMode" in container && container.layoutMode !== "NONE";
        console.log(`Container has Auto Layout: ${hasAutoLayout}`);

        // Step 3: Process each child
        for (const child of children) {
          // Store original position
          const originalX = child.x;
          const originalY = child.y;

          console.log(
            `Processing child: ${child.name}, original position: (${originalX}, ${originalY})`,
          );

          // If it's a group, flatten it first
          if (child.type === "GROUP") {
            console.log(`Flattening group: ${child.name}`);
            const groupChildren = Array.from(child.children);
            const flattened = figma.flatten(groupChildren);

            if (flattened) {
              // IMPORTANT: Get position and dimensions AFTER flatten
              const flattenedX = flattened.x;
              const flattenedY = flattened.y;
              const flattenedWidth = flattened.width;
              const flattenedHeight = flattened.height;

              console.log(
                `Group flattened - position: (${flattenedX}, ${flattenedY}), size: ${flattenedWidth}x${flattenedHeight}`,
              );

              // Apply outline stroke to the flattened result
              if (
                "outlineStroke" in flattened &&
                typeof flattened.outlineStroke === "function"
              ) {
                const outlined = flattened.outlineStroke();

                if (outlined && "appendChild" in container) {
                  container.appendChild(outlined);

                  // IMPORTANT: Do NOT set position manually for groups!
                  // outlineStroke() already sets the correct position (0,0)
                  // Setting it to flattenedX/Y (1,1) would be wrong
                  if (!hasAutoLayout) {
                    // For non-auto-layout containers, outlineStroke() handles position correctly
                    console.log(
                      `Position set by outlineStroke(): (${outlined.x}, ${outlined.y})`,
                    );
                  } else {
                    console.log(
                      `Auto Layout container - position managed by layout`,
                    );
                  }

                  outlined.name = "Vector";

                  flattened.remove();
                  console.log(
                    `✓ Converted group to outline - final position: (${outlined.x}, ${outlined.y}), final size: ${outlined.width}x${outlined.height}`,
                  );
                }
              }
            }
          } else {
            // For non-group nodes (vectors, boolean operations, etc.)
            console.log(
              `Processing ${child.name} - position: (${originalX}, ${originalY}), size: ${child.width}x${child.height}`,
            );

            // Apply outline stroke directly
            if (
              "outlineStroke" in child &&
              typeof child.outlineStroke === "function"
            ) {
              console.log(`Applying outline stroke to ${child.name}`);
              const outlined = child.outlineStroke();

              if (outlined && "appendChild" in container) {
                container.appendChild(outlined);

                // For non-group nodes, we need to preserve the original position
                if (!hasAutoLayout) {
                  outlined.x = originalX;
                  outlined.y = originalY;
                  console.log(
                    `Set manual position: (${originalX}, ${originalY})`,
                  );
                } else {
                  console.log(
                    `Auto Layout container - position managed by layout`,
                  );
                }

                outlined.name = "Vector";

                child.remove();
                console.log(
                  `✓ Converted ${child.name} to outline - final position: (${outlined.x}, ${outlined.y}), final size: ${outlined.width}x${outlined.height}`,
                );
              }
            }
          }
        }

        console.log(
          `✓ Successfully processed ${children.length} child(ren) in ${variant.name}`,
        );
      } catch (error) {
        console.error(
          `Could not convert variant ${variant.name}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      // For illustrative icons: use simple approach
      const vectors = this.findAllVectorsInNode(variant);

      if (vectors.length > 0) {
        let successCount = 0;
        const nodesToRemove: SceneNode[] = [];

        for (const vector of vectors) {
          try {
            // Check if the node has the outlineStroke method and has strokes
            if (
              "outlineStroke" in vector &&
              typeof vector.outlineStroke === "function"
            ) {
              // Get the parent before conversion
              const parent = vector.parent;

              // Store original properties
              const name = vector.name;

              // IMPORTANT: Set stroke alignment to CENTER before conversion
              // This ensures consistent positioning after outline conversion
              if ("strokeAlign" in vector) {
                const originalStrokeAlign = vector.strokeAlign;
                if (originalStrokeAlign !== "CENTER") {
                  console.log(
                    `Setting stroke alignment to CENTER for ${vector.name} (was ${originalStrokeAlign})`,
                  );
                  vector.strokeAlign = "CENTER";
                }
              }

              // Calculate absolute position AFTER setting stroke to CENTER
              // This is important because changing strokeAlign changes the bounding box
              const absoluteX = vector.absoluteTransform[0][2];
              const absoluteY = vector.absoluteTransform[1][2];

              // Call outlineStroke() which returns a new node with strokes converted to fills
              const outlinedNode = vector.outlineStroke();

              if (outlinedNode && parent && "appendChild" in parent) {
                // Add the new node to the parent
                parent.appendChild(outlinedNode);

                // Calculate the parent's absolute position
                const parentAbsoluteX =
                  "absoluteTransform" in parent
                    ? parent.absoluteTransform[0][2]
                    : 0;
                const parentAbsoluteY =
                  "absoluteTransform" in parent
                    ? parent.absoluteTransform[1][2]
                    : 0;

                // Set position relative to parent
                outlinedNode.x = absoluteX - parentAbsoluteX;
                outlinedNode.y = absoluteY - parentAbsoluteY;

                // Copy the name from the original
                outlinedNode.name = name;

                // Mark original for removal
                nodesToRemove.push(vector);
                successCount++;
              } else if (outlinedNode) {
                console.warn(
                  `Could not insert outlined node for ${vector.name} - parent invalid`,
                );
                // Remove the orphaned outlined node
                outlinedNode.remove();
              }
            }
          } catch (error) {
            console.warn(
              `Could not convert vector ${vector.name}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }

        // Remove original nodes
        for (const node of nodesToRemove) {
          try {
            node.remove();
          } catch (error) {
            console.warn(`Could not remove original node ${node.name}:`, error);
          }
        }

        if (successCount > 0) {
          console.log(
            `Converted ${successCount}/${vectors.length} vectors to outlines in ${variant.name}`,
          );
        }
      }
    }
  }

  /**
   * Find the Container node (first child of component)
   */
  private findContainer(variant: ComponentNode): SceneNode | null {
    if (variant.children && variant.children.length > 0) {
      // The container is typically the first child
      return variant.children[0];
    }
    return null;
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
