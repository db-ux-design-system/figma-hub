import { CONFIG } from "../config";

/**
 * Creates a new component from an SVG node
 *
 * @param svgNode - The SVG node to wrap in a component
 * @param componentName - Name for the component
 * @returns The created component
 */
export function createComponentFromSVG(
  svgNode: SceneNode,
  componentName: string
): ComponentNode {
  const component = figma.createComponent();
  component.name = componentName;
  svgNode.name = "SVG Container";

  component.appendChild(svgNode);
  figma.currentPage.appendChild(component);

  return component;
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
 * Configures auto layout settings for a component
 * Sets horizontal layout with hug width and fixed height
 *
 * @param component - The component to configure
 */
export function setupAutoLayout(component: ComponentNode): void {
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisSizingMode = "AUTO"; // Hug Width
  component.counterAxisSizingMode = "FIXED"; // Fixed Height

  // Remove all padding
  component.paddingLeft = 0;
  component.paddingRight = 0;
  component.paddingTop = 0;
  component.paddingBottom = 0;
  component.itemSpacing = 0;

  // Configure child container (SVG Container)
  if (component.children.length > 0) {
    const child = component.children[0];

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
 * Positions a component in the center of the current viewport
 *
 * @param component - The component to position
 */
export function centerInViewport(component: ComponentNode): void {
  const viewCenter = figma.viewport.center;
  component.x = viewCenter.x - component.width / 2;
  component.y = viewCenter.y - component.height / 2;
}

/**
 * Complete component setup including scaling, layout, and positioning
 *
 * @param component - The component to set up
 * @param svgNode - The SVG node inside the component
 */
export function setupComponent(
  component: ComponentNode,
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
  setupAutoLayout(component);

  // 4. Center in viewport
  centerInViewport(component);
}
