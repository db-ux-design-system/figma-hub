/**
 * Resolves what an instance actually *is*, based on its main component rather
 * than its layer name.
 *
 * Layer names are freely editable in Figma — a Shell instance renamed to
 * something like "PrimaryActions 3.1" is still a Shell. Matching on the main
 * component keeps detection stable across such renames.
 */

/**
 * The name that identifies a component to the user.
 *
 * For a variant, that is the name of its component set: the variant itself is
 * named after its properties (e.g. "🔀 Expanded=True"), while the set carries
 * the actual component name.
 */
export function componentDisplayName(component: ComponentNode): string {
  const parent = component.parent;

  if (parent && parent.type === "COMPONENT_SET") {
    return parent.name;
  }

  return component.name;
}

/**
 * Reads the component name behind an instance.
 *
 * @param node - Any node; non-instances resolve to null
 * @returns The component (set) name, or null if the node is not an instance or
 *          its main component is unavailable
 */
export async function getInstanceComponentName(
  node: BaseNode
): Promise<string | null> {
  if (node.type !== "INSTANCE") {
    return null;
  }

  const mainComponent = await node.getMainComponentAsync();

  if (!mainComponent) {
    return null;
  }

  return componentDisplayName(mainComponent);
}
