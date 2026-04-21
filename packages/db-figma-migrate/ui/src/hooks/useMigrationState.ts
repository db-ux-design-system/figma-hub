import { useCallback, useEffect, useReducer } from "react";
import type {
  MigrationMetadata,
  MigrationScope,
  MigrationUIState,
  PersistedMigrationState,
  PluginMessageToUI,
  UIMessageToPlugin,
} from "../types";

// ─── State ──────────────────────────────────────────────────

export interface AppState {
  releases: string[];
  migrations: Map<string, MigrationUIState>;
  selectedRelease: string | null;
  selectedScope: MigrationScope;
  persistedState: PersistedMigrationState | null;
  branchStatus: boolean | null;
  activeMigrationId: string | null;
  error: string | null;
}

const initialState: AppState = {
  releases: [],
  migrations: new Map(),
  selectedRelease: null,
  selectedScope: "frame",
  persistedState: null,
  branchStatus: null,
  activeMigrationId: null,
  error: null,
};

// ─── Actions ────────────────────────────────────────────────

type Action =
  | { type: "PLUGIN_MESSAGE"; message: PluginMessageToUI }
  | { type: "SELECT_RELEASE"; release: string }
  | { type: "SET_SCOPE"; scope: MigrationScope }
  | { type: "SET_ACTIVE_MIGRATION"; migrationId: string | null };

// ─── Helpers ────────────────────────────────────────────────

function updateMigration(
  map: Map<string, MigrationUIState>,
  id: string,
  updater: (s: MigrationUIState) => MigrationUIState,
): Map<string, MigrationUIState> {
  const existing = map.get(id);
  if (!existing) return map;
  const next = new Map(map);
  next.set(id, updater(existing));
  return next;
}

function buildMigrationState(meta: MigrationMetadata): MigrationUIState {
  return {
    migrationId: meta.id,
    status: "idle",
    nodes: [],
    versionWarnings: [],
    metadata: meta,
  };
}

// ─── Reducer ────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SELECT_RELEASE":
      return {
        ...state,
        selectedRelease: action.release,
        activeMigrationId: null,
      };

    case "SET_SCOPE":
      return { ...state, selectedScope: action.scope };

    case "SET_ACTIVE_MIGRATION":
      return { ...state, activeMigrationId: action.migrationId };

    case "PLUGIN_MESSAGE":
      return handlePluginMessage(state, action.message);
  }
}

function handlePluginMessage(
  state: AppState,
  msg: PluginMessageToUI,
): AppState {
  switch (msg.type) {
    case "init_data": {
      const migrations = new Map<string, MigrationUIState>();
      for (const meta of msg.data.migrations) {
        migrations.set(meta.id, buildMigrationState(meta));
      }
      return {
        ...state,
        releases: msg.data.releases,
        migrations,
        persistedState: msg.data.persistedState,
        branchStatus: msg.data.isBranch,
        selectedRelease: msg.data.releases[0] ?? null,
      };
    }

    case "branch_status":
      return { ...state, branchStatus: msg.data.isBranch };

    case "analysis_progress":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          status: "analyzing",
          progress: { completed: msg.data.nodesScanned, total: 0 },
        })),
      };

    case "analysis_complete":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          status: "ready",
          nodes: msg.data.nodes,
          versionWarnings: msg.data.versionWarnings,
          progress: undefined,
        })),
      };

    case "migration_progress":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          status: "migrating",
          progress: { completed: msg.data.completed, total: msg.data.total },
        })),
      };

    case "migration_node_complete":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          nodes: s.nodes.filter((n) => n.id !== msg.data.nodeId),
        })),
      };

    case "migration_node_error":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          error: `Node ${msg.data.nodeId}: ${msg.data.error}`,
        })),
      };

    case "migration_complete":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          status: "completed",
          report: msg.data.report,
          progress: undefined,
        })),
      };

    case "decision_required":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          currentStep: msg.data.step,
          decisionOptions: msg.data.options,
          decisionNodeId: msg.data.nodeId,
        })),
      };

    case "preview_result":
      return {
        ...state,
        migrations: updateMigration(state.migrations, msg.migrationId, (s) => ({
          ...s,
          status: "ready",
          previewChanges: msg.data.changes,
        })),
      };

    case "error":
      if (msg.data.migrationId) {
        return {
          ...state,
          migrations: updateMigration(
            state.migrations,
            msg.data.migrationId,
            (s) => ({
              ...s,
              status: s.status === "analyzing" ? "idle" : s.status,
              error: msg.data.message,
            }),
          ),
        };
      }
      return { ...state, error: msg.data.message };
  }
}

// ─── Hook ───────────────────────────────────────────────────

export function useMigrationState(
  lastMessage: PluginMessageToUI | null,
  sendToPlugin: (msg: UIMessageToPlugin) => void,
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // React to incoming plugin messages
  useEffect(() => {
    if (lastMessage) {
      dispatch({ type: "PLUGIN_MESSAGE", message: lastMessage });
    }
  }, [lastMessage]);

  const selectRelease = useCallback(
    (release: string) => dispatch({ type: "SELECT_RELEASE", release }),
    [],
  );

  const setScope = useCallback(
    (scope: MigrationScope) => dispatch({ type: "SET_SCOPE", scope }),
    [],
  );

  const setActiveMigration = useCallback(
    (migrationId: string | null) =>
      dispatch({ type: "SET_ACTIVE_MIGRATION", migrationId }),
    [],
  );

  const startAnalysis = useCallback(
    (migrationId: string) => {
      sendToPlugin({
        type: "analyze",
        migrationId,
        scope: state.selectedScope,
      });
    },
    [sendToPlugin, state.selectedScope],
  );

  const startMigration = useCallback(
    (migrationId: string, nodeId: string) => {
      sendToPlugin({ type: "migrate_single", migrationId, nodeId });
    },
    [sendToPlugin],
  );

  const startBatch = useCallback(
    (migrationId: string, nodeIds: string[]) => {
      sendToPlugin({ type: "migrate_batch", migrationId, nodeIds });
    },
    [sendToPlugin],
  );

  const startPreview = useCallback(
    (migrationId: string) => {
      sendToPlugin({ type: "preview", migrationId });
    },
    [sendToPlugin],
  );

  const sendDecision = useCallback(
    (migrationId: string, nodeId: string, decision: unknown) => {
      sendToPlugin({
        type: "decision_response",
        migrationId,
        nodeId,
        decision,
      });
    },
    [sendToPlugin],
  );

  const exportReport = useCallback(
    (migrationId: string) => {
      sendToPlugin({ type: "export_report", migrationId });
    },
    [sendToPlugin],
  );

  return {
    ...state,
    selectRelease,
    setScope,
    setActiveMigration,
    startAnalysis,
    startMigration,
    startBatch,
    startPreview,
    sendDecision,
    exportReport,
  };
}
