import { getInstanceComponentName } from "./componentIdentity";

/**
 * Locates the CP Brand subcomponent inside a Shell/ControlPanel and determines
 * whether it can hold an imported logo.
 *
 * Capability is decided structurally, by the presence of the "📦 Logo" slot,
 * so it stays correct even if variants are renamed. The variant is resolved
 * separately and only used to explain *why* an import is not possible.
 */

/** Component name fragment identifying a CP Brand instance */
const CP_BRAND_PATTERN = /CP Brand/i;

/** Name of the slot that accepts the logo */
const LOGO_SLOT_NAME = "📦 Logo";

/**
 * How deep to descend when looking for the CP Brand.
 *
 * In the DS the CP Brand sits around six levels below the Shell
 * (Shell > CP > Container > Main Container > Start Container > Brand > CP Brand).
 * The limit keeps the search from walking entire page contents.
 */
const MAX_SEARCH_DEPTH = 8;

/**
 * The CP Brand variants that matter for logo placement.
 * - logozusatz: provides the "📦 Logo" slot
 * - custom: can be switched to Logozusatz by the user
 * - short: fixed by its ControlPanel, supports no logo at all
 */
export type CPBrandVariant = "logozusatz" | "custom" | "short" | "unknown";

/**
 * Result of the CP Brand lookup
 */
export interface CPBrandSlotResult {
  /** The CP Brand instance, or null if the Shell has none */
  cpBrandNode: InstanceNode | null;
  /** Which variant is in place, used for user-facing explanations */
  variant: CPBrandVariant;
  /** The "📦 Logo" slot. A non-null value means the logo can be placed. */
  logoSlot: SceneNode | null;
}

/**
 * Recursively searches for a CP Brand instance, identified by its main
 * component so renamed instances are still found.
 */
async function findCPBrand(
  root: SceneNode,
  depth = 0
): Promise<InstanceNode | null> {
  if (depth > MAX_SEARCH_DEPTH) {
    return null;
  }

  if (root.type === "INSTANCE") {
    const componentName = await getInstanceComponentName(root);
    if (componentName && CP_BRAND_PATTERN.test(componentName)) {
      return root;
    }
  }

  if ("children" in root) {
    for (const child of (root as ChildrenMixin & SceneNode).children) {
      const found = await findCPBrand(child, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Finds the "📦 Logo" slot within a CP Brand instance.
 */
function findLogoSlot(cpBrand: InstanceNode): SceneNode | null {
  for (const child of cpBrand.children) {
    if (child.name === LOGO_SLOT_NAME) {
      return child;
    }
  }
  return null;
}

/**
 * Classifies a CP Brand by its component name.
 *
 * Short is checked before Custom so the more specific explanation wins if a
 * name were to contain both.
 */
function classifyVariant(componentName: string): CPBrandVariant {
  if (/Logozusatz/i.test(componentName)) return "logozusatz";
  if (/Short/i.test(componentName)) return "short";
  if (/\(Def\) Custom/i.test(componentName)) return "custom";
  return "unknown";
}

/**
 * Locates the CP Brand within a Shell/ControlPanel and reports whether a logo
 * can be placed into it.
 *
 * @param shellNode - The Shell or ControlPanel node to search within
 */
export async function findCPBrandSlot(
  shellNode: SceneNode
): Promise<CPBrandSlotResult> {
  const cpBrandNode = await findCPBrand(shellNode);

  if (!cpBrandNode) {
    return { cpBrandNode: null, variant: "unknown", logoSlot: null };
  }

  const componentName =
    (await getInstanceComponentName(cpBrandNode)) || cpBrandNode.name;

  return {
    cpBrandNode,
    variant: classifyVariant(componentName),
    logoSlot: findLogoSlot(cpBrandNode),
  };
}
