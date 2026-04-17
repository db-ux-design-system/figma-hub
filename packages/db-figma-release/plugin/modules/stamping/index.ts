import type {
  PluginModule,
  ModuleResult,
  ModuleError,
  ProgressUpdate,
} from "../../types";
import {
  readUpdatedWith,
  writeUpdatedWith,
  readVersionMap,
  writeVersionMap,
  getComponentGroupName,
  clearNodePluginData,
  clearRootPluginData,
} from "./stamp";
import { updateStatusFrame } from "./update-status";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BATCH_SIZE = 10;

export interface ComponentListEntry {
  id: string;
  name: string;
  version: string | null;
  key: string;
  publishStatus: string;
  pageName: string;
}

export class StampingModule implements PluginModule {
  id = "stamping";
  name = "Stamping";
  description = "Manage update version nummer";

  private sendProgress: (data: ProgressUpdate) => void;

  constructor(sendProgress: (data: ProgressUpdate) => void) {
    this.sendProgress = sendProgress;
  }

  async execute(action: string, payload?: unknown): Promise<ModuleResult> {
    switch (action) {
      case "stamp-all":
        return this.stampComponents(payload, "all");
      case "stamp-selection":
        return this.stampComponents(payload, "selection");
      case "stamp-by-ids":
        return this.stampByIds(payload);
      case "list-components":
        return this.listComponents();
      case "update-status":
        return this.executeUpdateStatus();
      case "clear-all":
        return this.clearAll();
      default:
        return this.err(`Unknown action: "${action}"`);
    }
  }

  private async listComponents(): Promise<ModuleResult> {
    const nodes = await this.findAllComponents();
    const components: ComponentListEntry[] = nodes.map((n) => {
      let parent: BaseNode | null = n;
      while (parent && parent.type !== "PAGE") parent = parent.parent;
      return {
        id: n.id,
        name: n.name,
        version: readUpdatedWith(n),
        key: n.key,
        publishStatus: "UNKNOWN",
        pageName: parent?.name ?? "Unknown",
      };
    });
    return { success: true, data: { components } };
  }

  private async executeUpdateStatus(): Promise<ModuleResult> {
    try {
      const allComponents = await this.findAllComponents();
      await updateStatusFrame(allComponents);
      return {
        success: true,
        data: { message: "Update Status Tabelle aktualisiert." },
      };
    } catch (e) {
      return this.err(
        e instanceof Error
          ? e.message
          : "Fehler beim Aktualisieren der Tabelle",
      );
    }
  }

  private async clearAll(): Promise<ModuleResult> {
    const components = await this.findAllComponents();
    let cleared = 0;
    for (const node of components) {
      try {
        clearNodePluginData(node);
        cleared++;
      } catch {
        /* skip */
      }
    }
    clearRootPluginData();
    return {
      success: true,
      data: {
        cleared,
        message: `Plugin-Daten von ${cleared} Komponenten gelöscht.`,
      },
    };
  }

  private async stampByIds(payload: unknown): Promise<ModuleResult> {
    const { version, ids } =
      (payload as { version: string; ids: string[] }) ?? {};
    if (!version) return this.err("No version provided");
    if (!ids || ids.length === 0) return this.err("No components selected");

    const allComponents = await this.findAllComponents();
    const idSet = new Set(ids);
    const targets = allComponents.filter((n) => idSet.has(n.id));

    const { stamped, errors } = this.writeVersions(targets, version);
    this.updateRootMap(targets, version);

    // Update the "Update status" frame on the Overview page
    try {
      await updateStatusFrame(allComponents);
    } catch (e) {
      console.log("updateStatusFrame error:", e);
    }

    return {
      success: errors.length === 0,
      data: { stamped, total: ids.length },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async stampComponents(
    payload: unknown,
    mode: "all" | "selection",
  ): Promise<ModuleResult> {
    const { version } = (payload as { version: string }) ?? {};
    if (!version) return this.err("No version provided");

    const components =
      mode === "selection"
        ? this.getSelectedComponents()
        : await this.findAllComponents();

    if (components.length === 0) {
      const msg =
        mode === "selection"
          ? "Keine Komponenten ausgewählt. Wähle COMPONENT oder COMPONENT_SET Nodes aus."
          : "Keine Komponenten im Dokument gefunden.";
      return { success: true, data: { stamped: 0, message: msg } };
    }

    const errors: ModuleError[] = [];
    let stamped = 0;

    // Send initial progress so the UI can show it before the loop starts
    this.sendProgress({
      processed: 0,
      total: components.length,
      currentComponent: components[0].name,
    });
    await delay(50);

    for (let i = 0; i < components.length; i++) {
      const node = components[i];
      try {
        writeUpdatedWith(node, version);
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
        await delay(50);
      }
    }

    this.updateRootMap(components, version, mode === "all");

    // Update the "Update status" frame on the Overview page
    try {
      await updateStatusFrame(components);
    } catch (e) {
      console.log("updateStatusFrame error:", e);
    }

    return {
      success: errors.length === 0,
      data: { stamped, total: components.length },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // --- Helpers ---

  private writeVersions(
    nodes: (ComponentNode | ComponentSetNode)[],
    version: string,
  ) {
    const errors: ModuleError[] = [];
    let stamped = 0;
    for (const node of nodes) {
      try {
        writeUpdatedWith(node, version);
        stamped++;
      } catch (e) {
        errors.push({
          componentName: node.name,
          componentId: node.id,
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
    return { stamped, errors };
  }

  private updateRootMap(
    nodes: (ComponentNode | ComponentSetNode)[],
    version: string,
    replace = false,
  ): void {
    try {
      const map = replace ? {} : readVersionMap();
      for (const node of nodes) {
        map[getComponentGroupName(node)] = version;
      }
      writeVersionMap(map);
    } catch {
      /* root-map failed — component stamps still applied */
    }
  }

  private isPublishable(node: ComponentNode | ComponentSetNode): boolean {
    return !!node.key && !node.name.startsWith(".");
  }

  private getSelectedComponents(): (ComponentNode | ComponentSetNode)[] {
    const results: (ComponentNode | ComponentSetNode)[] = [];
    for (const node of figma.currentPage.selection) {
      if (
        (node.type === "COMPONENT" || node.type === "COMPONENT_SET") &&
        this.isPublishable(node)
      ) {
        results.push(node);
      }
    }
    return results;
  }

  private async findAllComponents(): Promise<
    (ComponentNode | ComponentSetNode)[]
  > {
    await figma.loadAllPagesAsync();
    const results: (ComponentNode | ComponentSetNode)[] = [];
    for (const page of figma.root.children) {
      for (const node of page.findAllWithCriteria({
        types: ["COMPONENT_SET"],
      })) {
        if (this.isPublishable(node)) results.push(node);
      }
      for (const node of page.findAllWithCriteria({ types: ["COMPONENT"] })) {
        if (node.parent?.type !== "COMPONENT_SET" && this.isPublishable(node))
          results.push(node);
      }
    }
    return results;
  }

  private err(message: string): ModuleResult {
    return {
      success: false,
      errors: [{ componentName: "", componentId: "", message }],
    };
  }
}
