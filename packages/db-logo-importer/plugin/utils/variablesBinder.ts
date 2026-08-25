import { CONFIG } from "../config";

/**
 * Everything that could not be bound during a logo import.
 *
 * Reported instead of thrown, so the caller can still deliver a usable logo
 * while telling the user that the design tokens are missing. An unnoticed
 * failure here produces a logo with hardcoded colours — exactly what this
 * plugin exists to prevent.
 */
export interface BindingIssues {
  /** Variables that could not be imported from the library */
  missingVariables: string[];
  /** Layers expected by the DB logo structure that were not found in the SVG */
  missingLayers: string[];
}

/**
 * Binds a color variable to a layer's fill property
 *
 * @param frame - The frame containing the target layer
 * @param layerName - Name of the layer to bind the variable to
 * @param variable - The Figma variable to bind
 * @returns true if the layer was found and bound
 */
export function bindFillVariable(
  frame: FrameNode,
  layerName: string,
  variable: Variable
): boolean {
  const target = frame.findOne((node) => node.name === layerName);

  if (!target || !("fills" in target)) {
    console.warn(`Layer "${layerName}" not found or doesn't support fills`);
    return false;
  }

  const paint = figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
    "color",
    variable
  );

  target.fills = [paint];
  return true;
}

/**
 * Imports a single variable by key.
 *
 * Failures are logged with the offending key and resolved as null instead of
 * rejecting, so one bad key does not hide the state of the others.
 */
async function importVariable(
  name: string,
  key: string
): Promise<Variable | null> {
  try {
    return await figma.variables.importVariableByKeyAsync(key);
  } catch (error) {
    console.error(
      `Variable "${name}" (key ${key}) could not be imported:`,
      error
    );
    return null;
  }
}

/**
 * Binds design system variables to frame layers and properties
 * - Binds color variables to "DB Logo" and "Logo Addition" layers
 * - Binds the height variable to the frame and the SVG Container
 * - Locks the frame aspect ratio
 *
 * @param frame - The frame to bind variables to
 * @returns The variables and layers that could not be bound
 */
export async function bindDesignVariables(
  frame: FrameNode
): Promise<BindingIssues> {
  const missingVariables: string[] = [];
  const missingLayers: string[] = [];

  const [dbLogo, logoAddition, componentHeight] = await Promise.all([
    importVariable("dbLogo", CONFIG.keys.dbLogo),
    importVariable("logoAddition", CONFIG.keys.logoAddition),
    importVariable("componentHeight", CONFIG.keys.componentHeight),
  ]);

  if (!dbLogo) missingVariables.push("DB Logo colour");
  if (!logoAddition) missingVariables.push("Logo Addition colour");
  if (!componentHeight) missingVariables.push("component height");

  // Bind fill colors to specific layers
  if (dbLogo && !bindFillVariable(frame, "DB Logo", dbLogo)) {
    missingLayers.push("DB Logo");
  }
  if (logoAddition && !bindFillVariable(frame, "Logo Addition", logoAddition)) {
    missingLayers.push("Logo Addition");
  }

  // Bind height variable to the frame and its SVG Container
  if (componentHeight) {
    frame.setBoundVariable("height", componentHeight);

    const svgContainer = frame.findOne(
      (node) => node.name === "SVG Container"
    );
    if (svgContainer && "setBoundVariable" in svgContainer) {
      (svgContainer as FrameNode).setBoundVariable("height", componentHeight);
    }
  }

  frame.lockAspectRatio();

  return { missingVariables, missingLayers };
}

/**
 * Turns binding issues into a message fragment for the user, or null when
 * everything was bound successfully.
 */
export function describeBindingIssues(issues: BindingIssues): string | null {
  const parts: string[] = [];

  if (issues.missingVariables.length > 0) {
    parts.push(
      `variables not found in the library (${issues.missingVariables.join(", ")})`
    );
  }
  if (issues.missingLayers.length > 0) {
    parts.push(
      `layers missing in the SVG (${issues.missingLayers.join(", ")})`
    );
  }

  if (parts.length === 0) return null;

  return `the DB design tokens could not be applied: ${parts.join("; ")}`;
}
