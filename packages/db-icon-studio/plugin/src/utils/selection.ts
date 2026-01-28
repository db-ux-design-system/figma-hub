/**
 * Selection Manager
 *
 * Manages the selection and detection of Component Sets.
 * Implements Requirements 2.1, 2.2, 2.3, 2.4
 */

import { SelectionError } from "./error-handler.js";

/**
 * Internal selection info with full Figma node references
 */
export interface InternalSelectionInfo {
  isComponentSet: boolean;
  isComponent: boolean;
  isMasterIconFrame: boolean;
  iconType: "functional" | "illustrative" | null;
  componentSet: ComponentSetNode | null;
  component: ComponentNode | null;
  masterIconFrame: FrameNode | null;
  variants: ComponentNode[];
}

/**
 * Get information about the current selection
 *
 * Requirements:
 * - 2.1: Detect when a Component Set or Component is selected
 * - 2.2: Determine if it is functional or illustrative
 * - 2.3: Handle no selection case
 * - 2.4: Process Component Set or Component nodes
 *
 * @returns Selection information
 */
export function getSelectionInfo(): InternalSelectionInfo {
  const selection = figma.currentPage.selection;

  // Requirement 2.3: Handle no selection
  if (selection.length === 0) {
    return {
      isComponentSet: false,
      isComponent: false,
      isMasterIconFrame: false,
      iconType: null,
      componentSet: null,
      component: null,
      masterIconFrame: null,
      variants: [],
    };
  }

  // Handle multiple selections
  if (selection.length > 1) {
    return {
      isComponentSet: false,
      isComponent: false,
      isMasterIconFrame: false,
      iconType: null,
      componentSet: null,
      component: null,
      masterIconFrame: null,
      variants: [],
    };
  }

  const node = selection[0];

  // Debug: Log the node type
  console.log(
    `[getSelectionInfo] Selected node type: ${node.type}, name: ${node.name}`,
  );

  // Check for Frame (master icon template)
  if (node.type === "FRAME") {
    const iconType = detectIconTypeFromFrame(node);
    console.log(
      `[getSelectionInfo] Detected as FRAME with iconType: ${iconType}`,
    );

    // Only treat as master icon frame if it has a valid size
    if (iconType) {
      return {
        isComponentSet: false,
        isComponent: false,
        isMasterIconFrame: true,
        iconType,
        componentSet: null,
        component: null,
        masterIconFrame: node,
        variants: [],
      };
    }

    // Frame with invalid size - not a master icon frame
    return {
      isComponentSet: false,
      isComponent: false,
      isMasterIconFrame: false,
      iconType: null,
      componentSet: null,
      component: null,
      masterIconFrame: null,
      variants: [],
    };
  }

  // Check for Component Set (functional icons)
  if (node.type === "COMPONENT_SET") {
    const iconType = detectIconType(node);
    console.log(
      `[getSelectionInfo] Detected as COMPONENT_SET with iconType: ${iconType}`,
    );

    return {
      isComponentSet: true,
      isComponent: false,
      isMasterIconFrame: false,
      iconType,
      componentSet: node,
      component: null,
      masterIconFrame: null,
      variants: [],
    };
  }

  // Check for single Component (illustrative icons or variant within a set)
  if (node.type === "COMPONENT") {
    console.log(`[getSelectionInfo] Detected as COMPONENT`);

    // Check if this component is part of a ComponentSet
    const parentNode = node.parent;

    if (parentNode && parentNode.type === "COMPONENT_SET") {
      // This is a variant within a ComponentSet (functional icon)
      const iconType = detectIconType(parentNode);
      console.log(
        `[getSelectionInfo] Component is part of ComponentSet with iconType: ${iconType}`,
      );

      return {
        isComponentSet: false,
        isComponent: true,
        isMasterIconFrame: false,
        iconType,
        componentSet: null,
        component: node,
        masterIconFrame: null,
        variants: [],
      };
    }

    // This is a standalone component (illustrative icon)
    const iconType = detectIconTypeFromComponent(node);
    console.log(
      `[getSelectionInfo] Standalone component with iconType: ${iconType}`,
    );

    return {
      isComponentSet: false,
      isComponent: true,
      isMasterIconFrame: false,
      iconType,
      componentSet: null,
      component: node,
      masterIconFrame: null,
      variants: [],
    };
  }

  console.log(`[getSelectionInfo] Node type ${node.type} not recognized`);

  // Not a valid selection
  return {
    isComponentSet: false,
    isComponent: false,
    isMasterIconFrame: false,
    iconType: null,
    componentSet: null,
    component: null,
    masterIconFrame: null,
    variants: [],
  };
}

