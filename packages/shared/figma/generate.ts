import { OutputNode } from "shared/data";
import { delay } from "shared/utils";

export const getNodesRecursive = async (
  node: SceneNode,
  withCSS: boolean,
  depth: number = -1,
): Promise<OutputNode> => {
  const result: OutputNode = {
    type: node.type,
    name: node.name,
    id: node.id,
  };

  if (withCSS) {
    result.css = await node.getCSSAsync();
    await delay(40);
  }

  if (node.type === "INSTANCE") {
    if (node.variantProperties) {
      result.variantProperties = node.variantProperties;
      if (node.componentProperties) {
        result.componentProperties = Object.entries(
          node.componentProperties,
        ).reduce((previousValue, [key, prop]) => {
          return { ...previousValue, [key.split("#")[0]]: prop.value };
        }, {});
      }
    }

    const mainComponent = await node.getMainComponentAsync();
    if (mainComponent) {
      result.mainComponentName = mainComponent.name;
      if (mainComponent.parent) {
        result.componentName = mainComponent.parent.name;
      }
    }
  }

  if (node.type === "TEXT") {
    result.text = node.characters;
    result.fontName = node.fontName;
  }

  const anyNode = node as SceneNode & { children?: SceneNode[] };
  if (anyNode.children && depth !== 0) {
    const children = [];
    for (const child of anyNode.children) {
      children.push(await getNodesRecursive(child, withCSS, depth - 1));
    }
    result.children = children;
  }
  return result;
};

export const generateData = async (
  withCss: boolean,
  depth: number = -1,
  node?: SceneNode,
): Promise<OutputNode | undefined> => {
  let currentNode = node;

  if (!currentNode) {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
      currentNode = selection[0];
    }
  }

  if (currentNode) {
    return await getNodesRecursive(currentNode, withCss, depth);
  }

  return undefined;
};
