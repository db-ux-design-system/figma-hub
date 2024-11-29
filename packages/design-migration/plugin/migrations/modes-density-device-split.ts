import { delay } from "shared/utils";
import { sendMessage } from "shared/figma";
import { MigrationNode } from "shared/design-migration/data";

const adaptiveSize = "Adaptive Size";
const migrationModes = [adaptiveSize];

const deviceCollectionId = "VariableCollectionId:7448:69";
const densityCollectionId = "VariableCollectionId:102:755";

const getDataRecursive = async (
  node: BaseNode & ExplicitVariableModesMixin & ChildrenMixin,
): Promise<MigrationNode[]> => {
  const modes: MigrationNode[] = [];

  sendMessage<undefined>({ type: "counter", data: undefined });

  if (node.explicitVariableModes) {
    for (const [collectionId, modeId] of Object.entries(
      node.explicitVariableModes,
    )) {
      const collection =
        await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection && migrationModes.includes(collection.name)) {
        const foundMode = collection.modes.find(
          (mode) => mode.modeId === modeId,
        );
        modes.push({
          id: node.id,
          name: node.name,
          type: node.type,
          collectionName: collection.name,
          collectionId: collectionId,
          modeId,
          foundModeName: foundMode?.name,
        });
      }
    }
  }

  if (node.children) {
    for (const childNode of node.children) {
      const childModes = await getDataRecursive(childNode as any);
      await delay(40);
      modes.push(...childModes);
    }
  }

  return modes;
};

export const splitDensityAndDeviceAnalyze = async () => {
  const data = await getDataRecursive(figma.currentPage);
  sendMessage<MigrationNode[]>({
    type: "data",
    data,
  });
};

export const replaceDensityAndDevice = async ({
  id,
  collectionId,
  collectionName,
  foundModeName,
}: MigrationNode) => {
  if (collectionName === adaptiveSize && collectionId) {
    if (foundModeName) {
      const splitModeName = foundModeName.split("-");
      if (splitModeName.length === 2) {
        const device = splitModeName[0];
        const density = splitModeName[1];
        const node = (await figma.getNodeByIdAsync(id)) as
          | (BaseNode & ExplicitVariableModesMixin)
          | null;
        const oldCollection =
          await figma.variables.getVariableCollectionByIdAsync(collectionId);
        const densityCollection =
          await figma.variables.getVariableCollectionByIdAsync(
            densityCollectionId,
          );
        const deviceCollection =
          await figma.variables.getVariableCollectionByIdAsync(
            deviceCollectionId,
          );

        if (
          node &&
          node.clearExplicitVariableModeForCollection &&
          oldCollection &&
          densityCollection &&
          deviceCollection
        ) {
          try {
            const foundDensity = densityCollection.modes.find(
              (mode) => mode.modeId.toLowerCase() == density.toLowerCase(),
            );
            const foundDevice = deviceCollection.modes.find(
              (mode) => mode.modeId.toLowerCase() == device.toLowerCase(),
            );
            if (foundDensity && foundDevice) {
              node.setExplicitVariableModeForCollection(
                deviceCollection.id,
                foundDevice.modeId,
              );
              node.setExplicitVariableModeForCollection(
                densityCollection.id,
                foundDensity.modeId,
              );
              node.clearExplicitVariableModeForCollection(oldCollection);
              sendMessage<string>({
                type: "update",
                data: id,
              });
            } else {
              sendMessage<unknown>({
                type: "error",
                data: "Cannot migrate",
              });
            }
          } catch (e: any) {
            sendMessage<unknown>({
              type: "error",
              data: e.message,
            });
          }
        }
      }
    }
  }
};
