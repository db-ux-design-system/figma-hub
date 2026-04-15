import type {
  PluginModule,
  ModuleResult,
  ModuleError,
  ProgressUpdate,
} from "../../types";
import { writeStampMarker } from "./stamp";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BATCH_SIZE = 50;

export class StampingModule implements PluginModule {
  id = "stamping";
  name = "Stamping";
  description = "Versionsnummern in Komponenten-Beschreibungen schreiben";

  private sendProgress: (data: ProgressUpdate) => void;

  constructor(sendProgress: (data: ProgressUpdate) => void) {
    this.sendProgress = sendProgress;
  }

  async execute(action: string, payload?: unknown): Promise<ModuleResult> {
    switch (action) {
      case "stamp":
        return this.executeStamp(payload);
      case "changelog":
        return this.executeChangelog();
      default:
        return {
          success: false,
          errors: [
            {
              componentName: "",
              componentId: "",
              message: `Unknown action: "${action}"`,
            },
          ],
        };
    }
  }

  private async executeStamp(payload: unknown): Promise<ModuleResult> {
    const { version } = (payload as { version: string }) ?? {};
    if (!version) {
      return {
        success: false,
        errors: [
          {
            componentName: "",
            componentId: "",
            message: "No version provided",
          },
        ],
      };
    }

    const components = this.findAllComponents();

    if (components.length === 0) {
      return {
        success: true,
        data: {
          stamped: 0,
          message:
            "Keine Komponenten im Dokument gefunden. Stelle sicher, dass die Datei veröffentlichbare Komponenten enthält.",
        },
      };
    }

    const errors: ModuleError[] = [];
    let stamped = 0;

    for (let i = 0; i < components.length; i++) {
      const node = components[i];

      try {
        node.description = writeStampMarker(node.description, version);
        stamped++;
      } catch (e) {
        errors.push({
          componentName: node.name,
          componentId: node.id,
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }

      if ((i + 1) % BATCH_SIZE === 0 || i === components.length - 1) {
        this.sendProgress({
          processed: i + 1,
          total: components.length,
          currentComponent: node.name,
        });
        await delay(0);
      }
    }

    return {
      success: errors.length === 0,
      data: { stamped, total: components.length },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async executeChangelog(): Promise<ModuleResult> {
    // Placeholder — will be implemented in Task 10
    return { success: true, data: {} };
  }

  /**
   * Traverses all pages and collects COMPONENT and COMPONENT_SET nodes
   * that have a valid key (publishable components).
   */
  private findAllComponents(): (ComponentNode | ComponentSetNode)[] {
    const results: (ComponentNode | ComponentSetNode)[] = [];

    for (const page of figma.root.children) {
      const nodes = page.findAllWithCriteria({
        types: ["COMPONENT", "COMPONENT_SET"],
      });

      for (const node of nodes) {
        if (node.key) {
          results.push(node);
        }
      }
    }

    return results;
  }
}
