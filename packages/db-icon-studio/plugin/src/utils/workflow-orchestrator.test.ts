/**
 * Unit tests for WorkflowOrchestrator
 */

import { describe, it, expect, vi } from "vitest";
import { WorkflowOrchestrator } from "./workflow-orchestrator";

describe("WorkflowOrchestrator", () => {
  describe("addStep", () => {
    it("should add a step to the workflow", () => {
      const orchestrator = new WorkflowOrchestrator();
      const mockExecute = vi.fn().mockResolvedValue(undefined);

      orchestrator.addStep("Test Step", mockExecute);

      expect(orchestrator.getStepCount()).toBe(1);
      expect(orchestrator.getStepNames()).toEqual(["Test Step"]);
    });

    it("should add multiple steps in order", () => {
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Step 1", vi.fn().mockResolvedValue(undefined));
      orchestrator.addStep("Step 2", vi.fn().mockResolvedValue(undefined));
      orchestrator.addStep("Step 3", vi.fn().mockResolvedValue(undefined));

      expect(orchestrator.getStepCount()).toBe(3);
      expect(orchestrator.getStepNames()).toEqual([
        "Step 1",
        "Step 2",
        "Step 3",
      ]);
    });
  });

  describe("run", () => {
    it("should execute all steps in sequence", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const executionOrder: number[] = [];

      orchestrator.addStep("Step 1", async () => {
        executionOrder.push(1);
      });
      orchestrator.addStep("Step 2", async () => {
        executionOrder.push(2);
      });
      orchestrator.addStep("Step 3", async () => {
        executionOrder.push(3);
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(["Step 1", "Step 2", "Step 3"]);
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it("should report progress for each step", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const progressReports: Array<{
        step: string;
        index: number;
        total: number;
      }> = [];

      orchestrator.addStep("Step 1", async () => {});
      orchestrator.addStep("Step 2", async () => {});
      orchestrator.addStep("Step 3", async () => {});

      const onProgress = (step: string, index: number, total: number) => {
        progressReports.push({ step, index, total });
      };

      await orchestrator.run(onProgress);

      expect(progressReports).toEqual([
        { step: "Step 1", index: 1, total: 3 },
        { step: "Step 2", index: 2, total: 3 },
        { step: "Step 3", index: 3, total: 3 },
      ]);
    });

    it("should stop execution when a step fails", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const executionOrder: number[] = [];

      orchestrator.addStep("Step 1", async () => {
        executionOrder.push(1);
      });
      orchestrator.addStep("Step 2", async () => {
        executionOrder.push(2);
        throw new Error("Step 2 failed");
      });
      orchestrator.addStep("Step 3", async () => {
        executionOrder.push(3);
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.completedSteps).toEqual(["Step 1"]);
      expect(result.failedStep).toBe("Step 2");
      expect(result.error).toBe("Step 2 failed");
      expect(executionOrder).toEqual([1, 2]); // Step 3 should not execute
    });

    it("should handle errors thrown as strings", async () => {
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Step 1", async () => {
        throw "String error";
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe("Step 1");
      expect(result.error).toBe("String error");
    });

    it("should return success with empty completed steps for empty workflow", async () => {
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([]);
      expect(result.failedStep).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it("should call progress callback before executing each step", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const events: string[] = [];

      orchestrator.addStep("Step 1", async () => {
        events.push("execute-1");
      });
      orchestrator.addStep("Step 2", async () => {
        events.push("execute-2");
      });

      const onProgress = (step: string) => {
        events.push(`progress-${step}`);
      };

      await orchestrator.run(onProgress);

      expect(events).toEqual([
        "progress-Step 1",
        "execute-1",
        "progress-Step 2",
        "execute-2",
      ]);
    });

    it("should not call progress callback after a step fails", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const progressReports: string[] = [];

      orchestrator.addStep("Step 1", async () => {});
      orchestrator.addStep("Step 2", async () => {
        throw new Error("Failed");
      });
      orchestrator.addStep("Step 3", async () => {});

      const onProgress = (step: string) => {
        progressReports.push(step);
      };

      await orchestrator.run(onProgress);

      // Should only report progress for steps 1 and 2, not 3
      expect(progressReports).toEqual(["Step 1", "Step 2"]);
    });
  });

  describe("clear", () => {
    it("should remove all steps from the workflow", () => {
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Step 1", vi.fn().mockResolvedValue(undefined));
      orchestrator.addStep("Step 2", vi.fn().mockResolvedValue(undefined));

      expect(orchestrator.getStepCount()).toBe(2);

      orchestrator.clear();

      expect(orchestrator.getStepCount()).toBe(0);
      expect(orchestrator.getStepNames()).toEqual([]);
    });
  });

  describe("getStepCount", () => {
    it("should return 0 for empty workflow", () => {
      const orchestrator = new WorkflowOrchestrator();

      expect(orchestrator.getStepCount()).toBe(0);
    });

    it("should return correct count after adding steps", () => {
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Step 1", vi.fn().mockResolvedValue(undefined));
      expect(orchestrator.getStepCount()).toBe(1);

      orchestrator.addStep("Step 2", vi.fn().mockResolvedValue(undefined));
      expect(orchestrator.getStepCount()).toBe(2);
    });
  });

  describe("getStepNames", () => {
    it("should return empty array for empty workflow", () => {
      const orchestrator = new WorkflowOrchestrator();

      expect(orchestrator.getStepNames()).toEqual([]);
    });

    it("should return all step names in order", () => {
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", vi.fn().mockResolvedValue(undefined));
      orchestrator.addStep("Conversion", vi.fn().mockResolvedValue(undefined));
      orchestrator.addStep("Flatten", vi.fn().mockResolvedValue(undefined));

      expect(orchestrator.getStepNames()).toEqual([
        "Validation",
        "Conversion",
        "Flatten",
      ]);
    });
  });

  describe("integration scenarios", () => {
    it("should handle a complete workflow with all operations", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const operations: string[] = [];

      // Simulate the actual workflow operations
      orchestrator.addStep("Validate", async () => {
        operations.push("validated");
      });
      orchestrator.addStep("Convert Outline", async () => {
        operations.push("converted");
      });
      orchestrator.addStep("Flatten", async () => {
        operations.push("flattened");
      });
      orchestrator.addStep("Apply Colors", async () => {
        operations.push("colored");
      });
      orchestrator.addStep("Scale", async () => {
        operations.push("scaled");
      });
      orchestrator.addStep("Edit Description", async () => {
        operations.push("described");
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([
        "Validate",
        "Convert Outline",
        "Flatten",
        "Apply Colors",
        "Scale",
        "Edit Description",
      ]);
      expect(operations).toEqual([
        "validated",
        "converted",
        "flattened",
        "colored",
        "scaled",
        "described",
      ]);
    });

    it("should handle workflow failure in the middle", async () => {
      const orchestrator = new WorkflowOrchestrator();
      const operations: string[] = [];

      orchestrator.addStep("Validate", async () => {
        operations.push("validated");
      });
      orchestrator.addStep("Convert Outline", async () => {
        operations.push("converted");
      });
      orchestrator.addStep("Flatten", async () => {
        throw new Error("Flatten operation failed");
      });
      orchestrator.addStep("Apply Colors", async () => {
        operations.push("colored");
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.completedSteps).toEqual(["Validate", "Convert Outline"]);
      expect(result.failedStep).toBe("Flatten");
      expect(result.error).toBe("Flatten operation failed");
      expect(operations).toEqual(["validated", "converted"]);
    });

    it("should allow reusing orchestrator after clearing", async () => {
      const orchestrator = new WorkflowOrchestrator();

      // First workflow
      orchestrator.addStep("Step 1", async () => {});
      await orchestrator.run();
      expect(orchestrator.getStepCount()).toBe(1);

      // Clear and add new workflow
      orchestrator.clear();
      orchestrator.addStep("Step A", async () => {});
      orchestrator.addStep("Step B", async () => {});

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(["Step A", "Step B"]);
    });
  });
});
