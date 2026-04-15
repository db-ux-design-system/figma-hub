import { ModuleRegistry } from "./module-registry";
import { StampingModule } from "./modules/stamping/index";
import { PLUGIN_NAMESPACE, VERSION_KEY } from "./modules/stamping/stamp";
import type {
  UIToPluginMessage,
  PluginToUIMessage,
  ProgressUpdate,
} from "./types";

figma.showUI(__html__, { width: 600, height: 768 });

function sendProgress(module: string, data: ProgressUpdate): void {
  figma.ui.postMessage({ type: "progress", module, data } as PluginToUIMessage);
}

function sendResult(module: string, data: unknown): void {
  figma.ui.postMessage({ type: "result", module, data } as PluginToUIMessage);
}

function sendError(message: string): void {
  figma.ui.postMessage({ type: "error", data: message } as PluginToUIMessage);
}

const registry = new ModuleRegistry();
registry.register(new StampingModule((data) => sendProgress("stamping", data)));

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  try {
    switch (msg.type) {
      case "execute": {
        if (!msg.module || !msg.action) {
          sendError("Missing module or action in execute message");
          return;
        }

        // detect-changed runs here directly so postMessage flushes between iterations
        if (msg.action === "detect-changed") {
          await detectChangedComponents();
          return;
        }

        const mod = registry.get(msg.module);
        if (!mod) {
          sendError(`Module "${msg.module}" not found`);
          return;
        }

        const result = await mod.execute(msg.action, msg.payload);
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
        let lastModule: string | undefined;
        try {
          lastModule = await figma.clientStorage.getAsync(
            "db-release.lastModule",
          );
        } catch {
          /* ok */
        }
        figma.ui.postMessage({
          type: "storage",
          data: { lastModule },
        } as PluginToUIMessage);
        break;
      }

      case "setStorage": {
        const p = msg.payload as { lastModule?: string } | undefined;
        if (p?.lastModule) {
          try {
            await figma.clientStorage.setAsync(
              "db-release.lastModule",
              p.lastModule,
            );
          } catch {
            /* ok */
          }
        }
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

// --- Detect changed: uses traversal (not getNodeById) for dynamic-page compat ---

function isPublishable(node: { key: string; name: string }): boolean {
  return (
    !!node.key &&
    !node.name.startsWith(".") &&
    !node.name.startsWith("↳") &&
    !node.name.startsWith("🛟")
  );
}

async function detectChangedComponents(): Promise<void> {
  await figma.loadAllPagesAsync();
  const changedIds: string[] = [];

  for (const page of figma.root.children) {
    const sets = page.findAllWithCriteria({ types: ["COMPONENT_SET"] });
    const comps = page.findAllWithCriteria({ types: ["COMPONENT"] });
    const nodes = [
      ...sets.filter((n) => isPublishable(n)),
      ...comps.filter(
        (n) => isPublishable(n) && n.parent?.type !== "COMPONENT_SET",
      ),
    ];

    for (const node of nodes) {
      figma.ui.postMessage({
        type: "publishStatus",
        data: { id: node.id, publishStatus: "SCANNING" },
      });
      try {
        const status = await node.getPublishStatusAsync();
        figma.ui.postMessage({
          type: "publishStatus",
          data: { id: node.id, publishStatus: status },
        });
        if (status === "CHANGED") changedIds.push(node.id);
      } catch {
        figma.ui.postMessage({
          type: "publishStatus",
          data: { id: node.id, publishStatus: "UNKNOWN" },
        });
      }
    }
  }

  sendResult("stamping", { success: true, data: { changedIds } });
}

// --- Selection change ---

function sendSelectionVersion(): void {
  let version: string | null = null;
  for (const node of figma.currentPage.selection) {
    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
      const v = node.getSharedPluginData(PLUGIN_NAMESPACE, VERSION_KEY);
      if (v) {
        version = v;
        break;
      }
    }
  }
  figma.ui.postMessage({
    type: "selectionVersion",
    data: { version },
  } as PluginToUIMessage);
}

figma.on("selectionchange", sendSelectionVersion);
