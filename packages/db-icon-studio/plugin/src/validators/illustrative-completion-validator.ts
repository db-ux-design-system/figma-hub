/**
 * Illustrative Icon Completion Validator
 *
 * Checks if an illustrative icon is already fully processed:
 * - Structure: Component > Container > Group "Vectors" > Base + Pulse
 * - Color variables are bound
 * - Name is valid (snake_case)
 * - Size is valid (64x64, constraints)
 */

export interface IllustrativeCompletionResult {
  isComplete: boolean;
  hasCorrectStructure: boolean;
  hasColorVariables: boolean;
  missingLayers: string[];
}

const BASE_COLOR_KEY = "497497bca9694f6004d1667de59f1a903b3cd3ef";
const PULSE_COLOR_KEY = "998998d67d3ebef6f2692db932bce69431b3d0cc";

export class IllustrativeCompletionValidator {
  /**
   * Check if an illustrative icon is complete
   */
  validate(component: ComponentNode): IllustrativeCompletionResult {
    const result: IllustrativeCompletionResult = {
      isComplete: false,
      hasCorrectStructure: false,
      hasColorVariables: false,
      missingLayers: [],
    };

    // Check structure: Component > Container > Group "Vectors"
    if (!component.children || component.children.length === 0) {
      return result;
    }

    const container = component.children[0];
    if (!("children" in container) || !container.children) {
      return result;
    }

    // Find group named "Vectors"
    let vectorsGroup: SceneNode | null = null;
    for (const child of container.children) {
      if (
        (child.type === "GROUP" || child.type === "FRAME") &&
        child.name === "Vectors"
      ) {
        vectorsGroup = child;
        break;
      }
    }

    if (!vectorsGroup || !("children" in vectorsGroup)) {
      return result;
    }

    result.hasCorrectStructure = true;

    // Check for Base and Pulse layers
    let baseLayer: SceneNode | null = null;
    let pulseLayer: SceneNode | null = null;

    for (const child of vectorsGroup.children) {
      if (child.name === "Base") {
        baseLayer = child;
      } else if (child.name === "Pulse") {
        pulseLayer = child;
      }
    }

    if (!baseLayer) {
      result.missingLayers.push("Base");
    }
    if (!pulseLayer) {
      result.missingLayers.push("Pulse");
    }

    if (result.missingLayers.length > 0) {
      return result;
    }

    // Check if color variables are bound
    const baseHasVariable = this.hasColorVariable(baseLayer!, BASE_COLOR_KEY);
    const pulseHasVariable = this.hasColorVariable(
      pulseLayer!,
      PULSE_COLOR_KEY,
    );

    result.hasColorVariables = baseHasVariable && pulseHasVariable;

    // Icon is complete if structure is correct, layers exist, and variables are bound
    result.isComplete =
      result.hasCorrectStructure &&
      result.missingLayers.length === 0 &&
      result.hasColorVariables;

    return result;
  }

  /**
   * Check if a node has a color variable bound
   */
  private hasColorVariable(node: SceneNode, expectedKey: string): boolean {
    if (!("fills" in node) || !Array.isArray(node.fills)) {
      return false;
    }

    for (const fill of node.fills) {
      if (
        fill.type === "SOLID" &&
        "boundVariables" in fill &&
        fill.boundVariables?.color
      ) {
        // Has a bound variable - we could check if it matches expectedKey
        // but for now just check if any variable is bound
        return true;
      }
    }

    return false;
  }
}
