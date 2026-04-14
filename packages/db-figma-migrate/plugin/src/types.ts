/**
 * DB Figma Migrate – Kern-Interfaces und Typen
 *
 * Dieses Modul definiert alle TypeScript-Interfaces für das
 * modulare Migrations-Framework.
 */

// ─── Enums & Grundtypen ─────────────────────────────────────

/** Ausführungsmodus einer Migration. */
export type ExecutionMode = "automatic" | "semi-automatic";

/** Geltungsbereich einer Migration. */
export type MigrationScope = "frame" | "page" | "document";

// ─── Migration Definition ───────────────────────────────────

/**
 * Zentrale Migrationsdefinition.
 * Der generische Typ-Parameter T erlaubt migrationsspezifische
 * Konfigurationsdaten (z.B. Inhalts-Cache, Komponenten-Mappings).
 */
export interface MigrationDefinition<T = void> {
  /** Eindeutiger Bezeichner (z.B. 'modes-density-device-split') */
  id: string;
  /** Semantische Release-Version (z.B. '5.0.0') */
  releaseVersion: string;
  /** Anzeige-Titel */
  title: string;
  /** Beschreibung der Migration */
  description: string;
  /** Automatisch oder halb-automatisch */
  executionMode: ExecutionMode;
  /** Analyse-Funktion: Findet betroffene Nodes im Scope */
  analyze: (context: AnalysisContext) => Promise<MigrationNode[]>;
  /** Migrations-Funktion: Transformiert einen einzelnen Node */
  migrate: (
    node: MigrationNode,
    context: MigrationContext<T>,
  ) => Promise<MigrationNodeResult>;
  /** Optionale Schritte für halb-automatische Migrationen */
  steps?: MigrationStep[];
  /** Optionale Abhängigkeiten (Bezeichner anderer Migrationen desselben Releases) */
  dependencies?: string[];
  /** Optionale Priorität (niedrigere Werte = höhere Priorität, Standard: 100) */
  priority?: number;
  /** Unterstützte Quellversionen der Komponenten */
  supportedSourceVersions?: string[];
  /** Optionale migrationsspezifische Konfiguration */
  config?: T;
}

// ─── Analyse & Migration Kontext ────────────────────────────

/** Kontext für die Analyse-Funktion. */
export interface AnalysisContext {
  /** Der gewählte Scope */
  scope: MigrationScope;
  /** Die zu analysierenden Root-Nodes (abhängig vom Scope) */
  rootNodes: ReadonlyArray<SceneNode>;
  /** Callback für Fortschrittsmeldungen */
  reportProgress: (nodesScanned: number) => void;
}

/** Kontext für die Migrations-Funktion. */
export interface MigrationContext<T = void> {
  /** Dry-Run-Modus: true = keine Änderungen am Dokument */
  dryRun: boolean;
  /** Migrationsspezifische Konfiguration */
  config?: T;
  /** Callback für Entscheidungspunkte (halb-automatisch) */
  requestDecision?: (step: MigrationStep) => Promise<unknown>;
}

// ─── Migration Node & Ergebnis ──────────────────────────────

/** Ein von einer Migration betroffener Figma-Node. */
export interface MigrationNode {
  /** Figma-Node-ID */
  id: string;
  /** Node-Name */
  name: string;
  /** Node-Typ (FRAME, INSTANCE, TEXT, etc.) */
  type: string;
  /** Migrationsspezifische Details zur Anzeige in der UI */
  details: Record<string, string>;
}

/** Ergebnis der Migration eines einzelnen Nodes. */
export interface MigrationNodeResult {
  nodeId: string;
  status: "success" | "error" | "skipped";
  /** Beschreibung der durchgeführten Änderung (für Report und Dry-Run) */
  description: string;
  /** Fehlermeldung bei status === 'error' */
  error?: string;
}

// ─── Halb-automatische Migration ────────────────────────────

/** Ein Schritt innerhalb einer halb-automatischen Migration. */
export interface MigrationStep {
  /** Eindeutiger Schritt-Bezeichner */
  id: string;
  /** Anzeige-Titel des Schritts */
  title: string;
  /** Beschreibung / Anweisung */
  description: string;
  /** Art des Schritts */
  type: "action" | "decision";
  /** Verfügbare Optionen bei type === 'decision' */
  options?: DecisionOption[];
}

/** Eine Auswahloption an einem Entscheidungspunkt. */
export interface DecisionOption {
  /** Eindeutiger Wert der Option */
  value: string;
  /** Anzeige-Label */
  label: string;
  /** Optionale Beschreibung */
  description?: string;
}

// ─── Versionscheck ──────────────────────────────────────────

/** Ergebnis der Komponentenversions-Prüfung. */
export interface VersionCheckResult {
  nodeId: string;
  nodeName: string;
  currentVersion: string | null;
  supportedVersions: string[];
  compatible: boolean;
  majorVersionGap: number;
}

// ─── Report ─────────────────────────────────────────────────

/** Migrations-Report nach Abschluss. */
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

/** Persistierter Migrationsstatus pro Dokument. */
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

// ─── Nachrichten-Protokoll ──────────────────────────────────

/** Nachrichten von UI an Plugin. */
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

/** Nachrichten von Plugin an UI. */
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

// ─── UI-Zustand ─────────────────────────────────────────────

/** UI-Zustand pro Migration. */
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
