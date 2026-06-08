import { MigrationRegistry } from "./registry";
import { MigrationExecutor } from "./executor";
import { PersistenceManager } from "./persistence";
import { VersionChecker } from "./version-checker";
import { MessageHandler } from "./message-handler";
import type { MigrationDefinition, PluginMessageToUI } from "./types";
import * as migrations from "../migrations";

// --- Setup ---

const registry = new MigrationRegistry();

// Register all migrations from the barrel import
for (const def of Object.values(migrations)) {
  if (def && typeof def === "object" && "id" in def) {
    registry.register(def as MigrationDefinition<unknown>);
  }
}

// Validate dependency graph (fail-fast on circular dependencies)
registry.validateDependencies();

// --- Instantiate core components ---

const persistence = new PersistenceManager();
const versionChecker = new VersionChecker();

const sendMessage = (msg: PluginMessageToUI): void => {
  figma.ui.postMessage(msg);
};

const executor = new MigrationExecutor(registry, persistence, sendMessage);

const messageHandler = new MessageHandler(
  executor,
  registry,
  persistence,
  versionChecker,
  sendMessage,
);

// --- Plugin UI ---

figma.showUI(__html__, { height: 768, width: 600 });

figma.ui.onmessage = async (msg: unknown) => {
  await messageHandler.handleMessage(
    msg as Parameters<typeof messageHandler.handleMessage>[0],
  );
};
