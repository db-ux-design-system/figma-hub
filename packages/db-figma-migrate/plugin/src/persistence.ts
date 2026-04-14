import type { PersistedMigrationState } from "./types";
import type { MigrationRegistry } from "./registry";

/**
 * PersistenceManager speichert und lädt den Migrationsstatus
 * pro Dokument über figma.root.setPluginData / getPluginData.
 */
export class PersistenceManager {
  private static STORAGE_KEY = "db-figma-migrate-state";

  /**
   * Speichert den gesamten PersistedMigrationState.
   */
  save(state: PersistedMigrationState): void {
    figma.root.setPluginData(
      PersistenceManager.STORAGE_KEY,
      JSON.stringify(state),
    );
  }

  /**
   * Lädt den gespeicherten Status.
   * Gibt null zurück bei fehlendem oder ungültigem Status.
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
   * Markiert einen Node als abgeschlossen für eine bestimmte Migration.
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
   * Gibt die abgeschlossenen Node-IDs für eine Migration zurück.
   */
  getCompletedNodes(migrationId: string): string[] {
    const state = this.load();
    if (!state) return [];
    return state.completedMigrations[migrationId]?.completedNodeIds ?? [];
  }

  /**
   * Prüft, ob alle Abhängigkeiten einer Migration abgeschlossen sind.
   * Gibt zurück, ob die Migration gestartet werden kann und welche Abhängigkeiten fehlen.
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
