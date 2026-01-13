import { CONFIG } from "../config";

/**
 * Binds a color variable to a layer's fill property
 *
 * @param component - The component containing the target layer
 * @param layerName - Name of the layer to bind the variable to
 * @param variable - The Figma variable to bind
 */
export function bindFillVariable(
  component: ComponentNode,
  layerName: string,
  variable: Variable
): void {
  const target = component.findOne((node) => node.name === layerName);

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
 * Binds design system variables to component layers and properties
 * - Binds color variables to "DB Logo" and "Logo Addition" layers
 * - Binds height variable to component and SVG Container
 * - Locks component and SVG Container aspect ratio
 *
 * @param component - The component to bind variables to
 * @throws Error if variables cannot be imported or bound
 */
export async function bindDesignVariables(
  component: ComponentNode
): Promise<void> {
  try {
    const variables = await importVariables();

    // Bind fill colors to specific layers
    bindFillVariable(component, "DB Logo", variables.dbLogo);
    bindFillVariable(component, "Logo Addition", variables.logoAddition);

    // Bind height variable to SVG Container
    const svgContainer = component.findOne(
      (node) => node.name === "SVG Container"
    );
    if (svgContainer && "setBoundVariable" in svgContainer) {
      svgContainer.setBoundVariable("height", variables.componentHeight);
    }

    // Bind height variable to component and lock aspect ratio
    component.setBoundVariable("height", variables.componentHeight);
    component.lockAspectRatio();

    component.constraints = {
      horizontal: "MIN",
      vertical: "MIN",
    };
  } catch (error) {
    throw new Error("Variables could not be linked. Check Library.");
  }
}
