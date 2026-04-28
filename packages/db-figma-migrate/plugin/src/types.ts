/**
 * DB Figma Migrate – Core Interfaces and Types
 *
 * This module defines all TypeScript interfaces for the
 * modular migration framework.
 */

// ─── Enums & Basic Types ────────────────────────────────────

/** Execution mode of a migration. */
export type ExecutionMode = "automatic" | "semi-automatic";

/** Scope of a migration. */
export type MigrationScope = "frame" | "page" | "document";

// ─── Migration Definition ───────────────────────────────────

/**
 * Central migration definition.
 * The generic type parameter T allows migration-specific
 * configuration data (e.g. content cache, component mappings).
 */
export interface MigrationDefinition<T = void> {
  /** Unique identifier (e.g. 'modes-density-device-split') */
  id: string;
  /** Semantic release version (e.g. '5.0.0') */
  releaseVersion: string;
  /** Display title */
  title: string;
  /** Description of the migration */
  description: string;
  /** Automatic or semi-automatic */
  executionMode: ExecutionMode;
  /** Analysis function: Finds affected nodes within the scope */
  analyze: (context: AnalysisContext) => Promise<MigrationNode[]>;
  /** Migration function: Transforms a single node */
  migrate: (
    node: MigrationNode,
    context: MigrationContext<T>,
  ) => Promise<MigrationNodeResult>;
  /** Optional steps for semi-automatic migrations */
  steps?: MigrationStep[];
  /** Optional dependencies (identifiers of other migrations in the same release) */
  dependencies?: string[];
  /** Optional priority (lower values = higher priority, default: 100) */
  priority?: number;
  /** Supported source versions of the components */
  supportedSourceVersions?: string[];
  /** Optional migration-specific configuration */
  config?: T;
}

// ─── Analysis & Migration Context ───────────────────────────

/** Context for the analysis function. */
export interface AnalysisContext {
  /** The selected scope */
  scope: MigrationScope;
  /** The root nodes to analyze (depends on the scope) */
  rootNodes: ReadonlyArray<SceneNode>;
  /** Callback for progress reporting */
  reportProgress: (nodesScanned: number) => void;
}

/** Context for the migration function. */
export interface MigrationContext<T = void> {
  /** Dry-run mode: true = no changes to the document */
  dryRun: boolean;
  /** Migration-specific configuration */
  config?: T;
  /** Callback for decision points (semi-automatic) */
  requestDecision?: (step: MigrationStep) => Promise<unknown>;
}

// ─── Migration Node & Result ────────────────────────────────

/** A Figma node affected by a migration. */
export interface MigrationNode {
  /** Figma node ID */
  id: string;
  /** Node name */
  name: string;
  /** Node type (FRAME, INSTANCE, TEXT, etc.) */
  type: string;
  /** Migration-specific details for display in the UI */
  details: Record<string, string>;
}

/** Result of migrating a single node. */
export interface MigrationNodeResult {
  nodeId: string;
  status: "success" | "error" | "skipped";
  /** Description of the change performed (for report and dry-run) */
  description: string;
  /** Error message when status === 'error' */
  error?: string;
}

// ─── Semi-Automatic Migration ───────────────────────────────

/** A step within a semi-automatic migration. */
export interface MigrationStep {
  /** Unique step identifier */
  id: string;
  /** Display title of the step */
  title: string;
  /** Description / instruction */
  description: string;
  /** Type of the step */
  type: "action" | "decision";
  /** Available options when type === 'decision' */
  options?: DecisionOption[];
}

/** A selection option at a decision point. */
export interface DecisionOption {
  /** Unique value of the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
}

// ─── Version Check ──────────────────────────────────────────

/** Result of the component version check. */
export interface VersionCheckResult {
  nodeId: string;
  nodeName: string;
  currentVersion: string | null;
  supportedVersions: string[];
  compatible: boolean;
  majorVersionGap: number;
}

// ─── Report ─────────────────────────────────────────────────

/** Migration report after completion. */
export interface MigrationReport {
  migrationId: string;
  migrationTitle: string;
  releaseVersion: string;
  timestamp: string;
  scope: MigrationScope;
  results: MigrationNodeResult[];
  summary: {
    total: number;
    success: number;
    error: number;
    skipped: number;
  };
}

// ─── Persistence ────────────────────────────────────────────

/** Persisted migration state per document. */
export interface PersistedMigrationState {
  version: number;
  completedMigrations: Record<string, CompletedMigrationEntry>;
}

export interface CompletedMigrationEntry {
  migrationId: string;
  completedNodeIds: string[];
  lastUpdated: string;
  report?: MigrationReport;
}

// ─── Message Protocol ───────────────────────────────────────

/** Messages from UI to Plugin. */
export type UIMessageToPlugin =
  | { type: "init" }
  | { type: "analyze"; migrationId: string; scope: MigrationScope }
  | { type: "migrate_single"; migrationId: string; nodeId: string }
  | { type: "migrate_batch"; migrationId: string; nodeIds: string[] }
  | { type: "preview"; migrationId: string }
  | {
      type: "decision_response";
      migrationId: string;
      nodeId: string;
      decision: unknown;
    }
  | { type: "export_report"; migrationId: string }
  | { type: "navigate_to_node"; nodeId: string };

/** Messages from Plugin to UI. */
export type PluginMessageToUI =
  | {
      type: "init_data";
      data: {
        releases: string[];
        migrations: Array<{
          id: string;
          releaseVersion: string;
          title: string;
          description: string;
          executionMode: ExecutionMode;
          priority?: number;
          dependencies?: string[];
          supportedSourceVersions?: string[];
        }>;
        persistedState: PersistedMigrationState | null;
        isBranch: boolean | null;
      };
    }
  | {
      type: "analysis_progress";
      migrationId: string;
      data: { nodesScanned: number };
    }
  | {
      type: "analysis_complete";
      migrationId: string;
      data: { nodes: MigrationNode[]; versionWarnings: VersionCheckResult[] };
    }
  | {
      type: "migration_progress";
      migrationId: string;
      data: { completed: number; total: number };
    }
  | {
      type: "migration_node_complete";
      migrationId: string;
      data: { nodeId: string };
    }
  | {
      type: "migration_node_error";
      migrationId: string;
      data: { nodeId: string; error: string };
    }
  | {
      type: "migration_complete";
      migrationId: string;
      data: { report: MigrationReport };
    }
  | {
      type: "decision_required";
      migrationId: string;
      data: { nodeId: string; step: MigrationStep; options: DecisionOption[] };
    }
  | {
      type: "preview_result";
      migrationId: string;
      data: { changes: MigrationNodeResult[] };
    }
  | { type: "error"; data: { migrationId?: string; message: string } }
  | { type: "branch_status"; data: { isBranch: boolean | null } };

// ─── UI State ───────────────────────────────────────────────

/** UI state per migration. */
export interface MigrationUIState {
  migrationId: string;
  status:
    | "idle"
    | "analyzing"
    | "ready"
    | "migrating"
    | "previewing"
    | "completed";
  nodes: MigrationNode[];
  versionWarnings: VersionCheckResult[];
  report?: MigrationReport;
  currentStep?: MigrationStep;
  progress?: { completed: number; total: number };
  error?: string;
}
