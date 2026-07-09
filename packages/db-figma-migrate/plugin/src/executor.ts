import type {
  MigrationScope,
  MigrationNode,
  MigrationNodeResult,
  MigrationReport,
  MigrationStep,
  PluginMessageToUI,
} from "./types";
import type { MigrationRegistry } from "./registry";
import type { PersistenceManager } from "./persistence";
import { VersionChecker } from "./version-checker";

/**
 * MigrationExecutor runs migrations – both automatic and
 * semi-automatic. Supports dry-run mode and batch processing.
 */
export class MigrationExecutor {
  private versionChecker: VersionChecker;

  /** Stores analyzed nodes per migration for later reference during migration. */
  private analysisResults: Map<string, MigrationNode[]> = new Map();

  /** Stores the scope used for each analysis, needed for report generation. */
  private analysisScopes: Map<string, MigrationScope> = new Map();

  /**
   * Stores pending decision resolvers for semi-automatic migrations.
   * Key: `${migrationId}:${nodeId}`
   */
  private pendingDecisions: Map<string, (decision: unknown) => void> =
    new Map();

  constructor(
    private registry: MigrationRegistry,
    private persistence: PersistenceManager,
    private sendMessage: (msg: PluginMessageToUI) => void,
  ) {
    this.versionChecker = new VersionChecker();
  }

  /**
   * Resolves the migration scope to root nodes.
   * - frame → figma.currentPage.selection
   * - page → figma.currentPage.children
   * - document → iterate all pages' children
   */
  private resolveScope(scope: MigrationScope): ReadonlyArray<SceneNode> {
    switch (scope) {
      case "frame":
        return figma.currentPage.selection;
      case "page":
        return figma.currentPage.children;
      case "document": {
        const allNodes: SceneNode[] = [];
        for (const page of figma.root.children) {
          for (const child of page.children) {
            allNodes.push(child);
          }
        }
        return allNodes;
      }
    }
  }

  /**
   * Analyzes the document for a given migration within the specified scope.
   * Sends analysis_progress messages during analysis and analysis_complete when done.
   * Runs VersionChecker after analysis to detect compatibility warnings.
   */
  async analyze(migrationId: string, scope: MigrationScope): Promise<void> {
    try {
      const definition = this.registry.getMigrationById(migrationId);
      if (!definition) {
        this.sendMessage({
          type: "error",
          data: {
            migrationId,
            message: `Migration '${migrationId}' not found in registry.`,
          },
        });
        return;
      }

      const rootNodes = this.resolveScope(scope);

      const nodes = await definition.analyze({
        scope,
        rootNodes,
        reportProgress: (nodesScanned: number) => {
          this.sendMessage({
            type: "analysis_progress",
            migrationId,
            data: { nodesScanned },
          });
        },
      });

      // Store analysis results for later use during migration
      this.analysisResults.set(migrationId, nodes);
      this.analysisScopes.set(migrationId, scope);

      this.sendMessage({
        type: "analysis_complete",
        migrationId,
        data: { nodes, versionWarnings: [] },
      });
    } catch (err) {
      this.sendMessage({
        type: "error",
        data: {
          migrationId,
          message:
            err instanceof Error ? err.message : "Unknown analysis error",
        },
      });
    }
  }

