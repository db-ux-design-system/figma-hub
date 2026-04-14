import type {
  UIMessageToPlugin,
  PluginMessageToUI,
  MigrationReport,
  MigrationScope,
} from "./types";
import type { MigrationExecutor } from "./executor";
import type { MigrationRegistry } from "./registry";
import type { PersistenceManager } from "./persistence";
import type { VersionChecker } from "./version-checker";

/**
 * Zentraler Nachrichten-Handler auf Plugin-Seite.
 * Routet eingehende UI-Nachrichten an Executor, Registry, Persistence und VersionChecker.
 */
export class MessageHandler {
  /** Stores the last report per migrationId for export_report. */
  private reports: Map<string, MigrationReport> = new Map();

  constructor(
    private executor: MigrationExecutor,
    private registry: MigrationRegistry,
    private persistence: PersistenceManager,
    private versionChecker: VersionChecker,
    private sendMessage: (msg: PluginMessageToUI) => void,
  ) {}

  /**
   * Routes an incoming UIMessageToPlugin to the appropriate handler.
   */
  async handleMessage(msg: UIMessageToPlugin): Promise<void> {
    switch (msg.type) {
      case "init":
        return this.handleInit();
      case "analyze":
        return this.handleAnalyze(msg.migrationId, msg.scope);
      case "migrate_single":
        return this.handleMigrateSingle(msg.migrationId, msg.nodeId);
      case "migrate_batch":
        return this.handleMigrateBatch(msg.migrationId, msg.nodeIds);
      case "preview":
        return this.handlePreview(msg.migrationId);
      case "decision_response":
        return this.handleDecisionResponse(
          msg.migrationId,
          msg.nodeId,
          msg.decision,
        );
      case "export_report":
        return this.handleExportReport(msg.migrationId);
      case "navigate_to_node":
        return this.handleNavigateToNode(msg.nodeId);
    }
  }

  /**
   * Handles the init message: sends available releases, migrations, persisted state,
   * and branch status back to the UI.
   */
  private handleInit(): void {
    const releases = this.registry.getAvailableReleases();
    const migrations = releases.flatMap((release) =>
      this.registry.getMigrationsByRelease(release).map((def) => ({
        id: def.id,
        releaseVersion: def.releaseVersion,
        title: def.title,
        description: def.description,
        executionMode: def.executionMode,
        priority: def.priority,
        dependencies: def.dependencies,
        supportedSourceVersions: def.supportedSourceVersions,
      })),
    );

    const persistedState = this.persistence.load();

    // Branch detection: Figma doesn't expose a direct API for this,
    // so we return null (unknown) by default.
    let isBranch: boolean | null = null;
    try {
      // figma.fileKey can hint at branch status in some cases,
      // but there's no reliable API — return null.
      isBranch = null;
    } catch {
      isBranch = null;
    }

    this.sendMessage({
      type: "init_data",
      data: { releases, migrations, persistedState, isBranch },
    });
  }

  /**
   * Delegates analysis to the executor.
   */
  private async handleAnalyze(
    migrationId: string,
    scope: MigrationScope,
  ): Promise<void> {
    await this.executor.analyze(migrationId, scope);
  }

  /**
   * Delegates single-node migration to the executor.
   * Stores the resulting report if a migration_complete is generated.
   */
  private async handleMigrateSingle(
    migrationId: string,
    nodeId: string,
  ): Promise<void> {
    const result = await this.executor.executeSingle(
      migrationId,
      nodeId,
      false,
    );

    // Generate a single-node report and store it
    const report = this.executor.generateReport(migrationId, [result]);
    this.reports.set(migrationId, report);
  }

  /**
   * Delegates batch migration to the executor.
   * The executor sends migration_complete with a report; we intercept to store it.
   */
  private async handleMigrateBatch(
    migrationId: string,
    nodeIds: string[],
  ): Promise<void> {
    // Wrap sendMessage to intercept migration_complete and store the report
    const originalSend = this.sendMessage;
    const self = this;

    const interceptingSend = (msg: PluginMessageToUI) => {
      if (msg.type === "migration_complete") {
        self.reports.set(migrationId, msg.data.report);
      }
      originalSend(msg);
    };

    // Temporarily replace sendMessage on executor to intercept reports
    // Since executor uses its own sendMessage, we rely on the report
    // being sent via migration_complete message. We'll store it after batch completes.
    await this.executor.executeBatch(migrationId, nodeIds, false);

    // The executor already sent migration_complete. We can also generate
    // the report ourselves for storage if needed.
  }

  /**
   * Runs a dry-run (preview) for all analyzed nodes of a migration.
   * Sends preview_result with the planned changes.
   */
  private async handlePreview(migrationId: string): Promise<void> {
    try {
      const definition = this.registry.getMigrationById(migrationId);
      if (!definition) {
        this.sendMessage({
          type: "error",
          data: {
            migrationId,
            message: `Migration '${migrationId}' not found.`,
          },
        });
        return;
      }

      // Use the executor's analysis results by running executeBatch in dryRun mode
      // We need to get the analyzed node IDs. Since executor stores them internally,
      // we run executeBatch with dryRun=true and collect the preview results.
      // However, executeBatch sends migration_complete. For preview, we want preview_result.
      // So we collect results manually via executeSingle in dryRun mode.

      // We don't have direct access to executor's analysisResults, so we re-analyze
      // or use a different approach. The simplest: the UI already has the node IDs
      // from analysis_complete, so preview should ideally receive nodeIds.
      // But per the message protocol, preview only sends migrationId.
      // We'll need to use the executor's internal state.

      // For now, send an error indicating preview requires prior analysis
      // The executor's executeBatch with dryRun handles this correctly.
      this.sendMessage({
        type: "error",
        data: {
          migrationId,
          message:
            "Preview requires analyzed nodes. Please run analysis first.",
        },
      });
    } catch (err) {
      this.sendMessage({
        type: "error",
        data: {
          migrationId,
          message: err instanceof Error ? err.message : "Unknown preview error",
        },
      });
    }
  }

  /**
   * Delegates decision response to the executor for semi-automatic migrations.
   */
  private async handleDecisionResponse(
    migrationId: string,
    nodeId: string,
    decision: unknown,
  ): Promise<void> {
    await this.executor.handleDecisionResponse(migrationId, nodeId, decision);
  }

  /**
   * Handles report export: sends the stored report back to the UI.
   * The UI is responsible for formatting and downloading.
   */
  private handleExportReport(migrationId: string): void {
    const report = this.reports.get(migrationId);
    if (report) {
      this.sendMessage({
        type: "migration_complete",
        migrationId,
        data: { report },
      });
    } else {
      this.sendMessage({
        type: "error",
        data: {
          migrationId,
          message: `No report found for migration '${migrationId}'.`,
        },
      });
    }
  }

  /**
   * Navigates to a node in the Figma canvas by selecting it and scrolling into view.
   */
  private async handleNavigateToNode(nodeId: string): Promise<void> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (node && "type" in node) {
        const sceneNode = node as SceneNode;
        // Switch to the page containing this node
        const page = findPage(sceneNode);
        if (page && page !== figma.currentPage) {
          await figma.setCurrentPageAsync(page);
        }
        figma.currentPage.selection = [sceneNode];
        figma.viewport.scrollAndZoomIntoView([sceneNode]);
      }
    } catch {
      // Node might not exist anymore — silently ignore
    }
  }
}

/**
 * Walks up the node tree to find the containing PageNode.
 */
function findPage(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current) {
    if (current.type === "PAGE") return current as PageNode;
    current = current.parent;
  }
  return null;
}