/**
 * Detect the icon type based on component set properties
 *
 * Requirement 2.2: Determine if icon is functional or illustrative
 *
 * @param componentSet - The component set to analyze
 * @returns The detected icon type
 */
export function detectIconType(
  componentSet: ComponentSetNode,
): "functional" | "illustrative" {
  const name = componentSet.name.toLowerCase();

  // Check for illustrative indicators in name
  if (name.includes("illustrative") || name.includes("illu")) {
    return "illustrative";
  }

  // Check for functional indicators in name
  if (name.includes("functional") || name.includes("ic-")) {
    return "functional";
  }

  // Default to functional if no clear indicator
  return "functional";
}

/**
 * Detect the icon type from a single component
 *
 * @param component - The component to analyze
 * @returns The detected icon type
 */
export function detectIconTypeFromComponent(
  component: ComponentNode,
): "functional" | "illustrative" {
  const name = component.name.toLowerCase();

  // Check for illustrative indicators in name
  if (
    name.includes("illustrative") ||
    name.includes("illu") ||
    name.includes("ii-")
  ) {
    return "illustrative";
  }

  // Check for functional indicators in name
  if (name.includes("functional") || name.includes("ic-")) {
    return "functional";
  }

  // Default to illustrative for single components
  return "illustrative";
}

/**
 * Detect the icon type from a frame (master icon template)
 *
 * @param frame - The frame to analyze
 * @returns The detected icon type
 */
export function detectIconTypeFromFrame(
  frame: FrameNode,
): "functional" | "illustrative" | null {
  const size = Math.round(frame.width);

  // Functional icon sizes: 32, 24, 20
  if ([32, 24, 20].includes(size)) {
    return "functional";
  }

  // Illustrative icon size: 64
  if (size === 64) {
    return "illustrative";
  }

  // Unknown size
  return null;
}

/**
 * Validate that a component set or component is selected
 *
 * @throws SelectionError if no valid component set or component is selected
 * @returns The selected component set/component and its info
 */
export function requireComponentSet(): InternalSelectionInfo {
  const info = getSelectionInfo();

  if (!info.isComponentSet && !info.isComponent) {
    throw new SelectionError(
      "Please select a Component Set (functional icons) or Component (illustrative icons) to perform this operation",
    );
  }

  if (!info.componentSet && !info.component) {
    throw new SelectionError(
      "Please select a Component Set or Component to perform this operation",
    );
  }

  return info;
}

/**
 * Find all vector nodes within a scene node tree
 * Includes VECTOR, ELLIPSE, LINE, RECTANGLE, POLYGON, STAR, etc.
 *
 * @param node - The root node to search
 * @returns Array of all vector nodes found
 */
export function findVectorNodes(node: SceneNode): VectorNode[] {
  const vectors: VectorNode[] = [];

  // Check if this is a vector-like node (all shape types that can have strokes)
  const vectorTypes = [
    "VECTOR",
    "ELLIPSE",
    "LINE",
    "RECTANGLE",
    "POLYGON",
    "STAR",
    "BOOLEAN_OPERATION",
  ];

  if (vectorTypes.includes(node.type)) {
    console.log(
      `[findVectorNodes] Found vector-like node: ${node.name}, type: ${node.type}`,
    );
    vectors.push(node as VectorNode);
    return vectors;
  }

  // Check if node has children property (works for FRAME, GROUP, COMPONENT, etc.)
  if ("children" in node && node.children) {
    for (const child of node.children) {
      vectors.push(...findVectorNodes(child));
    }
  }

  return vectors;
}
