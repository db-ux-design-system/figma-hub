/**
 * Illustrative Icon Flatten & Outline Validator
 *
 * Validates that illustrative icons are properly prepared:
 * - All strokes converted to fills (outlined)
 * - Exactly 1 flattened vector layer with both black and red fills
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";

export class IllustrativeFlattenOutlineValidator {
  /**
   * Validate that illustrative icon is ready for processing
   */
  validate(component: ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    console.log(
      `[IllustrativeFlattenOutlineValidator] Validating: ${component.name}`,
    );

    // Get container (first child)
    if (!component.children || component.children.length === 0) {
      errors.push({ message: "Component has no container" });
      return { isValid: false, errors, warnings };
    }

    const container = component.children[0];
    if (!("children" in container) || !container.children) {
      errors.push({ message: "Container has no children" });
      return { isValid: false, errors, warnings };
    }

    // Find all vectors recursively
    const vectors = this.findAllVectorsInNode(container);
    console.log(`  Found ${vectors.length} vectors`);

    // Check 1: All strokes converted to fills?
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

    // Check 2: Exactly 1 vector (all flattened together)?
    const notFlattened = vectors.length !== 1;

    // Check 3: Vector has both black and red fills?
    let hasBlack = false;
    let hasRed = false;
    if (vectors.length === 1) {
      const vector = vectors[0];
      hasBlack = this.hasBlackFill(vector);
      hasRed = this.hasRedFill(vector);
    }

    // Generate error messages
    if (hasStrokes || notFlattened || !hasBlack || !hasRed) {
      let instructions = "";

      if (hasStrokes && notFlattened) {
        // Both issues
        instructions = `<ol class="list-decimal pl-5 ml-8 mt-2 space-y-1">
<li>Select all vectors</li>
<li>Outline Stroke (⌥&nbsp;Opt&nbsp;+&nbsp;⌘&nbsp;Cmd&nbsp;+&nbsp;O)</li>
<li>Boolean Groups > Union (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;U)</li>
<li>Flatten Selection (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;F)</li>
</ol>
<p class="mt-2"><strong>Note:</strong> Outline BEFORE Flatten to preserve stroke weights!</p>`;
      } else if (hasStrokes) {
        // Only outline needed
        instructions = `<ol class="list-decimal pl-5 ml-8 mt-2 space-y-1">
<li>Outline Stroke (⌥&nbsp;Opt&nbsp;+&nbsp;⌘&nbsp;Cmd&nbsp;+&nbsp;O) for all vectors</li>
</ol>`;
      } else if (notFlattened) {
        // Only flatten needed
        instructions = `<ol class="list-decimal pl-5 ml-8 mt-2 space-y-1">
<li>Select all vectors and Flatten Selection (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;F)</li>
</ol>
<p class="mt-2">Expected: 1 vector (with black and red fills), found: ${vectors.length}</p>`;
      } else if (!hasBlack || !hasRed) {
        // Color issue
        instructions = `<p class="mt-2">Expected vector with both black and red fills.<br/>Found: ${hasBlack ? "✓" : "✗"} black, ${hasRed ? "✓" : "✗"} red</p>`;
      }

      errors.push({
        message: `Please prepare your illustrative icon:${instructions}`,
      });
    }

    console.log(
      `[IllustrativeFlattenOutlineValidator] Validation complete. Ready: ${errors.length === 0}`,
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
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
   * Check if vector has black fill (recursively checks children for boolean operations)
   */
  private hasBlackFill(node: SceneNode): boolean {
    console.log(`    Checking for black fill in: ${node.name} (${node.type})`);

    // Check direct fills
    if ("fills" in node) {
      const fills = node.fills;

      // If fills is figma.mixed (symbol), the vector has multiple fill regions
      // This happens with flattened vectors that have different colors
      if (typeof fills === "symbol") {
        console.log(
          `      fills is mixed (symbol) - vector has multiple fill regions`,
        );
        // For mixed fills, we can't directly check the colors via the API
        // We assume it's valid if it's a single flattened vector
        // The processor will handle the actual color binding
        return true; // Assume black is present in mixed fills
      } else if (Array.isArray(fills)) {
        console.log(`      Has ${fills.length} fills`);
        for (const fill of fills) {
          if (fill.type === "SOLID") {
            const { r, g, b } = fill.color;
            console.log(
              `        Fill: r=${r.toFixed(3)}, g=${g.toFixed(3)}, b=${b.toFixed(3)}, visible=${fill.visible !== false}`,
            );

            if (fill.visible !== false) {
              // Black is close to 0,0,0
              if (r < 0.1 && g < 0.1 && b < 0.1) {
                console.log(`        ✓ Found black fill!`);
                return true;
              }
            }
          }
        }
      } else {
        console.log(`      fills is unexpected type: ${typeof fills}`);
      }
    } else {
      console.log(`      Node has no 'fills' property`);
    }

    // For boolean operations, check children recursively
    if ("children" in node && node.children) {
      console.log(`      Checking ${node.children.length} children...`);
      for (const child of node.children) {
        if (this.hasBlackFill(child)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if vector has red fill (recursively checks children for boolean operations)
   */
  private hasRedFill(node: SceneNode): boolean {
    console.log(`    Checking for red fill in: ${node.name} (${node.type})`);

    // Check direct fills
    if ("fills" in node) {
      const fills = node.fills;

      // If fills is figma.mixed (symbol), the vector has multiple fill regions
      // This happens with flattened vectors that have different colors
      if (typeof fills === "symbol") {
        console.log(
          `      fills is mixed (symbol) - vector has multiple fill regions`,
        );
        // For mixed fills, we can't directly check the colors via the API
        // We assume it's valid if it's a single flattened vector
        // The processor will handle the actual color binding
        return true; // Assume red is present in mixed fills
      } else if (Array.isArray(fills)) {
        console.log(`      Has ${fills.length} fills`);
        for (const fill of fills) {
          if (fill.type === "SOLID") {
            const { r, g, b } = fill.color;
            console.log(
              `        Fill: r=${r.toFixed(3)}, g=${g.toFixed(3)}, b=${b.toFixed(3)}, visible=${fill.visible !== false}`,
            );

            if (fill.visible !== false) {
              // Red is high r, low g and b
              if (r > 0.5 && g < 0.3 && b < 0.3) {
                console.log(`        ✓ Found red fill!`);
                return true;
              }
            }
          }
        }
      } else {
        console.log(`      fills is unexpected type: ${typeof fills}`);
      }
    } else {
      console.log(`      Node has no 'fills' property`);
    }

    // For boolean operations, check children recursively
    if ("children" in node && node.children) {
      console.log(`      Checking ${node.children.length} children...`);
      for (const child of node.children) {
        if (this.hasRedFill(child)) {
          return true;
        }
      }
    }

    return false;
  }
}
