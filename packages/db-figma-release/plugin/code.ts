import { ModuleRegistry } from "./module-registry";
import { StampingModule } from "./modules/stamping/index";
import type {
  UIToPluginMessage,
  PluginToUIMessage,
  ProgressUpdate,
} from "./types";

figma.showUI(__html__, { width: 480, height: 600 });

// --- Helper functions for sending messages to the UI ---

function sendProgress(data: ProgressUpdate): void {
  figma.ui.postMessage({ type: "progress", data } as PluginToUIMessage);
}

function sendResult(module: string, data: unknown): void {
  figma.ui.postMessage({ type: "result", module, data } as PluginToUIMessage);
}

function sendError(message: string): void {
  figma.ui.postMessage({ type: "error", data: message } as PluginToUIMessage);
}

// --- Module Registry setup ---

const registry = new ModuleRegistry();
registry.register(new StampingModule(sendProgress));

// --- Message Router ---

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  try {
    switch (msg.type) {
      case "execute": {
        if (!msg.module || !msg.action) {
          sendError("Missing module or action in execute message");
          return;
        }

        const module = registry.get(msg.module);
        if (!module) {
          sendError(`Module "${msg.module}" not found`);
          return;
        }

        const result = await module.execute(msg.action, msg.payload);
        sendResult(msg.module, result);
        break;
      }

      case "getModules": {
        const modules = registry
          .getAll()
          .map(({ id, name, description }) => ({ id, name, description }));
        figma.ui.postMessage({
          type: "modules",
          data: modules,
        } as PluginToUIMessage);
        break;
      }

      case "getStorage": {
        // Placeholder — will be implemented in Task 9
        figma.ui.postMessage({
          type: "storage",
          data: {},
        } as PluginToUIMessage);
        break;
      }

      default:
        sendError(`Unknown message type: "${(msg as { type: string }).type}"`);
    }
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  }
};
