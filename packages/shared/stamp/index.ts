/**
 * Shared stamp utilities for reading the update-stamp set by db-figma-release.
 *
 * The stamp is stored as sharedPluginData (namespace "db_ux", key "updated_with")
 * on ComponentNode / ComponentSetNode. Since sharedPluginData is cross-plugin,
 * any Figma plugin can read it.
 *
 * Version format: MAJOR.MINOR (e.g. "4.6", "5.0").
 */

export const PLUGIN_NAMESPACE = "db_ux";
export const UPDATED_WITH_KEY = "updated_with";

/**
 * Reads the `updated_with` stamp from a component or component set.
 * Returns the version string (e.g. "4.6") or null if no stamp exists.
 */
export function readStamp(
  node: ComponentNode | ComponentSetNode,
): string | null {
  const v = node.getSharedPluginData(PLUGIN_NAMESPACE, UPDATED_WITH_KEY);
  return v || null;
}

/**
 * Reads the stamp from an instance's main component.
 * Returns the version string or null if the main component
 * cannot be resolved or has no stamp.
 */
export async function readStampFromInstance(
  instance: InstanceNode,
): Promise<string | null> {
  const mainComponent = await instance.getMainComponentAsync();
  if (!mainComponent) return null;

  // If the main component lives inside a COMPONENT_SET, check the set first
  if (mainComponent.parent && mainComponent.parent.type === "COMPONENT_SET") {
    const setStamp = readStamp(mainComponent.parent as ComponentSetNode);
    if (setStamp) return setStamp;
  }

  return readStamp(mainComponent);
}

/** The minimum stamp version required for automated v5 migration. */
export const REQUIRED_STAMP_FOR_V5 = "4.6";

/**
 * Checks whether a stamp version is eligible for automated migration.
 * Only exact match with the required version is considered eligible.
 */
export function isEligibleForMigration(
  stamp: string | null,
  requiredVersion: string = REQUIRED_STAMP_FOR_V5,
): boolean {
  return stamp === requiredVersion;
}
