/**
 * Illustrative Icon Processor
 *
 * Processes illustrative icons with a single vector layer containing both black and red fills
 *
 * Structure transformation:
 * BEFORE: Component > Container > [flattened vector with black and red]
 * AFTER:  Component > Container > Vector (with color variables applied)
 */

import { ProcessingError } from "../utils/error-handler.js";

export class IllustrativeProcessor {
  private readonly baseColorKey = "497497bca9694f6004d1667de59f1a903b3cd3ef"; // Black
  private readonly pulseColorKey = "998998d67d3ebef6f2692db932bce69431b3d0cc"; // Red pulse

  /**
   * Process an illustrative icon component
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

      // Find the single vector (should be already flattened by user)
      const allVectors = this.findAllVectorsInNode(container);
      console.log(`Found ${allVectors.length} vectors in container`);

      if (allVectors.length !== 1) {
        throw new ProcessingError(
          `Expected exactly 1 vector, found ${allVectors.length}. Please flatten all vectors together.`,
        );
      }

      const vector = allVectors[0];
      console.log(`Processing vector: ${vector.name}`);

      // Rename vector to "Vector"
      vector.name = "Vector";
      console.log(`Renamed vector to: Vector`);

      // Apply color variables to the vector
      // For illustrative icons with both colors, we need to bind both color variables
      await this.applyColorVariables(vector);

      // Set constraints to SCALE for the vector (Auto Layout was removed from container)
      if ("constraints" in vector) {
        vector.constraints = {
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
   * Apply color variables to a vector with both black and red fills
   * For boolean operations or compound vectors, we bind variables to child fills
   */
  private async applyColorVariables(vector: SceneNode): Promise<void> {
    try {
      console.log(`  Applying color variables to ${vector.name}...`);

      // Import both color variables
      const baseVariable = await figma.variables.importVariableByKeyAsync(
        this.baseColorKey,
      );
      const pulseVariable = await figma.variables.importVariableByKeyAsync(
        this.pulseColorKey,
      );

      if (!baseVariable || !pulseVariable) {
        console.warn(`  Could not import color variables`);
        return;
      }

      // Apply color variables recursively to all fills in the vector
      this.applyColorToNode(vector, baseVariable, pulseVariable);

      console.log(`  ✓ Color variables applied to ${vector.name}`);
    } catch (error) {
      console.warn(`  Failed to apply color variables:`, error);
    }
  }

  /**
   * Recursively apply color variables to fills based on their color
   */
  private applyColorToNode(
    node: SceneNode,
    baseVariable: Variable,
    pulseVariable: Variable,
  ): void {
    console.log(`    Processing node: ${node.name} (${node.type})`);

    // Check if node has fills property
    if (!("fills" in node)) {
      console.log(`      No fills property, skipping`);
      // Still check children
      if ("children" in node && node.children) {
        for (const child of node.children) {
          this.applyColorToNode(child, baseVariable, pulseVariable);
        }
      }
      return;
    }

    const fills = node.fills;
    console.log(
      `      fills type: ${typeof fills}, is symbol: ${typeof fills === "symbol"}`,
    );

    // If fills is figma.mixed (symbol), we need to access child nodes
    if (typeof fills === "symbol") {
      console.log(
        `      fills is mixed - processing children to bind variables`,
      );

      // For mixed fills, we need to process children (vector network regions)
      if ("children" in node && node.children) {
        console.log(`      Processing ${node.children.length} children...`);
        for (const child of node.children) {
          this.applyColorToNode(child, baseVariable, pulseVariable);
        }
      }

      // Also try to bind variables using setBoundVariable if available
      if (
        "setBoundVariable" in node &&
        typeof node.setBoundVariable === "function"
      ) {
        try {
          // Try to bind both variables - Figma will apply them to the appropriate regions
          console.log(
            `      Attempting to bind variables using setBoundVariable...`,
          );
          node.setBoundVariable("fills", baseVariable.id);
          console.log(`      ✓ Bound base variable`);
        } catch (error) {
          console.log(`      Could not bind variables directly:`, error);
        }
      }

      return;
    }

    // If fills is an array, process each fill
    if (Array.isArray(fills)) {
      console.log(`      Processing ${fills.length} fills...`);
      const newFills: Paint[] = [];

      for (const fill of fills) {
        if (fill.type === "SOLID" && fill.visible !== false) {
          const { r, g, b } = fill.color;
          console.log(
            `        Fill color: r=${r.toFixed(3)}, g=${g.toFixed(3)}, b=${b.toFixed(3)}`,
          );

          // Determine if this fill is black or red
          const isBlack = r < 0.1 && g < 0.1 && b < 0.1;
          const isRed = r > 0.5 && g < 0.3 && b < 0.3;

          if (isBlack) {
            // Bind to base (black) variable
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
            console.log(`        ✓ Bound black fill to base variable`);
          } else if (isRed) {
            // Bind to pulse (red) variable
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
            console.log(`        ✓ Bound red fill to pulse variable`);
          } else {
            // Keep other fills as-is
            console.log(`        Keeping fill as-is (not black or red)`);
            newFills.push(fill);
          }
        } else {
          // Keep non-solid or invisible fills
          console.log(`        Keeping fill as-is (not solid or invisible)`);
          newFills.push(fill);
        }
      }

      node.fills = newFills;
      console.log(`      ✓ Applied ${newFills.length} fills to node`);
    }

    // Recursively process children (for boolean operations)
    if ("children" in node && node.children) {
      console.log(`      Processing ${node.children.length} children...`);
      for (const child of node.children) {
        this.applyColorToNode(child, baseVariable, pulseVariable);
      }
    }
  }
}