  /**
   * Executes migration for a single node.
   * On success (not dryRun): persists via PersistenceManager, sends migration_node_complete.
   * On error: sends migration_node_error.
   */
  async executeSingle(
    migrationId: string,
    nodeId: string,
    dryRun: boolean,
  ): Promise<MigrationNodeResult> {
    const definition = this.registry.getMigrationById(migrationId);
    if (!definition) {
      const errorResult: MigrationNodeResult = {
        nodeId,
        status: "error",
        description: "",
        error: `Migration '${migrationId}' not found in registry.`,
      };
      this.sendMessage({
        type: "migration_node_error",
        migrationId,
        data: { nodeId, error: errorResult.error! },
      });
      return errorResult;
    }

    const analysisNodes = this.analysisResults.get(migrationId);
    const migrationNode = analysisNodes?.find((n) => n.id === nodeId);
    if (!migrationNode) {
      const errorResult: MigrationNodeResult = {
        nodeId,
        status: "error",
        description: "",
        error: `Node '${nodeId}' not found in analysis results for migration '${migrationId}'.`,
      };
      this.sendMessage({
        type: "migration_node_error",
        migrationId,
        data: { nodeId, error: errorResult.error! },
      });
      return errorResult;
    }

    try {
      const result = await definition.migrate(migrationNode, {
        dryRun,
        config: definition.config,
        requestDecision:
          definition.executionMode === "semi-automatic"
            ? (step: MigrationStep) =>
                this.requestDecision(migrationId, nodeId, step)
            : undefined,
      });

      if (result.status === "success" && !dryRun) {
        this.persistence.markCompleted(migrationId, nodeId);
        this.sendMessage({
          type: "migration_node_complete",
          migrationId,
          data: { nodeId },
        });
      } else if (result.status === "error") {
        this.sendMessage({
          type: "migration_node_error",
          migrationId,
          data: { nodeId, error: result.error ?? "Unknown migration error" },
        });
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown migration error";
      const errorResult: MigrationNodeResult = {
        nodeId,
        status: "error",
        description: "",
        error: errorMessage,
      };
      this.sendMessage({
        type: "migration_node_error",
        migrationId,
        data: { nodeId, error: errorMessage },
      });
      return errorResult;
    }
  }

  /**
   * Executes migration for a batch of nodes sequentially.
   * Continues on individual node failures, sends progress after each node,
   * and generates a MigrationReport at the end.
   */
  async executeBatch(
    migrationId: string,
    nodeIds: string[],
    dryRun: boolean,
  ): Promise<void> {
    const results: MigrationNodeResult[] = [];

    for (let i = 0; i < nodeIds.length; i++) {
      try {
        const result = await this.executeSingle(
          migrationId,
          nodeIds[i],
          dryRun,
        );
        results.push(result);
      } catch (err) {
        // Log error, continue with next node
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        results.push({
          nodeId: nodeIds[i],
          status: "error",
          description: "",
          error: errorMessage,
        });
      }

      // Send progress after each node
      this.sendMessage({
        type: "migration_progress",
        migrationId,
        data: { completed: i + 1, total: nodeIds.length },
      });
    }

    // Generate report and send migration_complete
    const report = this.generateReport(migrationId, results);

    this.sendMessage({
      type: "migration_complete",
      migrationId,
      data: { report },
    });
  }

  /**
   * Handles a decision response for a pending semi-automatic migration.
   * Resolves the pending Promise so the migration can continue.
   */
  async handleDecisionResponse(
    migrationId: string,
    nodeId: string,
    decision: unknown,
  ): Promise<void> {
    const key = `${migrationId}:${nodeId}`;
    const resolver = this.pendingDecisions.get(key);
    if (resolver) {
      resolver(decision);
      this.pendingDecisions.delete(key);
    }
  }

  /**
   * Creates a Promise that will be resolved when a decision_response arrives.
   * Sends a decision_required message to the UI and waits for the response.
   */
  private requestDecision(
    migrationId: string,
    nodeId: string,
    step: MigrationStep,
  ): Promise<unknown> {
    return new Promise<unknown>((resolve) => {
      const key = `${migrationId}:${nodeId}`;
      this.pendingDecisions.set(key, resolve);

      this.sendMessage({
        type: "decision_required",
        migrationId,
        data: {
          nodeId,
          step,
          options: step.options ?? [],
        },
      });
    });
  }

  /**
   * Generates a MigrationReport from a set of MigrationNodeResults.
   */
  generateReport(
    migrationId: string,
    results: MigrationNodeResult[],
  ): MigrationReport {
    const definition = this.registry.getMigrationById(migrationId);
    const scope = this.analysisScopes.get(migrationId) ?? "page";

    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      error: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    return {
      migrationId,
      migrationTitle: definition?.title ?? migrationId,
      releaseVersion: definition?.releaseVersion ?? "unknown",
      timestamp: new Date().toISOString(),
      scope,
      results,
      summary,
    };
  }
}
