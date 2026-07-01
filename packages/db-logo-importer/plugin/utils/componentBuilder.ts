import { CONFIG } from "../config";

/**
 * Creates a frame containing the SVG node
 *
 * @param svgNode - The SVG node to wrap in a frame
 * @param frameName - Name for the frame
 * @returns The created frame
 */
export function createFrameFromSVG(
  svgNode: SceneNode,
  frameName: string
): FrameNode {
  const frame = figma.createFrame();
  frame.name = frameName;
  svgNode.name = "SVG Container";

  frame.appendChild(svgNode);
  frame.fills = []; // Remove default white fill
  figma.currentPage.appendChild(frame);

  return frame;
}

/**
 * Scales an SVG node to match the target height while maintaining aspect ratio
 *
 * @param svgNode - The node to scale
 * @param targetHeight - Desired height in pixels
 */
export function scaleSVGToHeight(
  svgNode: SceneNode,
  targetHeight: number
): void {
  if (!("height" in svgNode) || !("width" in svgNode)) {
    return;
  }

  const scale = targetHeight / svgNode.height;
  const newWidth = svgNode.width * scale;

  if ("resize" in svgNode) {
    svgNode.resize(newWidth, targetHeight);
  }
}

/**
 * Configures auto layout settings for a frame
 * Sets horizontal layout with hug width and fixed height
 *
 * @param frame - The frame to configure
 */
export function setupAutoLayout(frame: FrameNode): void {
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO"; // Hug Width
  frame.counterAxisSizingMode = "FIXED"; // Fixed Height

  // Remove all padding
  frame.paddingLeft = 0;
  frame.paddingRight = 0;
  frame.paddingTop = 0;
  frame.paddingBottom = 0;
  frame.itemSpacing = 0;

  // Configure child container (SVG Container)
  if (frame.children.length > 0) {
    const child = frame.children[0];

    // Lock aspect ratio for SVG Container
    if ("constraints" in child) {
      child.constraints = {
        horizontal: "STRETCH",
        vertical: "STRETCH",
      };
    }

    if ("layoutGrow" in child) {
      child.layoutGrow = 1;
    }
  }
}

/**
 * Positions a frame in the center of the current viewport
 *
 * @param frame - The frame to position
 */
export function centerInViewport(frame: FrameNode): void {
  const viewCenter = figma.viewport.center;
  frame.x = viewCenter.x - frame.width / 2;
  frame.y = viewCenter.y - frame.height / 2;
}

/**
 * Complete frame setup including scaling, layout, and positioning
 *
 * @param frame - The frame to set up
 * @param svgNode - The SVG node inside the frame
 */
export function setupFrame(
  frame: FrameNode,
  svgNode: SceneNode
): void {
  // 1. Scale SVG to target height
  scaleSVGToHeight(svgNode, CONFIG.targetHeight);

  // 2. Lock aspect ratio on SVG Container BEFORE setting up auto layout
  if ("constraints" in svgNode && "lockAspectRatio" in svgNode) {
    svgNode.lockAspectRatio();
    svgNode.constraints = {
      horizontal: "STRETCH",
      vertical: "STRETCH",
    };
  }

  // 3. Setup auto layout
  setupAutoLayout(frame);

  // 4. Center in viewport
  centerInViewport(frame);
}
