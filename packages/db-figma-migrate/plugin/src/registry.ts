import type { MigrationDefinition } from "./types";

/**
 * Vergleicht zwei Semver-Strings (major.minor.patch).
 * Gibt negativ zurück wenn a < b, positiv wenn a > b, 0 wenn gleich.
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * MigrationRegistry verwaltet alle registrierten Migrationen.
 * Sie wird beim Plugin-Start einmalig befüllt und ist danach read-only.
 */
export class MigrationRegistry {
  private definitions: Map<string, MigrationDefinition<unknown>> = new Map();

  /**
   * Registriert eine MigrationDefinition.
   * Wirft einen Fehler, wenn eine Definition mit derselben ID bereits existiert.
   */
  register(definition: MigrationDefinition<unknown>): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(
        `Migration with id '${definition.id}' is already registered.`,
      );
    }
    this.definitions.set(definition.id, definition);
  }

  /**
   * Gibt alle Definitionen einer Release-Version zurück,
   * sortiert nach Priorität aufsteigend (Standard: 100).
   */
  getMigrationsByRelease(release: string): MigrationDefinition<unknown>[] {
    const result: MigrationDefinition<unknown>[] = [];
    for (const def of this.definitions.values()) {
      if (def.releaseVersion === release) {
        result.push(def);
      }
    }
    return result.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }

  /**
   * Gibt alle Releases mit mindestens einer Definition zurück,
   * absteigend nach Semver sortiert (neueste zuerst).
   */
  getAvailableReleases(): string[] {
    const releases = new Set<string>();
    for (const def of this.definitions.values()) {
      releases.add(def.releaseVersion);
    }
    return [...releases].sort((a, b) => compareSemver(b, a));
  }

  /**
   * Gibt eine einzelne Definition anhand ihrer ID zurück, oder undefined.
   */
  getMigrationById(id: string): MigrationDefinition<unknown> | undefined {
    return this.definitions.get(id);
  }

  /**
   * Prüft auf zirkuläre Abhängigkeiten mittels Tiefensuche.
   * Wirft einen Fehler, wenn ein Zyklus erkannt wird.
   */
  validateDependencies(): void {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (id: string, path: string[]): void => {
      if (inStack.has(id)) {
        const cycleStart = path.indexOf(id);
        const cycle = [...path.slice(cycleStart), id];
        throw new Error(`Circular dependency detected: ${cycle.join(" -> ")}`);
      }

      if (visited.has(id)) return;

      inStack.add(id);
      path.push(id);

      const def = this.definitions.get(id);
      if (def?.dependencies) {
        for (const depId of def.dependencies) {
          dfs(depId, [...path]);
        }
      }

      inStack.delete(id);
      visited.add(id);
    };

    for (const id of this.definitions.keys()) {
      dfs(id, []);
    }
  }
}
