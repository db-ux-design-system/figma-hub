import { describe, it, expect, beforeEach, vi } from "vitest";
import { MigrationExecutor } from "./executor";
import { MigrationRegistry } from "./registry";
import { PersistenceManager } from "./persistence";
import type {
  MigrationDefinition,
  MigrationNode,
  MigrationNodeResult,
  MigrationScope,
  PluginMessageToUI,
} from "./types";

// --- Figma API mock ---
let pluginDataStore: Record<string, string> = {};
const mockSelection: SceneNode[] = [];
const mockPageChildren: SceneNode[] = [];
const mockPages: { children: SceneNode[] }[] = [];

const mockFigma = {
  root: {
    setPluginData: vi.fn((key: string, value: string) => {
      pluginDataStore[key] = value;
    }),
    getPluginData: vi.fn((key: string) => pluginDataStore[key] ?? ""),
    children: mockPages,
  },
  currentPage: {
    selection: mockSelection,
    children: mockPageChildren,
  },
};

(globalThis as unknown as { figma: typeof mockFigma }).figma = mockFigma;

// --- Helpers ---
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
      status: "success" as const,
      description: "ok",
    }),
    ...overrides,
  };
}

function makeNode(id: string, name: string): MigrationNode {
  return { id, name, type: "FRAME", details: {} };
}

