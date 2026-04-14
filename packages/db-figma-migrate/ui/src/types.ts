/**
 * UI-relevant types duplicated from plugin/src/types.ts.
 * The UI is a separate Vite build and cannot import from the plugin directory.
 */

// ─── Enums & Grundtypen ─────────────────────────────────────

export type ExecutionMode = "automatic" | "semi-automatic";
export type MigrationScope = "frame" | "page" | "document";

// ─── Migration Node & Ergebnis ──────────────────────────────

export interface MigrationNode {
  id: string;
  name: string;
  type: string;
  details: Record<string, string>;
}

export interface MigrationNodeResult {
  nodeId: string;
  status: "success" | "error" | "skipped";
  description: string;
  error?: string;
}

// ─── Halb-automatische Migration ────────────────────────────

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  type: "action" | "decision";
  options?: DecisionOption[];
}

export interface DecisionOption {
  value: string;
  label: string;
  description?: string;
}

// ─── Versionscheck ──────────────────────────────────────────

export interface VersionCheckResult {
  nodeId: string;
  nodeName: string;
  currentVersion: string | null;
  supportedVersions: string[];
  compatible: boolean;
  majorVersionGap: number;
}

// ─── Report ─────────────────────────────────────────────────

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

// ─── Persistenz ─────────────────────────────────────────────

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

// ─── Migration Metadata (from init_data) ────────────────────

export interface MigrationMetadata {
  id: string;
  releaseVersion: string;
  title: string;
  description: string;
  executionMode: ExecutionMode;
  priority?: number;
  dependencies?: string[];
  supportedSourceVersions?: string[];
}

// ─── Nachrichten-Protokoll ──────────────────────────────────

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

export type PluginMessageToUI =
  | {
      type: "init_data";
      data: {
        releases: string[];
        migrations: MigrationMetadata[];
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

// ─── UI-Zustand ─────────────────────────────────────────────

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
  previewChanges?: MigrationNodeResult[];
  currentStep?: MigrationStep;
  decisionOptions?: DecisionOption[];
  decisionNodeId?: string;
  progress?: { completed: number; total: number };
  error?: string;
  metadata: MigrationMetadata;
}
