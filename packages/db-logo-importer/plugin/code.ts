import { CONFIG } from "./config";
import {
  isValidSVG,
  cleanFilename,
  processAndFlattenLayers,
} from "./utils/svgProcessor";
import {
  createComponentFromSVG,
  setupComponent,
} from "./utils/componentBuilder";
import { bindDesignVariables } from "./utils/variablesBinder";

// Initialize plugin UI
figma.showUI(__html__, {
  width: CONFIG.ui.width,
  height: CONFIG.ui.height,
});

/**
 * Handles the complete SVG import workflow
 *
 * @param svgText - Raw SVG markup as string
 * @param filename - Original filename of the SVG
 */
async function handleSVGImport(
  svgText: string,
  filename: string
): Promise<void> {
  // Validate SVG data
  if (!isValidSVG(svgText)) {
    figma.notify("Error: Invalid SVG data received.");
    return;
  }

  try {
    // Create SVG node from markup
    const svgNode = figma.createNodeFromSvg(svgText);
    const componentName = cleanFilename(filename);

    // Process layers (flatten and rename)
    processAndFlattenLayers(svgNode as FrameNode);

    // Create and configure component
    const component = createComponentFromSVG(svgNode, componentName);
    setupComponent(component, svgNode);

    // Bind design system variables
    try {
      await bindDesignVariables(component);
    } catch (varError) {
      figma.notify("Variables could not be linked. Check Library.");
      console.error("Variable binding error:", varError);
    }

    // Success feedback
    figma.notify("Component created in viewport center");
    figma.ui.postMessage({ feedback: "Success: Logo imported." });
  } catch (error) {
    figma.notify("Error: SVG import failed.");
    figma.ui.postMessage({
      feedback: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.error("SVG import error:", error);
  }
}

/**
 * Message handler for UI communication
 */
figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-svg") {
    const { svg: svgText, filename } = msg;
    await handleSVGImport(svgText, filename);
  }
};
