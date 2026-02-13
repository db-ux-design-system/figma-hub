/**
 * Illustrative Handover Frame Validator
 *
 * Validates illustrative icons in the handover frame with structured checks.
 * Shows all required steps in a single error message.
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";
import { isBlackOrDarkGray, isRed } from "../utils/color-constants.js";

export class IllustrativeHandoverValidator {
  validate(node: FrameNode | ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const steps: string[] = [];

    // Check 1: Frame or Component?
    if (node.type === "FRAME") {
      steps.push(
        "<strong>Create component</strong> (⌥&nbsp;Opt&nbsp;+&nbsp;⌘&nbsp;Cmd&nbsp;+&nbsp;K)",
      );
    }

    // Get all children - could be direct vectors or nested in Container/Group
    if (!node.children || node.children.length === 0) {
      errors.push({ message: `No content found`, node: node.name });
      return { isValid: false, errors, warnings };
    }

    // Find all vectors in the entire node tree
    const vectors = this.findAllVectorsInNode(node);
    if (vectors.length === 0) {
      errors.push({ message: `No vector content found`, node: node.name });
      return { isValid: false, errors, warnings };
    }

    // Check strokes
    const hasStrokes = this.hasAnyStrokes(vectors);

    // Separate by color
    const { blackVectors, redVectors } = this.separateVectorsByColor(vectors);
    const hasManyBlackLayers = blackVectors.length > 1;
    const hasManyRedLayers = redVectors.length > 1;

    // Check if we need black vector steps
    const blackNeedsOutline = hasStrokes && blackVectors.length > 0;
    const blackNeedsUnion = hasManyBlackLayers;

    if (blackNeedsOutline || blackNeedsUnion) {
      const blackSubSteps: string[] = [];
      if (blackNeedsOutline) {
        blackSubSteps.push(
          "<strong>Outline stroke</strong> (⌥&nbsp;Opt&nbsp;+&nbsp;⌘&nbsp;Cmd&nbsp;+&nbsp;O)",
        );
      }
      if (blackNeedsUnion) {
        blackSubSteps.push(
          "<strong>Union black shapes</strong> (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;U)",
        );
      }
      steps.push(
        `Select all <strong>black vectors</strong><ul class="list-none pl-fix-md mt-1 space-y-1">${blackSubSteps.map((s) => `<li>- ${s}</li>`).join("")}</ul>`,
      );
    }

    // Check if we need red vector steps
    const redNeedsOutline = hasStrokes && redVectors.length > 0;
    const redNeedsUnion = hasManyRedLayers;

    if (redNeedsOutline || redNeedsUnion) {
      const redSubSteps: string[] = [];
      if (redNeedsOutline) {
        redSubSteps.push(
          "<strong>Outline stroke</strong> (⌥&nbsp;Opt&nbsp;+&nbsp;⌘&nbsp;Cmd&nbsp;+&nbsp;O)",
        );
      }
      if (redNeedsUnion) {
        redSubSteps.push(
          "<strong>Union red shapes</strong> (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;U)",
        );
      }
      steps.push(
        `Select all <strong>red vectors</strong><ul class="list-none pl-fix-md mt-1 space-y-1">${redSubSteps.map((s) => `<li>- ${s}</li>`).join("")}</ul>`,
      );
    }

    // Check if flattened: After proper flattening, there should be exactly 2 top-level
    // vectors named "Base" and "Pulse" (or similar structure indicating completion)
    // If we have 1 black and 1 red vector but they're not properly structured, flatten is needed
    const hasProperStructure = this.checkProperFlattenStructure(node);

    // Only show flatten step if:
    // - Not already properly flattened (no Base/Pulse structure)
    // - AND we have at least 1 black AND 1 red vector (need both colors to flatten)
    // - AND they are not the same vector (if only 1 vector with both colors, no flatten needed)
    const hasSeparateColorVectors =
      blackVectors.length >= 1 &&
      redVectors.length >= 1 &&
      !(
        blackVectors.length === 1 &&
        redVectors.length === 1 &&
        blackVectors[0] === redVectors[0]
      );

    const needsFlatten = !hasProperStructure && hasSeparateColorVectors;

    if (needsFlatten) {
      steps.push(
        "Select <strong>both color vectors</strong> and <strong>flatten</strong> paths (⌥&nbsp;Opt&nbsp;+&nbsp;⇧&nbsp;Shift&nbsp;+&nbsp;F)",
      );
    }

    // Build error message if steps are needed
    if (steps.length > 0) {
      const stepsHtml = steps.map((step, index) => `<li>${step}</li>`).join("");
      errors.push({
        message: `<p style="margin-bottom: 4px;">Please prepare your icon manually in Figma first:</p><ol class="list-decimal list-inside pl-fix-md my-fix-xs">${stepsHtml}</ol>`,
        node: node.name,
      });
    }

    return {
      isValid: steps.length === 0,
      errors,
      warnings,
    };
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

  private hasAnyStrokes(vectors: SceneNode[]): boolean {
    for (const vector of vectors) {
      if (
        "strokes" in vector &&
        Array.isArray(vector.strokes) &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        typeof vector.strokeWeight === "number" &&
        vector.strokeWeight > 0
      ) {
        return true;
      }
    }
    return false;
  }

  private separateVectorsByColor(vectors: SceneNode[]): {
    blackVectors: SceneNode[];
    redVectors: SceneNode[];
  } {
    const blackVectors: SceneNode[] = [];
    const redVectors: SceneNode[] = [];

    for (const vector of vectors) {
      const hasBlack = this.hasBlackColor(vector);
      const hasRed = this.hasRedColor(vector);

      if (hasBlack && !hasRed) {
        blackVectors.push(vector);
      } else if (hasRed && !hasBlack) {
        redVectors.push(vector);
      } else if (hasBlack && hasRed) {
        blackVectors.push(vector);
        redVectors.push(vector);
      }
    }

    return { blackVectors, redVectors };
  }

  private hasBlackColor(node: SceneNode): boolean {
    return this.hasBlackFill(node) || this.hasBlackStroke(node);
  }

  private hasRedColor(node: SceneNode): boolean {
    return this.hasRedFill(node) || this.hasRedStroke(node);
  }

  private hasBlackFill(node: SceneNode): boolean {
    if ("fills" in node) {
      const fills = node.fills;
      if (typeof fills === "symbol") return true;
      if (Array.isArray(fills)) {
        for (const fill of fills) {
          if (fill.type === "SOLID" && fill.visible !== false) {
            const { r, g, b } = fill.color;
            if (isBlackOrDarkGray(fill.color)) return true;
          }
        }
      }
    }
    if ("children" in node && node.children) {
      for (const child of node.children) {
        if (this.hasBlackFill(child)) return true;
      }
    }
    return false;
  }

  private hasRedFill(node: SceneNode): boolean {
    if ("fills" in node) {
      const fills = node.fills;
      if (typeof fills === "symbol") return true;
      if (Array.isArray(fills)) {
        for (const fill of fills) {
          if (fill.type === "SOLID" && fill.visible !== false) {
            const { r, g, b } = fill.color;
            if (isRed(fill.color)) return true;
          }
        }
      }
    }
    if ("children" in node && node.children) {
      for (const child of node.children) {
        if (this.hasRedFill(child)) return true;
      }
    }
    return false;
  }

  private hasBlackStroke(node: SceneNode): boolean {
    if ("strokes" in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === "SOLID" && stroke.visible !== false) {
          const { r, g, b } = stroke.color;
          if (isBlackOrDarkGray(stroke.color)) return true;
        }
      }
    }
    if ("children" in node && node.children) {
      for (const child of node.children) {
        if (this.hasBlackStroke(child)) return true;
      }
    }
    return false;
  }

  private hasRedStroke(node: SceneNode): boolean {
    if ("strokes" in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === "SOLID" && stroke.visible !== false) {
          const { r, g, b } = stroke.color;
          if (isRed(stroke.color)) return true;
        }
      }
    }
    if ("children" in node && node.children) {
      for (const child of node.children) {
        if (this.hasRedStroke(child)) return true;
      }
    }
    return false;
  }

  private checkProperFlattenStructure(
    node: FrameNode | ComponentNode,
  ): boolean {
    // Check if the structure has "Base" and "Pulse" layers at the top level
    // This indicates proper flattening has been done
    if (!node.children || node.children.length === 0) return false;

    const container = node.children[0];
    if (!("children" in container) || !container.children) return false;

    const childNames = container.children.map((child) =>
      "name" in child ? child.name.toLowerCase() : "",
    );

    const hasBase = childNames.some((name) => name.includes("base"));
    const hasPulse = childNames.some((name) => name.includes("pulse"));

    return hasBase && hasPulse;
  }
}
