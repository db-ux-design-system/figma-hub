import type { PersistedMigrationState } from "./types";
import type { MigrationRegistry } from "./registry";

/**
 * PersistenceManager saves and loads the migration state
 * per document via figma.root.setPluginData / getPluginData.
 */
export class PersistenceManager {
  private static STORAGE_KEY = "db-figma-migrate-state";

  /**
   * Saves the entire PersistedMigrationState.
   */
  save(state: PersistedMigrationState): void {
    figma.root.setPluginData(
      PersistenceManager.STORAGE_KEY,
      JSON.stringify(state),
    );
  }

  /**
   * Loads the persisted state.
   * Returns null if the state is missing or invalid.
   */
  load(): PersistedMigrationState | null {
    try {
      const raw = figma.root.getPluginData(PersistenceManager.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedMigrationState;
    } catch {
      return null;
    }
  }

  /**
   * Marks a node as completed for a specific migration.
   */
  markCompleted(migrationId: string, nodeId: string): void {
    const state = this.load() ?? {
      version: 1,
      completedMigrations: {},
    };

    if (!state.completedMigrations[migrationId]) {
      state.completedMigrations[migrationId] = {
        migrationId,
        completedNodeIds: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const entry = state.completedMigrations[migrationId];
    if (!entry.completedNodeIds.includes(nodeId)) {
      entry.completedNodeIds.push(nodeId);
    }
    entry.lastUpdated = new Date().toISOString();

    this.save(state);
  }

  /**
   * Returns the completed node IDs for a migration.
   */
  getCompletedNodes(migrationId: string): string[] {
    const state = this.load();
    if (!state) return [];
    return state.completedMigrations[migrationId]?.completedNodeIds ?? [];
  }

  /**
   * Checks whether all dependencies of a migration are completed.
   * Returns whether the migration can be started and which dependencies are missing.
   */
  canStart(
    migrationId: string,
    registry: MigrationRegistry,
  ): { canStart: boolean; missingDependencies: string[] } {
    const definition = registry.getMigrationById(migrationId);
    if (!definition || !definition.dependencies?.length) {
      return { canStart: true, missingDependencies: [] };
    }

    const state = this.load();
    const missingDependencies: string[] = [];

    for (const depId of definition.dependencies) {
      const entry = state?.completedMigrations[depId];
      if (!entry || entry.completedNodeIds.length === 0) {
        missingDependencies.push(depId);
      }
    }

    return {
      canStart: missingDependencies.length === 0,
      missingDependencies,
    };
  }
}
