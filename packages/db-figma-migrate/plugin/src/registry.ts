import type { MigrationDefinition } from "./types";

/**
 * Compares two semver strings (major.minor.patch).
 * Returns negative if a < b, positive if a > b, 0 if equal.
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
 * MigrationRegistry manages all registered migrations.
 * It is populated once at plugin start and is read-only afterwards.
 */
export class MigrationRegistry {
  private definitions: Map<string, MigrationDefinition<unknown>> = new Map();

  /**
   * Registers a MigrationDefinition.
   * Throws an error if a definition with the same ID already exists.
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
   * Returns all definitions for a release version,
   * sorted by priority ascending (default: 100).
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
   * Returns all releases with at least one definition,
   * sorted descending by semver (newest first).
   */
  getAvailableReleases(): string[] {
    const releases = new Set<string>();
    for (const def of this.definitions.values()) {
      releases.add(def.releaseVersion);
    }
    return [...releases].sort((a, b) => compareSemver(b, a));
  }

  /**
   * Returns a single definition by its ID, or undefined.
   */
  getMigrationById(id: string): MigrationDefinition<unknown> | undefined {
    return this.definitions.get(id);
  }

  /**
   * Checks for circular dependencies using depth-first search.
   * Throws an error if a cycle is detected.
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
