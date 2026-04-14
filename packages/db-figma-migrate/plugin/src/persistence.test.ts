import { describe, it, expect, beforeEach, vi } from "vitest";
import { PersistenceManager } from "./persistence";
import { MigrationRegistry } from "./registry";
import type { MigrationDefinition, PersistedMigrationState } from "./types";

/** Mock figma.root.setPluginData / getPluginData */
let pluginDataStore: Record<string, string> = {};

const mockFigma = {
  root: {
    setPluginData: vi.fn((key: string, value: string) => {
      pluginDataStore[key] = value;
    }),
    getPluginData: vi.fn((key: string) => pluginDataStore[key] ?? ""),
  },
};

// Assign to global
(globalThis as unknown as { figma: typeof mockFigma }).figma = mockFigma;

function makeDef(
  overrides: Partial<MigrationDefinition<unknown>> & { id: string },
): MigrationDefinition<unknown> {
  return {
    releaseVersion: "5.0.0",
    title: `Migration ${overrides.id}`,
    description: "test",
    executionMode: "automatic",
    analyze: async () => [],
    migrate: async () => ({
      nodeId: "1",
      status: "success",
      description: "ok",
    }),
    ...overrides,
  };
}

describe("PersistenceManager", () => {
  let pm: PersistenceManager;

  beforeEach(() => {
    pluginDataStore = {};
    vi.clearAllMocks();
    pm = new PersistenceManager();
  });

  describe("save / load", () => {
    it("saves and loads a PersistedMigrationState", () => {
      const state: PersistedMigrationState = {
        version: 1,
        completedMigrations: {
          "mig-a": {
            migrationId: "mig-a",
            completedNodeIds: ["n1", "n2"],
            lastUpdated: "2024-01-01T00:00:00.000Z",
          },
        },
      };
      pm.save(state);
      expect(pm.load()).toEqual(state);
    });

    it("returns null when no data is stored", () => {
      expect(pm.load()).toBeNull();
    });

    it("returns null when stored data is invalid JSON", () => {
      pluginDataStore["db-figma-migrate-state"] = "not-json{";
      expect(pm.load()).toBeNull();
    });
  });

  describe("markCompleted", () => {
    it("creates a new entry when migration has no prior completions", () => {
      pm.markCompleted("mig-a", "node-1");
      const state = pm.load();
      expect(state).not.toBeNull();
      expect(state!.completedMigrations["mig-a"].completedNodeIds).toContain(
        "node-1",
      );
    });

    it("appends to existing completed nodes", () => {
      pm.markCompleted("mig-a", "node-1");
      pm.markCompleted("mig-a", "node-2");
      const nodes = pm.getCompletedNodes("mig-a");
      expect(nodes).toEqual(["node-1", "node-2"]);
    });

    it("does not duplicate node IDs", () => {
      pm.markCompleted("mig-a", "node-1");
      pm.markCompleted("mig-a", "node-1");
      expect(pm.getCompletedNodes("mig-a")).toEqual(["node-1"]);
    });
  });

  describe("getCompletedNodes", () => {
    it("returns empty array for unknown migration", () => {
      expect(pm.getCompletedNodes("unknown")).toEqual([]);
    });

    it("returns empty array when no state is persisted", () => {
      expect(pm.getCompletedNodes("mig-a")).toEqual([]);
    });
  });

  describe("canStart", () => {
    it("returns canStart: true when migration has no dependencies", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "mig-a" }));
      const result = pm.canStart("mig-a", registry);
      expect(result).toEqual({ canStart: true, missingDependencies: [] });
    });

    it("returns canStart: true when migration is not found in registry", () => {
      const registry = new MigrationRegistry();
      const result = pm.canStart("unknown", registry);
      expect(result).toEqual({ canStart: true, missingDependencies: [] });
    });

    it("returns canStart: false with missing dependencies", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "dep-a" }));
      registry.register(makeDef({ id: "dep-b" }));
      registry.register(
        makeDef({ id: "mig-a", dependencies: ["dep-a", "dep-b"] }),
      );

      const result = pm.canStart("mig-a", registry);
      expect(result.canStart).toBe(false);
      expect(result.missingDependencies).toEqual(["dep-a", "dep-b"]);
    });

    it("returns canStart: true when all dependencies are completed", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "dep-a" }));
      registry.register(makeDef({ id: "mig-a", dependencies: ["dep-a"] }));

      pm.markCompleted("dep-a", "node-1");

      const result = pm.canStart("mig-a", registry);
      expect(result).toEqual({ canStart: true, missingDependencies: [] });
    });

    it("returns partial missing dependencies", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "dep-a" }));
      registry.register(makeDef({ id: "dep-b" }));
      registry.register(
        makeDef({ id: "mig-a", dependencies: ["dep-a", "dep-b"] }),
      );

      pm.markCompleted("dep-a", "node-1");

      const result = pm.canStart("mig-a", registry);
      expect(result.canStart).toBe(false);
      expect(result.missingDependencies).toEqual(["dep-b"]);
    });
  });
});
