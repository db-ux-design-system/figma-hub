/**
 * Utilities for locating the CP Brand subcomponent and its Children slot
 * within Shell/ControlPanel component trees.
 */

/** Name pattern for CP Brand instances */
const CP_BRAND_PATTERN = /CP Brand/i;

/** Name pattern for the Children slot */
const CHILDREN_SLOT_NAME = "📦 Children";

/**
 * Result of the CP Brand slot search
 */
export interface CPBrandSlotResult {
  /** Whether a usable Children slot was found */
  hasSlot: boolean;
  /** The CP Brand instance node */
  cpBrandNode: SceneNode | null;
  /** The Children slot node within CP Brand */
  childrenSlot: SceneNode | null;
  /** Existing logo frame inside the slot (if any) */
  existingLogo: SceneNode | null;
}

/**
 * Recursively searches a node tree for a CP Brand instance.
 *
 * @param root - The root node to search within
 * @returns The CP Brand instance or null
 */
function findCPBrand(root: SceneNode): SceneNode | null {
  if (CP_BRAND_PATTERN.test(root.name)) {
    return root;
  }

  if ("children" in root) {
    for (const child of (root as ChildrenMixin & SceneNode).children) {
      const found = findCPBrand(child);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Finds the Children slot within a CP Brand node.
 *
 * @param cpBrand - The CP Brand node to search
 * @returns The Children slot node or null
 */
function findChildrenSlot(cpBrand: SceneNode): SceneNode | null {
  if (!("children" in cpBrand)) return null;

  const parent = cpBrand as ChildrenMixin & SceneNode;

  for (const child of parent.children) {
    if (child.name === CHILDREN_SLOT_NAME) {
      return child;
    }
    // Recurse one level deeper in case of nested structure
    if ("children" in child) {
      for (const grandchild of (child as ChildrenMixin & SceneNode).children) {
        if (grandchild.name === CHILDREN_SLOT_NAME) {
          return grandchild;
        }
      }
    }
  }

  return null;
}

/**
 * Finds an existing logo frame inside the Children slot.
 * Looks for frames that contain an "SVG Container" child,
 * which is the structure created by this plugin.
 *
 * @param slot - The Children slot node
 * @returns The existing logo frame or null
 */
function findExistingLogo(slot: SceneNode): SceneNode | null {
  if (!("children" in slot)) return null;

  const parent = slot as ChildrenMixin & SceneNode;

  for (const child of parent.children) {
    // Match frames that have SVG Container or look like logo frames
    if (child.type === "FRAME" || child.type === "INSTANCE" || child.type === "COMPONENT") {
      if ("children" in child) {
        const hasLogoContent = (child as ChildrenMixin & SceneNode).children.some(
          (c) => c.name === "SVG Container"
        );
        if (hasLogoContent) {
          return child;
        }
      }
      // Also match if the frame itself looks like a logo (name "DB" or similar)
      if (child.name === "DB" || child.name.toLowerCase().includes("logo")) {
        return child;
      }
    }
  }

  return null;
}

/**
 * Locates the CP Brand subcomponent within a Shell/ControlPanel node
 * and checks if it has a usable Children slot for logo placement.
 *
 * @param shellNode - The Shell or ControlPanel node to search within
 * @returns Result with slot information and existing logo reference
 */
export function findCPBrandSlot(shellNode: SceneNode): CPBrandSlotResult {
  const cpBrandNode = findCPBrand(shellNode);

  if (!cpBrandNode) {
    return {
      hasSlot: false,
      cpBrandNode: null,
      childrenSlot: null,
      existingLogo: null,
    };
  }

  const childrenSlot = findChildrenSlot(cpBrandNode);

  if (!childrenSlot) {
    return {
      hasSlot: false,
      cpBrandNode,
      childrenSlot: null,
      existingLogo: null,
    };
  }

  const existingLogo = findExistingLogo(childrenSlot);

  return {
    hasSlot: true,
    cpBrandNode,
    childrenSlot,
    existingLogo,
  };
}
