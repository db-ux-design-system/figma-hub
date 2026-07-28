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

        // Step 0: Collect ALL vectors recursively
        console.log(`Step 0: Collecting all vectors recursively...`);
        const allVectors = this.findAllVectorsInNode(container);
        console.log(`  Found ${allVectors.length} total vectors`);

        if (allVectors.length === 0) {
          console.log(`  No vectors to process`);
          return;
        }

        const containerNode = container as FrameNode | GroupNode;

        // NEW APPROACH: Look for groups to process separately
        console.log(`Step 1: Looking for groups to process...`);

        // Find the icon frame first (direct child of container)
        let iconFrame: SceneNode | null = null;
        for (const child of containerNode.children) {
          if (child.type === "FRAME" || child.type === "GROUP") {
            iconFrame = child;
            console.log(`  Found icon frame: "${child.name}"`);
            break;
          }
        }

        // If we have a frame, look for groups inside it
        const groups: (GroupNode | FrameNode)[] = [];

        if (iconFrame && "children" in iconFrame) {
          console.log(
            `  Frame position: (${iconFrame.x.toFixed(2)}, ${iconFrame.y.toFixed(2)})`,
          );

          for (const child of iconFrame.children) {
            if (child.type === "GROUP" || child.type === "FRAME") {
              groups.push(child as GroupNode | FrameNode);
              console.log(`  Found group inside frame: "${child.name}"`);
            }
          }
        }

        const processedVectors: VectorNode[] = [];

        if (groups.length >= 1) {
          console.log(
            `Step 2: Processing ${groups.length} group(s) separately...`,
          );

          // Process each group
          for (const group of groups) {
            const groupVectors = this.findAllVectorsInNode(group);
            console.log(
              `  Processing group "${group.name}" with ${groupVectors.length} vectors`,
            );

            if (groupVectors.length === 0) continue;

            // Store the group's absolute position BEFORE any processing
            const groupAbsX = group.absoluteTransform[0][2];
            const groupAbsY = group.absoluteTransform[1][2];
            const groupParent = group.parent;
            const groupParentAbsX =
              groupParent && "absoluteTransform" in groupParent
                ? (groupParent as any).absoluteTransform[0][2]
                : 0;
            const groupParentAbsY =
              groupParent && "absoluteTransform" in groupParent
                ? (groupParent as any).absoluteTransform[1][2]
                : 0;

            console.log(
              `    Group position before processing: (${groupAbsX.toFixed(2)}, ${groupAbsY.toFixed(2)}) absolute`,
            );

            // Check if this group contains strokes
            const hasStrokes = groupVectors.some(
              (v) =>
                "strokes" in v &&
                Array.isArray(v.strokes) &&
                v.strokes.length > 0 &&
                "strokeWeight" in v &&
                typeof v.strokeWeight === "number" &&
                v.strokeWeight > 0,
            );

            // CRITICAL: If group has strokes, outline EACH vector FIRST (before flattening)
            // This preserves different stroke weights (e.g., 1.5px and 2px mixed)
            if (hasStrokes) {
              console.log(
                `    Group has strokes - outlining each vector individually first...`,
              );

              const outlinedVectors: VectorNode[] = [];

              for (const vector of groupVectors) {
                if (
                  "strokes" in vector &&
                  Array.isArray(vector.strokes) &&
                  vector.strokes.length > 0 &&
                  "strokeWeight" in vector &&
                  typeof vector.strokeWeight === "number" &&
                  vector.strokeWeight > 0
                ) {
                  // Store info BEFORE outlining (because vector will be deleted)
                  const vectorName = vector.name;
                  const strokeWeight = vector.strokeWeight;

                  // Set stroke alignment to CENTER
                  if ("strokeAlign" in vector) {
                    vector.strokeAlign = "CENTER";
                  }

                  // Outline this individual vector
                  if (
                    "outlineStroke" in vector &&
                    typeof (vector as any).outlineStroke === "function"
                  ) {
                    try {
                      console.log(
                        `      Outlining vector "${vectorName}" (strokeWeight: ${strokeWeight}px)`,
                      );

                      // outlineStroke() removes the original node and returns a new one
                      const outlinedNode = (vector as any).outlineStroke();

                      if (outlinedNode) {
                        // Add to list for flattening
                        outlinedVectors.push(outlinedNode);
                        console.log(
                          `        ✓ Outlined (preserved ${strokeWeight}px weight as fill)`,
                        );
                      } else {
                        console.log(`        ✗ outlineStroke() returned null`);
                      }
                    } catch (error) {
                      console.error(`        ✗ Failed to outline:`, error);
                      // If outline fails, try to use the original vector if it still exists
                      if (!vector.removed) {
                        outlinedVectors.push(vector as VectorNode);
                      }
                    }
                  } else {
                    outlinedVectors.push(vector as VectorNode);
                  }
                } else {
                  // No stroke, just add to list
                  outlinedVectors.push(vector as VectorNode);
                }
              }

              // Now flatten all outlined vectors together
              let flattenedGroup: VectorNode | null = null;
              if (outlinedVectors.length > 1) {
                console.log(
                  `    Flattening ${outlinedVectors.length} outlined vectors...`,
                );
                flattenedGroup = figma.flatten(
                  outlinedVectors as ReadonlyArray<SceneNode>,
                );
              } else if (outlinedVectors.length === 1) {
                flattenedGroup = outlinedVectors[0];
                console.log(`    Single outlined vector, no flattening needed`);
              }

              // Restore the original group position after all processing
              if (flattenedGroup) {
                // Store the group reference before any operations
                const originalGroupId = group.id;
                const groupParent = group.parent;

                flattenedGroup.x = groupAbsX - groupParentAbsX;
                flattenedGroup.y = groupAbsY - groupParentAbsY;
                console.log(
                  `    Restored group position: (${flattenedGroup.x.toFixed(2)}, ${flattenedGroup.y.toFixed(2)}) relative`,
                );

                // CRITICAL: Move flattened vector to the icon frame BEFORE removing the group
                if (
                  iconFrame &&
                  flattenedGroup.parent !== iconFrame &&
                  groupParent === iconFrame
                ) {
                  const absX = flattenedGroup.absoluteTransform[0][2];
                  const absY = flattenedGroup.absoluteTransform[1][2];
                  const iconFrameAbsX = (iconFrame as any)
                    .absoluteTransform[0][2];
                  const iconFrameAbsY = (iconFrame as any)
                    .absoluteTransform[1][2];

                  (iconFrame as any).appendChild(flattenedGroup);
                  flattenedGroup.x = absX - iconFrameAbsX;
                  flattenedGroup.y = absY - iconFrameAbsY;
                  console.log(
                    `    Moved flattened vector to icon frame at (${flattenedGroup.x.toFixed(2)}, ${flattenedGroup.y.toFixed(2)})`,
                  );
                }

                processedVectors.push(flattenedGroup);

                // Now remove the original group if it still exists and wasn't consumed by flatten
                // Check by ID since flatten may have replaced the group
                if (
                  !group.removed &&
                  group.id !== flattenedGroup.id &&
                  group.parent !== null
                ) {
                  console.log(
                    `    Removing original group "${group.name}" (id: ${originalGroupId})`,
                  );
                  group.remove();
                }
              }
            } else {
              // No strokes in this group, just flatten normally
              let flattenedGroup: VectorNode | null = null;
              if (groupVectors.length > 1) {
                console.log(`    Flattening ${groupVectors.length} vectors...`);
                flattenedGroup = figma.flatten(
                  groupVectors as ReadonlyArray<SceneNode>,
                );
              } else {
                flattenedGroup = groupVectors[0] as VectorNode;
                console.log(`    Single vector in group`);
              }

              // Restore the original group position
              if (flattenedGroup) {
                // Store the group reference before any operations
                const originalGroupId = group.id;
                const groupParent = group.parent;

                flattenedGroup.x = groupAbsX - groupParentAbsX;
                flattenedGroup.y = groupAbsY - groupParentAbsY;
                console.log(
                  `    Restored group position: (${flattenedGroup.x.toFixed(2)}, ${flattenedGroup.y.toFixed(2)}) relative`,
                );

                // CRITICAL: Move flattened vector to the icon frame BEFORE removing the group
                if (
                  iconFrame &&
                  flattenedGroup.parent !== iconFrame &&
                  groupParent === iconFrame
                ) {
                  const absX = flattenedGroup.absoluteTransform[0][2];
                  const absY = flattenedGroup.absoluteTransform[1][2];
                  const iconFrameAbsX = (iconFrame as any)
                    .absoluteTransform[0][2];
                  const iconFrameAbsY = (iconFrame as any)
                    .absoluteTransform[1][2];

                  (iconFrame as any).appendChild(flattenedGroup);
                  flattenedGroup.x = absX - iconFrameAbsX;
                  flattenedGroup.y = absY - iconFrameAbsY;
                  console.log(
                    `    Moved flattened vector to icon frame at (${flattenedGroup.x.toFixed(2)}, ${flattenedGroup.y.toFixed(2)})`,
                  );
                }

                processedVectors.push(flattenedGroup);

                // Now remove the original group if it still exists and wasn't consumed by flatten
                // Check by ID since flatten may have replaced the group
                if (
                  !group.removed &&
                  group.id !== flattenedGroup.id &&
                  group.parent !== null
                ) {
                  console.log(
                    `    Removing original group "${group.name}" (id: ${originalGroupId})`,
                  );
                  group.remove();
                }
              }
            }
          }
        } else {
          // Fallback: no groups found, flatten all vectors
          console.log(`  No groups found, flattening all vectors...`);
          console.log(
            `  NOTE: User should organize vectors in groups for best results!`,
          );

          let flattenedVector: VectorNode | null = null;

          if (allVectors.length > 1) {
            console.log(`  Flattening ${allVectors.length} vectors...`);
            flattenedVector = figma.flatten(
              allVectors as ReadonlyArray<SceneNode>,
            );
          } else {
            flattenedVector = allVectors[0] as VectorNode;
            console.log(`  Single vector, no flattening needed`);
          }

          if (flattenedVector) {
            processedVectors.push(flattenedVector);
          }
        }

        // Step 3: Create final "Vector" layer
        console.log(`Step 3: Creating final "Vector" layer...`);
        let finalVector: VectorNode | null = null;

        if (processedVectors.length > 1) {
          console.log(
            `  Multiple processed vectors (${processedVectors.length})`,
          );

          // CRITICAL: Check if all vectors are already in the same parent
          const firstParent = processedVectors[0].parent;
          const allSameParent = processedVectors.every(
            (v) => v.parent === firstParent,
          );

          if (allSameParent) {
            console.log(`  All vectors in same parent, flattening together...`);
            finalVector = figma.flatten(
              processedVectors as ReadonlyArray<SceneNode>,
            );
            console.log(`  ✓ Flattened into single vector`);
          } else {
            console.log(
              `  Vectors in different parents - keeping them separate`,
            );
            console.log(
              `  WARNING: Multiple vector layers will remain (this is expected for complex icons)`,
            );

            // Rename all vectors to "Vector" and ensure they're in the container
            for (let i = 0; i < processedVectors.length; i++) {
              const vector = processedVectors[i];

              // Move to container if not already there
              if (vector.parent !== container) {
                const absX = vector.absoluteTransform[0][2];
                const absY = vector.absoluteTransform[1][2];
                const containerAbsX = containerNode.absoluteTransform[0][2];
                const containerAbsY = containerNode.absoluteTransform[1][2];

                containerNode.appendChild(vector);
                vector.x = absX - containerAbsX;
                vector.y = absY - containerAbsY;
              }

              // Name them Vector, Vector 2, Vector 3, etc.
              vector.name = i === 0 ? "Vector" : `Vector ${i + 1}`;
              console.log(
                `  ✓ Created "${vector.name}" at (${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`,
              );
            }

            // Use the first one as "finalVector" for the rest of the logic
            finalVector = processedVectors[0];
          }
        } else if (processedVectors.length === 1) {
          finalVector = processedVectors[0];
          console.log(`  Single processed vector, using as final`);
        }

        if (finalVector) {
          // Ensure it's in the container
          if (finalVector.parent !== container) {
            const absX = finalVector.absoluteTransform[0][2];
            const absY = finalVector.absoluteTransform[1][2];
            const containerAbsX = containerNode.absoluteTransform[0][2];
            const containerAbsY = containerNode.absoluteTransform[1][2];

            containerNode.appendChild(finalVector);
            finalVector.x = absX - containerAbsX;
            finalVector.y = absY - containerAbsY;
          }

          // Only set name to "Vector" if we flattened everything
          if (processedVectors.length === 1) {
            finalVector.name = "Vector";
          }
          console.log(`  ✓ Final vector layer(s) created`);
        }

        // Step 4: Remove empty groups/frames (but keep the iconFrame)
        console.log(`Step 4: Cleaning up empty groups and frames...`);

        const removeEmptyContainers = (
          parent: FrameNode | GroupNode,
        ): number => {
          let removedCount = 0;
          const children = Array.from(parent.children);

          for (const child of children) {
            // Skip the iconFrame itself - we want to keep it
            if (child === iconFrame) {
              console.log(`  Keeping iconFrame: "${child.name}"`);
              continue;
            }

            // Recursively check children first
            if (
              (child.type === "GROUP" || child.type === "FRAME") &&
              "children" in child
            ) {
              removedCount += removeEmptyContainers(
                child as FrameNode | GroupNode,
              );
            }

            // Now check if this child should be removed
            if (
              (child.type === "GROUP" || child.type === "FRAME") &&
              "children" in child
            ) {
              if (child.children.length === 0) {
                console.log(
                  `  Removing empty ${child.type.toLowerCase()}: "${child.name}"`,
                );
                child.remove();
                removedCount++;
              }
            }
          }

          return removedCount;
        };

        const removedCount = removeEmptyContainers(containerNode);
        if (removedCount > 0) {
          console.log(`  ✓ Removed ${removedCount} container(s)`);
        }

        console.log(`✓ Complete\n`);
      } catch (error) {
        console.error(`Error in ${variant.name}:`, error);
      }
    } else {
      // Illustrative icons
      const container = variant;
      const allVectors = this.findAllVectorsInNode(container);

      let flattenedNode: VectorNode | null = null;
      if (allVectors.length > 1) {
        flattenedNode = figma.flatten(allVectors as ReadonlyArray<SceneNode>);
      } else if (allVectors.length === 1) {
        flattenedNode = allVectors[0] as VectorNode;
      }

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
