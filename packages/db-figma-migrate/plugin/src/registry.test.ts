import { describe, it, expect } from "vitest";
import { MigrationRegistry } from "./registry";
import type { MigrationDefinition } from "./types";

/** Helper to create a minimal valid MigrationDefinition. */
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

describe("MigrationRegistry", () => {
  describe("register", () => {
    it("stores a definition and retrieves it by id", () => {
      const registry = new MigrationRegistry();
      const def = makeDef({ id: "a" });
      registry.register(def);
      expect(registry.getMigrationById("a")).toBe(def);
    });

    it("throws on duplicate id", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "dup" }));
      expect(() => registry.register(makeDef({ id: "dup" }))).toThrowError(
        /already registered/,
      );
    });

    it("preserves the original definition after a duplicate attempt", () => {
      const registry = new MigrationRegistry();
      const original = makeDef({ id: "dup", title: "Original" });
      registry.register(original);
      try {
        registry.register(makeDef({ id: "dup", title: "Duplicate" }));
      } catch {
        // expected
      }
      expect(registry.getMigrationById("dup")?.title).toBe("Original");
    });
  });

  describe("getMigrationsByRelease", () => {
    it("returns only definitions for the given release", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a", releaseVersion: "5.0.0" }));
      registry.register(makeDef({ id: "b", releaseVersion: "6.0.0" }));
      registry.register(makeDef({ id: "c", releaseVersion: "5.0.0" }));

      const v5 = registry.getMigrationsByRelease("5.0.0");
      expect(v5.map((d) => d.id).sort()).toEqual(["a", "c"]);
    });

    it("returns empty array for unknown release", () => {
      const registry = new MigrationRegistry();
      expect(registry.getMigrationsByRelease("99.0.0")).toEqual([]);
    });

    it("sorts by priority ascending, defaulting to 100", () => {
      const registry = new MigrationRegistry();
      registry.register(
        makeDef({ id: "low", releaseVersion: "5.0.0", priority: 10 }),
      );
      registry.register(makeDef({ id: "default", releaseVersion: "5.0.0" }));
      registry.register(
        makeDef({ id: "high", releaseVersion: "5.0.0", priority: 200 }),
      );

      const ids = registry.getMigrationsByRelease("5.0.0").map((d) => d.id);
      expect(ids).toEqual(["low", "default", "high"]);
    });
  });

  describe("getAvailableReleases", () => {
    it("returns releases sorted descending by semver", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a", releaseVersion: "3.1.0" }));
      registry.register(makeDef({ id: "b", releaseVersion: "5.0.0" }));
      registry.register(makeDef({ id: "c", releaseVersion: "4.2.1" }));

      expect(registry.getAvailableReleases()).toEqual([
        "5.0.0",
        "4.2.1",
        "3.1.0",
      ]);
    });

    it("returns unique releases only", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a", releaseVersion: "5.0.0" }));
      registry.register(makeDef({ id: "b", releaseVersion: "5.0.0" }));

      expect(registry.getAvailableReleases()).toEqual(["5.0.0"]);
    });

    it("returns empty array when no definitions registered", () => {
      const registry = new MigrationRegistry();
      expect(registry.getAvailableReleases()).toEqual([]);
    });
  });

  describe("getMigrationById", () => {
    it("returns undefined for unknown id", () => {
      const registry = new MigrationRegistry();
      expect(registry.getMigrationById("nope")).toBeUndefined();
    });
  });

  describe("validateDependencies", () => {
    it("passes with no dependencies", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a" }));
      registry.register(makeDef({ id: "b" }));
      expect(() => registry.validateDependencies()).not.toThrow();
    });

    it("passes with valid linear dependencies", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a" }));
      registry.register(makeDef({ id: "b", dependencies: ["a"] }));
      registry.register(makeDef({ id: "c", dependencies: ["b"] }));
      expect(() => registry.validateDependencies()).not.toThrow();
    });

    it("throws on direct circular dependency", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a", dependencies: ["b"] }));
      registry.register(makeDef({ id: "b", dependencies: ["a"] }));
      expect(() => registry.validateDependencies()).toThrowError(
        /Circular dependency/,
      );
    });

    it("throws on indirect circular dependency", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a", dependencies: ["b"] }));
      registry.register(makeDef({ id: "b", dependencies: ["c"] }));
      registry.register(makeDef({ id: "c", dependencies: ["a"] }));
      expect(() => registry.validateDependencies()).toThrowError(
        /Circular dependency/,
      );
    });

    it("includes cycle path in error message", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "x", dependencies: ["y"] }));
      registry.register(makeDef({ id: "y", dependencies: ["x"] }));
      try {
        registry.validateDependencies();
        expect.fail("should have thrown");
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).toContain("->");
      }
    });

    it("passes with diamond dependencies (no cycle)", () => {
      const registry = new MigrationRegistry();
      registry.register(makeDef({ id: "a" }));
      registry.register(makeDef({ id: "b", dependencies: ["a"] }));
      registry.register(makeDef({ id: "c", dependencies: ["a"] }));
      registry.register(makeDef({ id: "d", dependencies: ["b", "c"] }));
      expect(() => registry.validateDependencies()).not.toThrow();
    });
  });
});
