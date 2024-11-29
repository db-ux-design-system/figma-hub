import { Node, VariableModeType } from "shared/data";
import { delay } from "shared/utils";

export const getNodesRecursive = async (
  node: SceneNode,
  withCSS: boolean,
  withModes: boolean,
  depth: number = -1,
): Promise<Node> => {
  const result: Node = {
    type: node.type,
    name: node.name,
    id: node.id,
  };

  if (withCSS) {
    result.css = await node.getCSSAsync();
    await delay(40);
  }

  if (withModes) {
    if (node.explicitVariableModes) {
      const modes: VariableModeType[] = [];
      for (const [collectionId, modeId] of Object.entries(
        node.explicitVariableModes,
      )) {
        const collection =
          await figma.variables.getVariableCollectionByIdAsync(collectionId);
        await delay(40);
        if (collection) {
          const foundMode = collection.modes.find(
            (mode) => mode.modeId === modeId,
          );
          modes.push({
            collectionName: collection.name,
            collectionId: collectionId,
            modeId: modeId,
            foundModeName: foundMode?.name,
          });
        }
      }
      result.modes = modes;
    }
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
      children.push(
        await getNodesRecursive(child, withCSS, withModes, depth - 1),
      );
    }
    result.children = children;
  }
  return result;
};

export const generateData = async (
  withCss: boolean,
  withModes: boolean,
  depth: number = -1,
  node?: SceneNode,
): Promise<Node | undefined> => {
  let currentNode = node;

  if (!currentNode) {
    const selection = figma.currentPage.selection;
    if (selection.length === 1) {
      currentNode = selection[0];
    }
  }

  if (currentNode) {
    return await getNodesRecursive(currentNode, withCss, withModes, depth);
  }

  return undefined;
};
