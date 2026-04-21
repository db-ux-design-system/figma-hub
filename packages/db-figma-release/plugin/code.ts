import { ModuleRegistry } from "./module-registry";
import { StampingModule } from "./modules/stamping/index";
import { ChangelogModule } from "./modules/changelog/index";
import { PLUGIN_NAMESPACE, UPDATED_WITH_KEY } from "./modules/stamping/stamp";
import { LIBRARIES, findLibraryByFileKey } from "./config";
import type {
  UIToPluginMessage,
  PluginToUIMessage,
  ProgressUpdate,
} from "./types";

figma.showUI(__html__, { width: 600, height: 768 });

// Auto-detect and persist file key on startup
try {
  const existingKey = figma.root.getSharedPluginData(
    PLUGIN_NAMESPACE,
    "file_key",
  );
  if (!existingKey) {
    // Try figma.fileKey first (works with private plugins that have a real ID)
    if (typeof (figma as any).fileKey === "string" && (figma as any).fileKey) {
      figma.root.setSharedPluginData(
        PLUGIN_NAMESPACE,
        "file_key",
        (figma as any).fileKey,
      );
    } else {
      // Fallback: match document name against known libraries
      const docName = figma.root.name;
      const match = LIBRARIES.find((lib) =>
        docName.toLowerCase().includes(lib.name.toLowerCase()),
      );
      if (match) {
        figma.root.setSharedPluginData(
          PLUGIN_NAMESPACE,
          "file_key",
          match.fileKey,
        );
      }
    }
  }
} catch {
  /* ok */
}

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
registry.register(
  new ChangelogModule((data) => sendProgress("changelog", data)),
);

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
        // Detect current file key from sharedPluginData
        const currentFileKey =
          figma.root.getSharedPluginData(PLUGIN_NAMESPACE, "file_key") || null;
        const currentLib = currentFileKey
          ? findLibraryByFileKey(currentFileKey)
          : null;

        // Also check user's custom libraries
        let userCustomLibs: Array<{ name: string; fileKey: string }> = [];
        try {
          const raw = await figma.clientStorage.getAsync(
            "db-release.customLibraries",
          );
          if (raw) userCustomLibs = raw;
        } catch {
          /* ok */
        }
        const isCustomMatch =
          currentFileKey != null &&
          userCustomLibs.some((l) => l.fileKey === currentFileKey);

        const modules = registry.getAll().map(({ id, name, description }) => ({
          id,
          name,
          description,
          // Changelog is enabled if the current file is a known or custom library
          disabled: id === "changelog" && !currentLib && !isCustomMatch,
        }));
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
        let figmaToken: string | undefined;
        try {
          figmaToken = await figma.clientStorage.getAsync(
            "db-release.figmaToken",
          );
        } catch {
          /* ok */
        }

        // File key stored per document
        const fileKey =
          figma.root.getSharedPluginData(PLUGIN_NAMESPACE, "file_key") ||
          undefined;

        // Current library match
        const currentLibrary = fileKey
          ? findLibraryByFileKey(fileKey)
          : undefined;

        // User-specific custom libraries (persisted per user via clientStorage)
        let customLibraries: Array<{ name: string; fileKey: string }> = [];
        try {
          const raw = await figma.clientStorage.getAsync(
            "db-release.customLibraries",
          );
          if (raw) customLibraries = raw;
        } catch {
          /* ok */
        }

        // Check custom libs for current file match
        const customMatch = fileKey
          ? customLibraries.find((l) => l.fileKey === fileKey)
          : undefined;

        figma.ui.postMessage({
          type: "storage",
          data: {
            lastModule,
            figmaToken,
            fileKey,
            currentLibrary: currentLibrary ?? customMatch ?? null,
            libraries: LIBRARIES,
            customLibraries,
          },
        } as PluginToUIMessage);
        break;
      }

      case "setStorage": {
        const p = msg.payload as
          | {
              lastModule?: string;
              figmaToken?: string;
              fileKey?: string;
              customLibraries?: Array<{ name: string; fileKey: string }>;
            }
          | undefined;
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
        if (p?.figmaToken !== undefined) {
          try {
            await figma.clientStorage.setAsync(
              "db-release.figmaToken",
              p.figmaToken,
            );
          } catch {
            /* ok */
          }
        }
        if (p?.fileKey !== undefined) {
          figma.root.setSharedPluginData(
            PLUGIN_NAMESPACE,
            "file_key",
            p.fileKey,
          );
        }
        if (p?.customLibraries !== undefined) {
          try {
            await figma.clientStorage.setAsync(
              "db-release.customLibraries",
              p.customLibraries,
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
  return !!node.key && !node.name.startsWith(".");
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
  let hasComponents = false;
  for (const node of figma.currentPage.selection) {
    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
      hasComponents = true;
      const v = node.getSharedPluginData(PLUGIN_NAMESPACE, UPDATED_WITH_KEY);
      if (v) {
        version = v;
        break;
      }
    }
  }
  figma.ui.postMessage({
    type: "selectionVersion",
    data: { version, hasComponents },
  } as PluginToUIMessage);
}

figma.on("selectionchange", sendSelectionVersion);
