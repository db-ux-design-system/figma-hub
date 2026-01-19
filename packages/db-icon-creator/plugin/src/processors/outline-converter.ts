/**
 * Outline Converter
 *
 * Matches the manual Figma workflow: Flatten Selection → Outline Stroke
 * This is the correct order to maintain positions.
 */

import { ProcessingError } from "../utils/error-handler.js";

export class OutlineConverter {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative" = "functional") {
    this.iconType = iconType;
  }

  async convert(componentSet: ComponentSetNode): Promise<void> {
    try {
      for (const variant of componentSet.children as ComponentNode[]) {
        await this.convertVariant(variant);
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to convert outlines: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async convertVariant(variant: ComponentNode): Promise<void> {
    if (this.iconType === "functional") {
      const container = this.findContainer(variant);
      if (!container) {
        console.warn(`No container found in variant ${variant.name}`);
        return;
      }

      const children =
        "children" in container ? Array.from(container.children) : [];
      if (children.length === 0) {
        console.log(`No children in ${variant.name}`);
        return;
      }

      try {
        console.log(`\n=== Processing ${variant.name} ===`);

        // Step 1: FLATTEN FIRST (like manual workflow)
        console.log(`Step 1: Flattening all children`);
        const currentChildren = Array.from(
          (container as FrameNode | GroupNode).children,
        );

        let flattenedNode: VectorNode | null = null;
        let wasBooleanOperation = false;

        if (currentChildren.length > 1) {
          // Multiple children - flatten them
          flattenedNode = figma.flatten(
            currentChildren as ReadonlyArray<SceneNode>,
          );
          if (flattenedNode) {
            flattenedNode.name = "Vector";
            console.log(`  Flattened ${currentChildren.length} children`);
          }
        } else if (currentChildren.length === 1) {
          // Single child - check if it needs flattening
          const child = currentChildren[0];

          if (child.type === "GROUP" && "children" in child) {
            // Just flatten the group
            flattenedNode = figma.flatten([child] as ReadonlyArray<SceneNode>);
            if (flattenedNode) {
              flattenedNode.name = "Vector";
              console.log(`  Flattened group, removed group`);
            }
          } else if (
            child.type === "BOOLEAN_OPERATION" &&
            "children" in child
          ) {
            // For boolean operations: outline children first, then flatten
            wasBooleanOperation = true;
            const boolChildren = Array.from(child.children);
            for (const boolChild of boolChildren) {
              if (
                "strokes" in boolChild &&
                boolChild.strokes.length > 0 &&
                "strokeAlign" in boolChild &&
                "outlineStroke" in boolChild &&
                typeof boolChild.outlineStroke === "function"
              ) {
                boolChild.strokeAlign = "CENTER";
                boolChild.outlineStroke();
                console.log(`  Outlined stroke in child: ${boolChild.name}`);
              }
            }

            flattenedNode = figma.flatten([child] as ReadonlyArray<SceneNode>);
            if (flattenedNode) {
              flattenedNode.name = "Vector";
              console.log(`  Flattened boolean operation, removed boolean`);
            }
          } else {
            // Already a single vector
            flattenedNode = child as VectorNode;
            flattenedNode.name = "Vector";
            console.log(`  Single vector (${child.type}), no flatten needed`);
          }
        }

        // Step 2: Set stroke to CENTER (after flattening, but not for boolean operations)
        if (
          flattenedNode &&
          !wasBooleanOperation &&
          "strokeAlign" in flattenedNode
        ) {
          console.log(`Step 2: Setting stroke to CENTER`);
          flattenedNode.strokeAlign = "CENTER";
        }

        // Step 3: OUTLINE STROKE (after flattening, but not for boolean operations)
        if (flattenedNode && !wasBooleanOperation) {
          console.log(`Step 3: Applying outline stroke on Vector`);

          const containerNode = container as FrameNode | GroupNode;

          if (
            "strokes" in flattenedNode &&
            flattenedNode.strokes.length > 0 &&
            "outlineStroke" in flattenedNode &&
            typeof flattenedNode.outlineStroke === "function"
          ) {
            try {
              console.log(
                `  Node has ${flattenedNode.strokes.length} stroke(s)`,
              );

              // Store the parent and index before outlining
              const parent = flattenedNode.parent;
              const index =
                parent && "children" in parent
                  ? Array.from(parent.children).indexOf(flattenedNode)
                  : -1;

              // outlineStroke() creates a NEW node as a sibling and leaves the original intact!
              const outlinedNode = flattenedNode.outlineStroke();

              if (outlinedNode) {
                console.log(`  ✓ outlineStroke() returned new node`);

                // The new node was created as a sibling to the original
                // We need to:
                // 1. Move it into the container at the same position
                // 2. Name it "Vector"
                // 3. Remove the old node

                if (index >= 0) {
                  containerNode.insertChild(index, outlinedNode);
                } else {
                  containerNode.appendChild(outlinedNode);
                }

                outlinedNode.name = "Vector";
                flattenedNode.remove();

                console.log(
                  `  ✓ Moved outlined node to container and removed original`,
                );
                console.log(
                  `  After outline - has fill: ${outlinedNode.fills && (outlinedNode.fills as readonly Paint[]).length > 0}`,
                );
              } else {
                console.log(`  ✗ outlineStroke() returned null`);
              }
            } catch (error) {
              console.error(`  ✗ Outline failed:`, error);
            }
          } else {
            console.log(`  No strokes to outline`);
          }
        } else if (wasBooleanOperation) {
          console.log(
            `Step 2 & 3: Skipped (boolean operation already outlined)`,
          );
        }

        console.log(`✓ Complete\n`);
      } catch (error) {
        console.error(`Error in ${variant.name}:`, error);
      }
    } else {
      // Illustrative icons - flatten first, then outline
      const container = variant;
      const allVectors = this.findAllVectorsInNode(container);

      // Flatten if multiple vectors
      let flattenedNode: VectorNode | null = null;
      if (allVectors.length > 1) {
        flattenedNode = figma.flatten(allVectors as ReadonlyArray<SceneNode>);
      } else if (allVectors.length === 1) {
        flattenedNode = allVectors[0] as VectorNode;
      }

      // Set stroke to CENTER and apply outline
      if (flattenedNode) {
        if ("strokeAlign" in flattenedNode) {
          flattenedNode.strokeAlign = "CENTER";
        }

        if (
          "strokes" in flattenedNode &&
          flattenedNode.strokes.length > 0 &&
          "outlineStroke" in flattenedNode &&
          typeof flattenedNode.outlineStroke === "function"
        ) {
          flattenedNode.outlineStroke();
        }
      }
    }
  }

  private findContainer(variant: ComponentNode): SceneNode | null {
    if (variant.children && variant.children.length > 0) {
      return variant.children[0];
    }
    return null;
  }

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
}
