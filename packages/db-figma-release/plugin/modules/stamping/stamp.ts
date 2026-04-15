/**
 * Stamping — dual storage:
 *
 * 1. sharedPluginData on each component/set: so consumer plugins can read
 *    the version via instance.getMainComponentAsync()
 * 2. Root-map on figma.root: { componentName: version } as a lightweight
 *    reference for which version each component group is at.
 *    Keyed by name (not key), so "Button" covers all 4 Button sets.
 *
 * Version format: MAJOR.MINOR (no patch).
 */

export const PLUGIN_NAMESPACE = "db_ux";
export const VERSION_KEY = "version";
export const VERSION_MAP_KEY = "version_map";

const VERSION_PATTERN = /^\d+\.\d+$/;

export type VersionMap = Record<string, string>;

// --- Component-level ---

export function readComponentVersion(
  node: ComponentNode | ComponentSetNode,
): string | null {
  const v = node.getSharedPluginData(PLUGIN_NAMESPACE, VERSION_KEY);
  return v || null;
}

export function writeComponentVersion(
  node: ComponentNode | ComponentSetNode,
  version: string,
): void {
  node.setSharedPluginData(PLUGIN_NAMESPACE, VERSION_KEY, version);
}

// --- Root-level name-based map ---

export function readVersionMap(): VersionMap {
  const raw = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, VERSION_MAP_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as VersionMap;
  } catch {
    return {};
  }
}

export function writeVersionMap(map: VersionMap): void {
  figma.root.setSharedPluginData(
    PLUGIN_NAMESPACE,
    VERSION_MAP_KEY,
    JSON.stringify(map),
  );
}

// --- Helpers ---

/**
 * Extracts the base component name from a node name.
 * E.g. "💻 Prefix=DB, 💻 Component=Button, ..." → uses the full node.name
 * but for COMPONENT_SET the name is typically just "Button" etc.
 */
export function getComponentGroupName(
  node: ComponentNode | ComponentSetNode,
): string {
  return node.name;
}

export function isValidVersion(version: string): boolean {
  return VERSION_PATTERN.test(version);
}
