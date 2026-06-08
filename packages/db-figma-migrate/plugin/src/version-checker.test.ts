import { describe, it, expect } from "vitest";
import { VersionChecker } from "./version-checker";
import type { MigrationDefinition } from "./types";

/** Helper to create a minimal MigrationDefinition with version info. */
function makeDef(
  overrides: Partial<MigrationDefinition<unknown>> = {},
): MigrationDefinition<unknown> {
  return {
    id: "test-migration",
    releaseVersion: "5.0.0",
    title: "Test Migration",
    description: "test",
    executionMode: "automatic",
    analyze: async () => [],
    migrate: async () => ({
      nodeId: "1",
      status: "success",
      description: "ok",
    }),
    supportedSourceVersions: ["4.0.0", "4.1.0", "4.2.0"],
    ...overrides,
  };
}

/** Helper to create a mock InstanceNode with a mainComponent. */
function makeInstanceNode(
  id: string,
  name: string,
  componentName: string,
  componentDescription = "",
): SceneNode {
  return {
    id,
    name,
    type: "INSTANCE",
    mainComponent: {
      name: componentName,
      description: componentDescription,
    },
  } as unknown as SceneNode;
}

/** Helper to create a mock non-instance SceneNode. */
function makeFrameNode(id: string, name: string): SceneNode {
  return {
    id,
    name,
    type: "FRAME",
  } as unknown as SceneNode;
}

describe("VersionChecker", () => {
  const checker = new VersionChecker();

  describe("checkCompatibility", () => {
    it("marks compatible when version is in supportedSourceVersions", () => {
      const def = makeDef();
      const nodes = [makeInstanceNode("1", "Button", "Button/v4.1.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results).toHaveLength(1);
      expect(results[0].compatible).toBe(true);
      expect(results[0].currentVersion).toBe("4.1.0");
      expect(results[0].majorVersionGap).toBe(1);
    });

    it("marks incompatible when version is not in supportedSourceVersions", () => {
      const def = makeDef();
      const nodes = [makeInstanceNode("1", "Button", "Button/v3.0.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].compatible).toBe(false);
      expect(results[0].currentVersion).toBe("3.0.0");
      expect(results[0].majorVersionGap).toBe(2);
    });

    it("handles null currentVersion for non-instance nodes", () => {
      const def = makeDef();
      const nodes = [makeFrameNode("1", "MyFrame")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].currentVersion).toBeNull();
      expect(results[0].compatible).toBe(false);
      expect(results[0].majorVersionGap).toBe(0);
    });

    it("handles instance node without mainComponent", () => {
      const node = {
        id: "1",
        name: "Orphan",
        type: "INSTANCE",
        mainComponent: null,
      } as unknown as SceneNode;

      const results = checker.checkCompatibility(makeDef(), [node]);
      expect(results[0].currentVersion).toBeNull();
      expect(results[0].compatible).toBe(false);
    });

    it("extracts version from component description as fallback", () => {
      const node = makeInstanceNode(
        "1",
        "Icon",
        "Icon/NoVersion",
        "Component version: 4.2.0",
      );
      const results = checker.checkCompatibility(makeDef(), [node]);

      expect(results[0].currentVersion).toBe("4.2.0");
      expect(results[0].compatible).toBe(true);
    });

    it("calculates majorVersionGap correctly", () => {
      const def = makeDef({ releaseVersion: "6.0.0" });
      const nodes = [makeInstanceNode("1", "Button", "Button/v3.5.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].majorVersionGap).toBe(3);
    });

    it("returns empty array for empty nodes", () => {
      const results = checker.checkCompatibility(makeDef(), []);
      expect(results).toEqual([]);
    });

    it("handles multiple nodes", () => {
      const def = makeDef();
      const nodes = [
        makeInstanceNode("1", "Button", "Button/v4.0.0"),
        makeInstanceNode("2", "Card", "Card/v3.0.0"),
        makeFrameNode("3", "Layout"),
      ];
      const results = checker.checkCompatibility(def, nodes);

      expect(results).toHaveLength(3);
      expect(results[0].compatible).toBe(true);
      expect(results[1].compatible).toBe(false);
      expect(results[2].currentVersion).toBeNull();
    });

    it("treats empty supportedSourceVersions as all incompatible", () => {
      const def = makeDef({ supportedSourceVersions: [] });
      const nodes = [makeInstanceNode("1", "Button", "Button/v4.0.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].compatible).toBe(false);
    });

    it("treats undefined supportedSourceVersions as all incompatible", () => {
      const def = makeDef({ supportedSourceVersions: undefined });
      const nodes = [makeInstanceNode("1", "Button", "Button/v4.0.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].compatible).toBe(false);
    });

    it("populates supportedVersions from definition", () => {
      const def = makeDef({ supportedSourceVersions: ["4.0.0", "4.1.0"] });
      const nodes = [makeInstanceNode("1", "Button", "Button/v4.0.0")];
      const results = checker.checkCompatibility(def, nodes);

      expect(results[0].supportedVersions).toEqual(["4.0.0", "4.1.0"]);
    });
  });
});
