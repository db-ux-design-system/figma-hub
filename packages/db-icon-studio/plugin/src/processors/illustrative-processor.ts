/**
 * Illustrative Icon Processor
 *
 * Processes illustrative icons with a single vector layer containing both black and red fills
 *
 * Structure transformation:
 * BEFORE: Component > Container > Vector (with black and red fills)
 * AFTER:  Component > Container > Vector (with color variables applied to fills)
 */

import { ProcessingError } from "../utils/error-handler.js";

export class IllustrativeProcessor {
  private readonly baseColorKey = "497497bca9694f6004d1667de59f1a903b3cd3ef"; // Black
  private readonly pulseColorKey = "998998d67d3ebef6f2692db932bce69431b3d0cc"; // Red pulse

  /**
   * Process an illustrative icon component
   *
   * Expects structure: Component > Container > Vector (with black and red fills)
   */
  async process(component: ComponentNode): Promise<void> {
    try {
      console.log(`\n=== Processing Illustrative Icon: ${component.name} ===`);

      // Get container (first child)
      if (!component.children || component.children.length === 0) {
        throw new ProcessingError("Component has no container");
      }

      const container = component.children[0];
      if (
        !("children" in container) ||
        !container.children ||
        container.children.length === 0
      ) {
        throw new ProcessingError("Container has no children");
      }

      // Remove Auto Layout from container if present (must be done before setting constraints)
      if ("layoutMode" in container && container.layoutMode !== "NONE") {
        container.layoutMode = "NONE";
        console.log(`Removed Auto Layout from container`);
      }

      // Find the Vector layer
      const children = Array.from(container.children);
      const vectorLayer = children.find((child) => child.name === "Vector");

      if (!vectorLayer) {
        throw new ProcessingError("No Vector layer found in container");
      }

      console.log(`Found Vector layer`);

      // Apply color variables to the vector's fills
      await this.applyColorVariables(vectorLayer);

      // Set constraints to SCALE for the vector
      if ("constraints" in vectorLayer) {
        vectorLayer.constraints = {
          horizontal: "SCALE",
          vertical: "SCALE",
        };
        console.log(`Set constraints to SCALE for Vector`);
      }

      // Remove fill from container
      if ("fills" in container && Array.isArray(container.fills)) {
        container.fills = [];
        console.log(`Removed fill from container`);
      }

      // Set container layout sizing to FILL
      if ("layoutAlign" in container && "layoutGrow" in container) {
        container.layoutAlign = "STRETCH";
        container.layoutGrow = 1;
        console.log(`Set container resizing to FILL`);
      }

      // Ensure container is named "Container"
      container.name = "Container";

      console.log(`✓ Illustrative icon processing complete\n`);
    } catch (error) {
      throw new ProcessingError(
        `Failed to process illustrative icon: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Apply color variables to a vector with both black and red fills
   * Handles Vector Networks with mixed fills
   */
  private async applyColorVariables(vector: SceneNode): Promise<void> {
    try {
      console.log(`  Applying color variables to ${vector.name}...`);
      console.log(`  Vector type: ${vector.type}`);

      // Import both color variables
      console.log(`  Importing base variable: ${this.baseColorKey}`);
      const baseVariable = await figma.variables.importVariableByKeyAsync(
        this.baseColorKey,
      );

      console.log(`  Importing pulse variable: ${this.pulseColorKey}`);
      const pulseVariable = await figma.variables.importVariableByKeyAsync(
        this.pulseColorKey,
      );

      if (!baseVariable) {
        console.error(`  ✗ Could not import base color variable!`);
      } else {
        console.log(`  ✓ Base variable imported: ${baseVariable.name}`);
      }

      if (!pulseVariable) {
        console.error(`  ✗ Could not import pulse color variable!`);
      } else {
        console.log(`  ✓ Pulse variable imported: ${pulseVariable.name}`);
      }

      if (!baseVariable || !pulseVariable) {
        console.error(`  Cannot proceed without both color variables`);
        return;
      }

      // Check if this is a Vector Network (has mixed fills)
      if (
        vector.type === "VECTOR" &&
        "fills" in vector &&
        typeof vector.fills === "symbol"
      ) {
        console.log(`  Vector has mixed fills - this is a Vector Network`);

        // For Vector Networks, we need to update the vectorNetwork regions
        if ("vectorNetwork" in vector) {
          const vectorNode = vector as VectorNode;
          const network = vectorNode.vectorNetwork;

          console.log(
            `  Vector network has ${network.regions?.length || 0} regions`,
          );

          // Process each region and update fills with bound variables
          if (network.regions && network.regions.length > 0) {
            const updatedRegions = network.regions.map((region, i) => {
              console.log(
                `    Region ${i}: windingRule=${region.windingRule}, loops=${region.loops.length}`,
              );

              // Update fills for this region
              const newFills: Paint[] = [];

              if (region.fills && region.fills.length > 0) {
                for (const fill of region.fills) {
                  if (fill.type === "SOLID" && fill.visible !== false) {
                    const { r, g, b } = fill.color;
                    const isBlack = r < 0.1 && g < 0.1 && b < 0.1;
                    const isRed = r > 0.5 && g < 0.3 && b < 0.3;

                    console.log(
                      `      Fill: r=${r.toFixed(3)}, g=${g.toFixed(3)}, b=${b.toFixed(3)} -> ${isBlack ? "BLACK" : isRed ? "RED" : "OTHER"}`,
                    );

                    if (isBlack) {
                      newFills.push({
                        type: "SOLID",
                        color: { r: 0, g: 0, b: 0 },
                        boundVariables: {
                          color: {
                            type: "VARIABLE_ALIAS",
                            id: baseVariable.id,
                          },
                        },
                      });
                      console.log(`      ✓ Bound to base variable`);
                    } else if (isRed) {
                      newFills.push({
                        type: "SOLID",
                        color: { r: 1, g: 0, b: 0 },
                        boundVariables: {
                          color: {
                            type: "VARIABLE_ALIAS",
                            id: pulseVariable.id,
                          },
                        },
                      });
                      console.log(`      ✓ Bound to pulse variable`);
                    } else {
                      newFills.push(fill);
                      console.log(`      Kept as-is`);
                    }
                  } else {
                    newFills.push(fill);
                  }
                }
              }

              // Return updated region
              return {
                ...region,
                fills: newFills,
              };
            });

            // Create updated network with new regions
            const updatedNetwork = {
              ...network,
              regions: updatedRegions,
            };

            // Apply the updated network back to the vector (must use async method)
            await vectorNode.setVectorNetworkAsync(updatedNetwork);
            console.log(
              `  ✓ Updated vector network with ${updatedRegions.length} regions`,
            );
          } else {
            console.warn(`  Vector network has no regions to process`);
          }
        } else {
          console.warn(`  Vector does not have vectorNetwork property`);
        }
      } else {
        console.log(`  Vector has regular fills, processing normally...`);
        await this.applyColorsRecursively(vector, baseVariable, pulseVariable);
      }

      console.log(`  ✓ Color application complete`);
    } catch (error) {
      console.error(`  Failed to apply color variables:`, error);
      if (error instanceof Error) {
        console.error(`  Error message: ${error.message}`);
        console.error(`  Error stack: ${error.stack}`);
      }
    }
  }

  /**
   * Recursively apply color variables to a node and its children (for non-vector-network nodes)
   */
  private async applyColorsRecursively(
    node: SceneNode,
    baseVariable: Variable,
    pulseVariable: Variable,
  ): Promise<void> {
    console.log(`    Processing node: "${node.name}" (${node.type})`);

    // Check if node has fills
    if ("fills" in node) {
      const fills = node.fills;

      // Handle array fills
      if (Array.isArray(fills)) {
        console.log(`      Processing ${fills.length} fills...`);
        const newFills: Paint[] = [];

        for (const fill of fills) {
          if (fill.type === "SOLID" && fill.visible !== false) {
            const { r, g, b } = fill.color;
            const isBlack = r < 0.1 && g < 0.1 && b < 0.1;
            const isRed = r > 0.5 && g < 0.3 && b < 0.3;

            if (isBlack) {
              newFills.push({
                type: "SOLID",
                color: { r: 0, g: 0, b: 0 },
                boundVariables: {
                  color: {
                    type: "VARIABLE_ALIAS",
                    id: baseVariable.id,
                  },
                },
              });
            } else if (isRed) {
              newFills.push({
                type: "SOLID",
                color: { r: 1, g: 0, b: 0 },
                boundVariables: {
                  color: {
                    type: "VARIABLE_ALIAS",
                    id: pulseVariable.id,
                  },
                },
              });
            } else {
              newFills.push(fill);
            }
          } else {
            newFills.push(fill);
          }
        }

        if (newFills.length > 0) {
          node.fills = newFills;
          console.log(`      ✓ Applied ${newFills.length} fills`);
        }
      }
    }

    // Recursively process children
    if ("children" in node && node.children && node.children.length > 0) {
      for (const child of node.children) {
        await this.applyColorsRecursively(child, baseVariable, pulseVariable);
      }
    }
  }
}
