import { getInstanceComponentName } from "./componentIdentity";

/**
 * Resolves the current selection to the Shell/ControlPanel instances that
 * should receive an imported logo.
 *
 * Detection runs against the main component name, not the layer name, so
 * renamed instances are still recognised.
 */

/**
 * Component names of Shell and ControlPanel roots, e.g.
 * "Shell → (Def) 1440x1024 - Desktop (Beta)" or "CP → (Def) Top - Mobile (Beta)".
 *
 * Anchored at the start so subcomponents like "↳ Shell Content" or
 * "↳ CP Navigation → …" are not mistaken for roots.
 */
const SHELL_OR_CP_PATTERN = /^(Shell|CP|ControlPanel)\b/i;

/**
 * Returns the node as a Shell/ControlPanel root, or null if it is not one.
 */
async function asShellRoot(node: BaseNode): Promise<InstanceNode | null> {
  if (node.type !== "INSTANCE") {
    return null;
  }

  const componentName = await getInstanceComponentName(node);

  if (!componentName || !SHELL_OR_CP_PATTERN.test(componentName)) {
    return null;
  }

  return node;
}

/**
 * Resolves a node to the Shell/ControlPanel it belongs to.
 *
 * The outermost match wins: a ControlPanel nested inside a Shell resolves to
 * the Shell, so two selected nodes in the same Shell do not produce two
 * separate targets pointing at the same CP Brand.
 *
 * @returns The containing Shell/ControlPanel, or null if the node is outside one
 */
async function resolveShell(node: SceneNode): Promise<InstanceNode | null> {
  let current: BaseNode | null = node;
  let outermost: InstanceNode | null = null;

  while (current) {
    const shell = await asShellRoot(current);
    if (shell) {
      outermost = shell;
    }
    current = current.parent;
  }

  return outermost;
}

/**
 * Result of shell detection across the whole selection
 */
export interface ShellDetectionResult {
  /** The Shell/ControlPanel instances to import into, without duplicates */
  shells: InstanceNode[];
  /** Selected nodes that do not belong to any Shell */
  ignoredCount: number;
}

/**
 * Maps every selected node to its Shell/ControlPanel.
 *
 * Multiple selected nodes inside the same Shell collapse into one target.
 */
export async function detectShellContext(): Promise<ShellDetectionResult> {
  const shells: InstanceNode[] = [];
  const seenIds = new Set<string>();
  let ignoredCount = 0;

  for (const node of figma.currentPage.selection) {
    const shell = await resolveShell(node);

    if (!shell) {
      ignoredCount++;
      continue;
    }

    if (seenIds.has(shell.id)) {
      continue;
    }

    seenIds.add(shell.id);
    shells.push(shell);
  }

  return { shells, ignoredCount };
}
