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
  iconType: "functional" | "illustrative" | null;
  componentSet: ComponentSetNode | null;
  variants: ComponentNode[];
}

/**
 * Get information about the current selection
 *
 * Requirements:
 * - 2.1: Detect when a Component Set is selected
 * - 2.2: Determine if it is functional or illustrative
 * - 2.3: Handle no selection case
 * - 2.4: Only process Component Set nodes
 *
 * @returns Selection information
 */
export function getSelectionInfo(): InternalSelectionInfo {
  const selection = figma.currentPage.selection;

  // Requirement 2.3: Handle no selection
  if (selection.length === 0) {
    return {
      isComponentSet: false,
      iconType: null,
      componentSet: null,
      variants: [],
    };
  }

  // Handle multiple selections
  if (selection.length > 1) {
    return {
      isComponentSet: false,
      iconType: null,
      componentSet: null,
      variants: [],
    };
  }

  const node = selection[0];

  // Requirement 2.4: Only process Component Set nodes
  if (node.type !== "COMPONENT_SET") {
    return {
      isComponentSet: false,
      iconType: null,
      componentSet: null,
      variants: [],
    };
  }

  // Requirement 2.1: Detect Component Set selection
  // Requirement 2.2: Determine icon type
  const iconType = detectIconType(node);
  const variants = node.children as ComponentNode[];

  return {
    isComponentSet: true,
    iconType,
    componentSet: node,
    variants,
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
 * Validate that a component set is selected
 *
 * @throws SelectionError if no valid component set is selected
 * @returns The selected component set and its info
 */
export function requireComponentSet(): InternalSelectionInfo {
  const info = getSelectionInfo();

  if (!info.isComponentSet || !info.componentSet) {
    throw new SelectionError(
      "Please select a Component Set to perform this operation",
    );
  }

  return info;
}

/**
 * Find all vector nodes within a scene node tree
 *
 * @param node - The root node to search
 * @returns Array of all vector nodes found
 */
export function findVectorNodes(node: SceneNode): VectorNode[] {
  const vectors: VectorNode[] = [];

  if (node.type === "VECTOR") {
    vectors.push(node);
  }

  if ("children" in node) {
    for (const child of node.children) {
      vectors.push(...findVectorNodes(child));
    }
  }

  return vectors;
}
