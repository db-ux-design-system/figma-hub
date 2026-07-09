import { CONFIG } from "./config";
import { isValidSVG, cleanFilename, processAndFlattenLayers } from "./utils/svgProcessor";
import { createFrameFromSVG, setupFrame } from "./utils/componentBuilder";
import { bindDesignVariables } from "./utils/variablesBinder";
import { detectShellContext } from "./utils/shellDetector";
import { findCPBrandSlot } from "./utils/cpBrandFinder";

// Initialize plugin UI
figma.showUI(__html__, {
  width: CONFIG.ui.width,
  height: CONFIG.ui.height,
});

/**
 * Handles importing a logo into the CP Brand Children slot
 * within a Shell or ControlPanel component.
 *
 * @param svgText - Raw SVG markup as string
 * @param filename - Original filename of the SVG
 * @param shellNode - The detected Shell/ControlPanel node
 * @returns true if the logo was successfully placed in the slot
 */
async function handleShellImport(
  svgText: string,
  filename: string,
  shellNode: SceneNode
): Promise<boolean> {
  const slotResult = findCPBrandSlot(shellNode);

  if (!slotResult.hasSlot || !slotResult.childrenSlot) {
    figma.notify(
      "This Shell variant has no CP Brand Children slot. Using default import."
    );
    return false;
  }

  try {
    // Create SVG node from markup
    const svgNode = figma.createNodeFromSvg(svgText);
    const frameName = cleanFilename(filename);

    // Process layers (flatten and rename)
    processAndFlattenLayers(svgNode as FrameNode);

    // Create the logo frame
    const frame = createFrameFromSVG(svgNode, frameName);
    setupFrame(frame, svgNode);

    // Bind design system variables
    try {
      await bindDesignVariables(frame);
    } catch (varError) {
      console.error("Variable binding error:", varError);
    }

    // Remove existing logo from the slot if present
    if (slotResult.existingLogo) {
      slotResult.existingLogo.remove();
    }

    // Move the new logo frame into the Children slot
    const slot = slotResult.childrenSlot as ChildrenMixin & SceneNode;
    slot.appendChild(frame);

    // Reset position within the slot
    frame.x = 0;
    frame.y = 0;

    // Success feedback
    const action = slotResult.existingLogo ? "replaced" : "inserted";
    figma.notify(`Logo ${action} in CP Brand Children slot.`);
    figma.ui.postMessage({
      feedback: `Success: Logo ${action} in Shell component.`,
    });

    return true;
  } catch (error) {
    console.error("Shell import error:", error);
    figma.notify("Error placing logo in Shell. Using default import.");
    return false;
  }
}

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

  // Check if a Shell or ControlPanel is selected
  const shellContext = detectShellContext();

  if (shellContext.isShellContext && shellContext.shellNode) {
    const placed = await handleShellImport(
      svgText,
      filename,
      shellContext.shellNode
    );
    if (placed) return; // Successfully placed in shell, done
    // If placement failed, fall through to default behavior
  }

  try {
    // Create SVG node from markup
    const svgNode = figma.createNodeFromSvg(svgText);
    const frameName = cleanFilename(filename);

    // Process layers (flatten and rename)
    processAndFlattenLayers(svgNode as FrameNode);

    // Create and configure frame
    const frame = createFrameFromSVG(svgNode, frameName);
    setupFrame(frame, svgNode);

    // Bind design system variables (height token)
    try {
      await bindDesignVariables(frame);
    } catch (varError) {
      figma.notify("Variables could not be linked. Check Library.");
      console.error("Variable binding error:", varError);
    }

    // Success feedback
    figma.notify("Frame created in viewport center");
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
