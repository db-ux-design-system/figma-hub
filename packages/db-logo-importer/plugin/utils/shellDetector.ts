/**
 * Utilities for detecting Shell and ControlPanel component contexts.
 * Used to determine if the logo should be placed inside an existing
 * CP Brand Children slot instead of creating a new frame.
 */

/**
 * Name patterns that identify Shell or ControlPanel components/instances
 */
const SHELL_PATTERNS = [/^Shell\s*→/i, /^Shell\s/i];
const CONTROL_PANEL_PATTERNS = [/ControlPanel\s*→/i, /ControlPanel\s/i];

/**
 * Checks if a node name matches Shell or ControlPanel patterns
 */
function isShellOrControlPanel(name: string): boolean {
  return (
    SHELL_PATTERNS.some((p) => p.test(name)) ||
    CONTROL_PANEL_PATTERNS.some((p) => p.test(name))
  );
}

/**
 * Traverses the node tree upward to find a Shell or ControlPanel ancestor.
 * This handles cases where the user selects a child node within the Shell.
 *
 * @param node - Starting node to check
 * @returns The Shell/ControlPanel instance node, or null
 */
function findShellAncestor(
  node: SceneNode
): SceneNode | null {
  let current: BaseNode | null = node;

  while (current && "parent" in current) {
    if ("name" in current && isShellOrControlPanel(current.name as string)) {
      return current as SceneNode;
    }
    current = current.parent;
  }

  return null;
}

/**
 * Result of shell detection analysis
 */
export interface ShellDetectionResult {
  /** Whether a Shell or ControlPanel context was found */
  isShellContext: boolean;
  /** The Shell or ControlPanel node (could be the selection itself or an ancestor) */
  shellNode: SceneNode | null;
}

/**
 * Checks the current Figma selection for Shell or ControlPanel context.
 * Examines both the selected node itself and its ancestors.
 *
 * @returns Detection result with the shell node if found
 */
export function detectShellContext(): ShellDetectionResult {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    return { isShellContext: false, shellNode: null };
  }

  const selected = selection[0];

  // Check if the selected node itself is a Shell or ControlPanel
  if (isShellOrControlPanel(selected.name)) {
    return { isShellContext: true, shellNode: selected };
  }

  // Check ancestors
  const ancestor = findShellAncestor(selected);
  if (ancestor) {
    return { isShellContext: true, shellNode: ancestor };
  }

  return { isShellContext: false, shellNode: null };
}
