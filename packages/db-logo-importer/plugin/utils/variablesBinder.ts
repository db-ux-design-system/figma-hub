import { CONFIG } from "../config";

/**
 * Binds a color variable to a layer's fill property
 *
 * @param frame - The frame containing the target layer
 * @param layerName - Name of the layer to bind the variable to
 * @param variable - The Figma variable to bind
 */
export function bindFillVariable(
  frame: FrameNode,
  layerName: string,
  variable: Variable
): void {
  const target = frame.findOne((node) => node.name === layerName);

  if (!target || !("fills" in target)) {
    console.warn(`Layer "${layerName}" not found or doesn't support fills`);
    return;
  }

  const paint = figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
    "color",
    variable
  );

  target.fills = [paint];
}

/**
 * Imports all required variables from the library
 *
 * @returns Object containing all imported variables
 * @throws Error if variables cannot be imported
 */
async function importVariables(): Promise<{
  dbLogo: Variable;
  logoAddition: Variable;
  componentHeight: Variable;
}> {
  const [dbLogo, logoAddition, componentHeight] = await Promise.all([
    figma.variables.importVariableByKeyAsync(CONFIG.keys.dbLogo),
    figma.variables.importVariableByKeyAsync(CONFIG.keys.logoAddition),
    figma.variables.importVariableByKeyAsync(CONFIG.keys.componentHeight),
  ]);

  return { dbLogo, logoAddition, componentHeight };
}

/**
 * Binds design system variables to frame layers and properties
 * - Binds color variables to "DB Logo" and "Logo Addition" layers
 * - Binds height variable (db-base/icon-font-size/md) to frame and SVG Container
 * - Locks frame aspect ratio
 *
 * @param frame - The frame to bind variables to
 * @throws Error if variables cannot be imported or bound
 */
export async function bindDesignVariables(
  frame: FrameNode
): Promise<void> {
  try {
    const variables = await importVariables();

    // Bind fill colors to specific layers
    bindFillVariable(frame, "DB Logo", variables.dbLogo);
    bindFillVariable(frame, "Logo Addition", variables.logoAddition);

    // Bind height variable to the frame
    frame.setBoundVariable("height", variables.componentHeight);

    // Also bind height to the SVG Container child
    const svgContainer = frame.findOne(
      (node) => node.name === "SVG Container"
    );
    if (svgContainer && "setBoundVariable" in svgContainer) {
      (svgContainer as FrameNode).setBoundVariable(
        "height",
        variables.componentHeight
      );
    }

    // Lock aspect ratio on the frame
    frame.lockAspectRatio();
  } catch (error) {
    throw new Error("Variables could not be linked. Check Library.");
  }
}