describe("MigrationExecutor", () => {
  let registry: MigrationRegistry;
  let persistence: PersistenceManager;
  let messages: PluginMessageToUI[];
  let sendMessage: (msg: PluginMessageToUI) => void;
  let executor: MigrationExecutor;

  beforeEach(() => {
    pluginDataStore = {};
    mockSelection.length = 0;
    mockPageChildren.length = 0;
    mockPages.length = 0;
    vi.clearAllMocks();

    registry = new MigrationRegistry();
    persistence = new PersistenceManager();
    messages = [];
    sendMessage = (msg: PluginMessageToUI) => messages.push(msg);
    executor = new MigrationExecutor(registry, persistence, sendMessage);
  });

  describe("analyze", () => {
    it("sends error when migration is not found", async () => {
      await executor.analyze("unknown", "page");
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe("error");
    });

    it("calls definition.analyze with correct context and sends analysis_complete", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      const analyzeFn = vi.fn(async () => nodes);

      registry.register(makeDef({ id: "mig-a", analyze: analyzeFn }));

      await executor.analyze("mig-a", "page");

      expect(analyzeFn).toHaveBeenCalledOnce();
      const ctx = analyzeFn.mock.calls[0][0];
      expect(ctx.scope).toBe("page");
      expect(typeof ctx.reportProgress).toBe("function");

      // Should have analysis_complete message
      const complete = messages.find((m) => m.type === "analysis_complete");
      expect(complete).toBeDefined();
      if (complete?.type === "analysis_complete") {
        expect(complete.data.nodes).toEqual(nodes);
      }
    });

    it("sends analysis_progress when reportProgress is called", async () => {
      const analyzeFn = vi.fn(
        async (ctx: { reportProgress: (n: number) => void }) => {
          ctx.reportProgress(5);
          ctx.reportProgress(10);
          return [];
        },
      );

      registry.register(makeDef({ id: "mig-a", analyze: analyzeFn }));
      await executor.analyze("mig-a", "page");

      const progressMsgs = messages.filter(
        (m) => m.type === "analysis_progress",
      );
      expect(progressMsgs).toHaveLength(2);
    });

    it("sends error when analyze throws", async () => {
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => {
            throw new Error("Analyze failed");
          },
        }),
      );

      await executor.analyze("mig-a", "page");

      const errorMsg = messages.find((m) => m.type === "error");
      expect(errorMsg).toBeDefined();
      if (errorMsg?.type === "error") {
        expect(errorMsg.data.message).toBe("Analyze failed");
      }
    });
  });

  describe("executeSingle", () => {
    it("returns error when migration is not found", async () => {
      const result = await executor.executeSingle("unknown", "n1", false);
      expect(result.status).toBe("error");
      expect(messages.some((m) => m.type === "migration_node_error")).toBe(
        true,
      );
    });

    it("returns error when node is not in analysis results", async () => {
      registry.register(makeDef({ id: "mig-a" }));
      // No analysis run, so no stored nodes
      const result = await executor.executeSingle("mig-a", "n1", false);
      expect(result.status).toBe("error");
    });

    it("executes migration and persists on success (not dryRun)", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      const migrateFn = vi.fn(async () => ({
        nodeId: "n1",
        status: "success" as const,
        description: "Migrated successfully",
      }));

      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: migrateFn,
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0; // Clear analysis messages

      const result = await executor.executeSingle("mig-a", "n1", false);

      expect(result.status).toBe("success");
      expect(migrateFn).toHaveBeenCalledOnce();
      expect(persistence.getCompletedNodes("mig-a")).toContain("n1");
      expect(messages.some((m) => m.type === "migration_node_complete")).toBe(
        true,
      );
    });

    it("does not persist on dryRun", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async () => ({
            nodeId: "n1",
            status: "success" as const,
            description: "Would migrate",
          }),
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      const result = await executor.executeSingle("mig-a", "n1", true);

      expect(result.status).toBe("success");
      expect(persistence.getCompletedNodes("mig-a")).toEqual([]);
      // Should NOT send migration_node_complete on dryRun
      expect(messages.some((m) => m.type === "migration_node_complete")).toBe(
        false,
      );
    });

    it("sends migration_node_error when migrate returns error status", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async () => ({
            nodeId: "n1",
            status: "error" as const,
            description: "",
            error: "Something went wrong",
          }),
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      const result = await executor.executeSingle("mig-a", "n1", false);
      expect(result.status).toBe("error");
      expect(messages.some((m) => m.type === "migration_node_error")).toBe(
        true,
      );
    });

    it("catches thrown errors from migrate function", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async () => {
            throw new Error("Crash!");
          },
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      const result = await executor.executeSingle("mig-a", "n1", false);
      expect(result.status).toBe("error");
      expect(result.error).toBe("Crash!");
    });
  });

  describe("executeBatch", () => {
    it("executes all nodes sequentially and sends migration_complete with report", async () => {
      const nodes: MigrationNode[] = [
        makeNode("n1", "Frame 1"),
        makeNode("n2", "Frame 2"),
        makeNode("n3", "Frame 3"),
      ];

      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async (node) => ({
            nodeId: node.id,
            status: "success" as const,
            description: `Migrated ${node.name}`,
          }),
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      await executor.executeBatch("mig-a", ["n1", "n2", "n3"], false);

      // Should have progress messages for each node
      const progressMsgs = messages.filter(
        (m) => m.type === "migration_progress",
      );
      expect(progressMsgs).toHaveLength(3);

      // Should have migration_complete with report
      const complete = messages.find((m) => m.type === "migration_complete");
      expect(complete).toBeDefined();
      if (complete?.type === "migration_complete") {
        expect(complete.data.report.summary.total).toBe(3);
        expect(complete.data.report.summary.success).toBe(3);
        expect(complete.data.report.summary.error).toBe(0);
      }
    });

    it("continues on individual node failures", async () => {
      const nodes: MigrationNode[] = [
        makeNode("n1", "Frame 1"),
        makeNode("n2", "Frame 2"),
        makeNode("n3", "Frame 3"),
      ];

      let callCount = 0;
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async (node) => {
            callCount++;
            if (node.id === "n2") {
              throw new Error("Node 2 failed");
            }
            return {
              nodeId: node.id,
              status: "success" as const,
              description: `Migrated ${node.name}`,
            };
          },
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      await executor.executeBatch("mig-a", ["n1", "n2", "n3"], false);

      // All 3 nodes should have been attempted
      expect(callCount).toBe(3);

      const complete = messages.find((m) => m.type === "migration_complete");
      expect(complete).toBeDefined();
      if (complete?.type === "migration_complete") {
        expect(complete.data.report.summary.success).toBe(2);
        expect(complete.data.report.summary.error).toBe(1);
      }
    });

    it("sends progress with correct completed/total counts", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "A"), makeNode("n2", "B")];
      registry.register(
        makeDef({
          id: "mig-a",
          analyze: async () => nodes,
          migrate: async (node) => ({
            nodeId: node.id,
            status: "success" as const,
            description: "ok",
          }),
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      await executor.executeBatch("mig-a", ["n1", "n2"], false);

      const progressMsgs = messages.filter(
        (m) => m.type === "migration_progress",
      );
      expect(progressMsgs).toHaveLength(2);
      if (progressMsgs[0].type === "migration_progress") {
        expect(progressMsgs[0].data).toEqual({ completed: 1, total: 2 });
      }
      if (progressMsgs[1].type === "migration_progress") {
        expect(progressMsgs[1].data).toEqual({ completed: 2, total: 2 });
      }
    });
  });

  describe("handleDecisionResponse", () => {
    it("resolves pending decision promise", async () => {
      const nodes: MigrationNode[] = [makeNode("n1", "Frame 1")];
      let capturedDecision: unknown = null;

      registry.register(
        makeDef({
          id: "mig-a",
          executionMode: "semi-automatic",
          analyze: async () => nodes,
          migrate: async (node, ctx) => {
            if (ctx.requestDecision) {
              capturedDecision = await ctx.requestDecision({
                id: "step-1",
                title: "Choose option",
                description: "Pick one",
                type: "decision",
                options: [{ value: "a", label: "Option A" }],
              });
            }
            return {
              nodeId: node.id,
              status: "success" as const,
              description: "done",
            };
          },
        }),
      );

      await executor.analyze("mig-a", "page");
      messages.length = 0;

      // Start migration in background - it will block on requestDecision
      const migrationPromise = executor.executeSingle("mig-a", "n1", false);

      // Wait a tick for the decision_required message to be sent
      await new Promise((r) => setTimeout(r, 10));

      const decisionMsg = messages.find((m) => m.type === "decision_required");
      expect(decisionMsg).toBeDefined();

      // Resolve the decision
      await executor.handleDecisionResponse("mig-a", "n1", "a");

      const result = await migrationPromise;
      expect(result.status).toBe("success");
      expect(capturedDecision).toBe("a");
    });
  });

  describe("generateReport", () => {
    it("generates correct summary counts", () => {
      registry.register(makeDef({ id: "mig-a", title: "Test Migration" }));

      const results: MigrationNodeResult[] = [
        { nodeId: "n1", status: "success", description: "ok" },
        { nodeId: "n2", status: "success", description: "ok" },
        { nodeId: "n3", status: "error", description: "", error: "fail" },
        { nodeId: "n4", status: "skipped", description: "skipped" },
      ];

      const report = executor.generateReport("mig-a", results);

      expect(report.migrationId).toBe("mig-a");
      expect(report.migrationTitle).toBe("Test Migration");
      expect(report.releaseVersion).toBe("5.0.0");
      expect(report.summary).toEqual({
        total: 4,
        success: 2,
        error: 1,
        skipped: 1,
      });
      expect(report.results).toHaveLength(4);
    });

    it("includes failed nodes with error descriptions in results", () => {
      registry.register(makeDef({ id: "mig-a" }));

      const results: MigrationNodeResult[] = [
        {
          nodeId: "n1",
          status: "error",
          description: "",
          error: "Something broke",
        },
      ];

      const report = executor.generateReport("mig-a", results);

      expect(report.results[0].status).toBe("error");
      expect(report.results[0].error).toBe("Something broke");
    });

    it("uses scope from analysis when available", async () => {
      registry.register(makeDef({ id: "mig-a", analyze: async () => [] }));

      await executor.analyze("mig-a", "document");

      const report = executor.generateReport("mig-a", []);
      expect(report.scope).toBe("document");
    });

    it("defaults to page scope when no analysis was run", () => {
      registry.register(makeDef({ id: "mig-a" }));

      const report = executor.generateReport("mig-a", []);
      expect(report.scope).toBe("page");
    });

    it("handles unknown migration gracefully", () => {
      const report = executor.generateReport("unknown", []);
      expect(report.migrationId).toBe("unknown");
      expect(report.migrationTitle).toBe("unknown");
      expect(report.releaseVersion).toBe("unknown");
    });

    it("has a valid ISO timestamp", () => {
      registry.register(makeDef({ id: "mig-a" }));
      const report = executor.generateReport("mig-a", []);
      expect(() => new Date(report.timestamp)).not.toThrow();
      expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
    });
  });
});
