import { delay } from "shared/utils";
import type {
  MigrationDefinition,
  MigrationNode,
  MigrationNodeResult,
  AnalysisContext,
  MigrationContext,
} from "../../src/types";

const ADAPTIVE_SIZE = "Adaptive Size";
const MIGRATION_MODES = [ADAPTIVE_SIZE];

const DEVICE_COLLECTION_ID = "VariableCollectionId:7448:69";
const DENSITY_COLLECTION_ID = "VariableCollectionId:102:755";

/**
 * Recursively traverses nodes looking for explicitVariableModes
 * with the "Adaptive Size" collection.
 */
async function getDataRecursive(
  node: BaseNode & ExplicitVariableModesMixin & ChildrenMixin,
  reportProgress: (nodesScanned: number) => void,
  counter: { value: number },
): Promise<MigrationNode[]> {
  const results: MigrationNode[] = [];

  counter.value++;
  reportProgress(counter.value);

  if (node.explicitVariableModes) {
    for (const [collectionId, modeId] of Object.entries(
      node.explicitVariableModes,
    )) {
      const collection =
        await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (collection && MIGRATION_MODES.includes(collection.name)) {
        const foundMode = collection.modes.find(
          (mode) => mode.modeId === modeId,
        );
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          details: {
            collectionName: collection.name,
            foundModeName: foundMode?.name ?? "unknown",
          },
        });
      }
    }
  }

  if (node.children) {
    for (const childNode of node.children) {
      const childResults = await getDataRecursive(
        childNode as BaseNode & ExplicitVariableModesMixin & ChildrenMixin,
        reportProgress,
        counter,
      );
      await delay(40);
      results.push(...childResults);
    }
  }

  return results;
}

/**
 * Reference migration: Splits the combined "Adaptive Size" collection
 * into separate Density and Device collections.
 */
const modesDensityDeviceSplit: MigrationDefinition<void> = {
  id: "modes-density-device-split",
  releaseVersion: "5.0.0",
  executionMode: "automatic",
  title: "Adaptive Size → Density + Device",
  description:
    'Splittet die kombinierte "Adaptive Size"-Collection in separate Density- und Device-Collections.',

  async analyze(context: AnalysisContext): Promise<MigrationNode[]> {
    const allNodes: MigrationNode[] = [];

    for (const rootNode of context.rootNodes) {
      const nodes = await getDataRecursive(
        rootNode as BaseNode & ExplicitVariableModesMixin & ChildrenMixin,
        context.reportProgress,
        { value: 0 },
      );
      allNodes.push(...nodes);
    }

    return allNodes;
  },

  async migrate(
    node: MigrationNode,
    context: MigrationContext<void>,
  ): Promise<MigrationNodeResult> {
    const { collectionName, foundModeName } = node.details;

    if (collectionName !== ADAPTIVE_SIZE) {
      return {
        nodeId: node.id,
        status: "skipped",
        description: `Node uses collection "${collectionName}", not "${ADAPTIVE_SIZE}".`,
      };
    }

    if (!foundModeName || foundModeName === "unknown") {
      return {
        nodeId: node.id,
        status: "error",
        description: "Could not determine mode name.",
        error: "Mode name is unknown.",
      };
    }

    const splitModeName = foundModeName.split("-");
    if (splitModeName.length !== 2) {
      return {
        nodeId: node.id,
        status: "error",
        description: `Mode name "${foundModeName}" does not match expected "device-density" pattern.`,
        error: `Invalid mode name format: "${foundModeName}".`,
      };
    }

    const device = splitModeName[0];
    const density = splitModeName[1];

    if (context.dryRun) {
      return {
        nodeId: node.id,
        status: "success",
        description: `Would split "${foundModeName}" into Device="${device}" and Density="${density}".`,
      };
    }

    // Perform the actual migration
    const figmaNode = (await figma.getNodeByIdAsync(node.id)) as
      | (BaseNode & ExplicitVariableModesMixin)
      | null;

    if (!figmaNode || !figmaNode.clearExplicitVariableModeForCollection) {
      return {
        nodeId: node.id,
        status: "error",
        description: "Node not found or does not support variable modes.",
        error: "Node not found or incompatible.",
      };
    }

    // Look up the old collection from the node's explicit modes
    let oldCollectionId: string | null = null;
    if (figmaNode.explicitVariableModes) {
      for (const [colId] of Object.entries(
        (figmaNode as BaseNode & ExplicitVariableModesMixin)
          .explicitVariableModes,
      )) {
        const col = await figma.variables.getVariableCollectionByIdAsync(colId);
        if (col && MIGRATION_MODES.includes(col.name)) {
          oldCollectionId = colId;
          break;
        }
      }
    }

    if (!oldCollectionId) {
      return {
        nodeId: node.id,
        status: "error",
        description: "Old Adaptive Size collection not found on node.",
        error: "Collection not found.",
      };
    }

    const oldCollection =
      await figma.variables.getVariableCollectionByIdAsync(oldCollectionId);
    const densityCollection =
      await figma.variables.getVariableCollectionByIdAsync(
        DENSITY_COLLECTION_ID,
      );
    const deviceCollection =
      await figma.variables.getVariableCollectionByIdAsync(
        DEVICE_COLLECTION_ID,
      );

    if (!oldCollection || !densityCollection || !deviceCollection) {
      return {
        nodeId: node.id,
        status: "error",
        description: "Required collections not found in file.",
        error: "Density or Device collection missing.",
      };
    }

    try {
      const foundDensity = densityCollection.modes.find(
        (mode) => mode.modeId.toLowerCase() === density.toLowerCase(),
      );
      const foundDevice = deviceCollection.modes.find(
        (mode) => mode.modeId.toLowerCase() === device.toLowerCase(),
      );

      if (!foundDensity || !foundDevice) {
        return {
          nodeId: node.id,
          status: "error",
          description: `Cannot find matching modes for device="${device}" or density="${density}".`,
          error: "Cannot migrate: matching modes not found.",
        };
      }

      figmaNode.setExplicitVariableModeForCollection(
        deviceCollection.id,
        foundDevice.modeId,
      );
      figmaNode.setExplicitVariableModeForCollection(
        densityCollection.id,
        foundDensity.modeId,
      );
      figmaNode.clearExplicitVariableModeForCollection(oldCollection);

      return {
        nodeId: node.id,
        status: "success",
        description: `Split "${foundModeName}" into Device="${device}" and Density="${density}".`,
      };
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown migration error";
      return {
        nodeId: node.id,
        status: "error",
        description: `Failed to migrate node "${node.name}".`,
        error: errorMessage,
      };
    }
  },
};

export default modesDensityDeviceSplit;
