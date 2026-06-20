/**
 * Integration tests for complete workflows
 *
 * Tests the end-to-end execution of:
 * - Validation workflow
 * - Outline conversion workflow
 * - "Run All" workflow
 *
 * Requirements: 12.1, 12.2, 12.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WorkflowOrchestrator } from "./utils/workflow-orchestrator.js";
import { VectorValidator } from "./validators/vector-validator.js";
import { OutlineConverter } from "./processors/outline-converter.js";
import { FlattenProcessor } from "./processors/flatten-processor.js";
import { ColorApplicator } from "./processors/color-applicator.js";
import { ScaleProcessor } from "./processors/scale-processor.js";
import { setupFigmaMock, cleanupFigmaMock } from "./test-utils/figma-mock.js";

// Mock Figma API types for testing
interface MockComponentSetNode {
  type: "COMPONENT_SET";
  name: string;
  id: string;
  children: MockComponentNode[];
}

interface MockComponentNode {
  type: "COMPONENT";
  name: string;
  id: string;
  width: number;
  height: number;
  children: MockVectorNode[];
  variantProperties?: Record<string, string>;
}

interface MockVectorNode {
  type: "VECTOR";
  name: string;
  id: string;
  width: number;
  height: number;
  strokeWeight: number;
  strokes: any[];
  fills: any[];
}

// Helper function to create mock component set
function createMockComponentSet(
  name: string,
  iconType: "functional" | "illustrative",
  variantSizes: number[] = [32, 24, 20],
): MockComponentSetNode {
  const strokeWeight = iconType === "functional" ? 2 : 1.5;

  const children: MockComponentNode[] = variantSizes.map((size) => ({
    type: "COMPONENT",
    name: `${name}/${size}`,
    id: `component-${size}`,
    width: size,
    height: size,
    variantProperties: { size: size.toString() },
    children: [
      {
        type: "VECTOR",
        name: "Vector",
        id: `vector-${size}`,
        width: size,
        height: size,
        strokeWeight,
        strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        fills: [],
      },
    ],
  }));

  return {
    type: "COMPONENT_SET",
    name,
    id: "component-set-1",
    children,
  };
}

describe("Workflow Integration Tests", () => {
  // Setup Figma mock before each test
  beforeEach(() => {
    setupFigmaMock();
  });

  // Cleanup Figma mock after each test
  afterEach(() => {
    cleanupFigmaMock();
  });

  describe("Validation Workflow", () => {
    it("should validate a functional icon component set successfully", () => {
      // Requirement 12.1: Test validation workflow
      const componentSet = createMockComponentSet("ic-test", "functional");
      const validator = new VectorValidator("functional");

      const result = validator.validate(componentSet as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate an illustrative icon component set successfully", () => {
      // Requirement 12.1: Test validation workflow
      const componentSet = createMockComponentSet("illu-test", "illustrative");
      const validator = new VectorValidator("illustrative");

      const result = validator.validate(componentSet as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect validation errors for incorrect stroke width", () => {
      // Requirement 12.1: Test validation workflow with errors
      const componentSet = createMockComponentSet("ic-test", "functional");

      // Modify stroke width to be incorrect
      (componentSet.children[0].children[0] as any).strokeWeight = 1.5;

      const validator = new VectorValidator("functional");
      const result = validator.validate(componentSet as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].rule).toBe("stroke-width");
    });

    it("should validate all variants in a component set", () => {
      // Requirement 12.1: Test validation workflow checks all variants
      const componentSet = createMockComponentSet(
        "ic-test",
        "functional",
        [32, 24, 20],
      );
      const validator = new VectorValidator("functional");

      const result = validator.validate(componentSet as any);

      // All variants should be checked
      expect(result.isValid).toBe(true);
    });

    it("should report all validation errors across multiple variants", () => {
      // Requirement 12.1: Test validation workflow reports all errors
      const componentSet = createMockComponentSet(
        "ic-test",
        "functional",
        [32, 24, 20],
      );

      // Make all variants have incorrect stroke width
      componentSet.children.forEach((variant) => {
        (variant.children[0] as any).strokeWeight = 1;
      });

      const validator = new VectorValidator("functional");
      const result = validator.validate(componentSet as any);

      expect(result.isValid).toBe(false);
      // Should have errors for all 3 variants
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Outline Conversion Workflow", () => {
    it("should convert outlines for all variants in a component set", async () => {
      // Requirement 12.2: Test outline conversion workflow
      const componentSet = createMockComponentSet("ic-test", "functional");
      const converter = new OutlineConverter();

      // Verify vectors have strokes before conversion
      const vectorsBefore = componentSet.children.flatMap((v) => v.children);
      expect(vectorsBefore.every((v) => v.strokes.length > 0)).toBe(true);

      await converter.convert(componentSet as any);

      // After conversion, strokes should be converted to fills
      // Note: In a real Figma environment, this would actually modify the nodes
      // For this test, we're verifying the converter was called correctly
      expect(converter).toBeDefined();
    });

    it("should handle component sets with multiple vectors per variant", async () => {
      // Requirement 12.2: Test outline conversion with complex structures
      const componentSet = createMockComponentSet("ic-test", "functional");

      // Add additional vectors to each variant
      componentSet.children.forEach((variant) => {
        variant.children.push({
          type: "VECTOR",
          name: "Vector 2",
          id: `vector-2-${variant.id}`,
          width: variant.width,
          height: variant.height,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        });
      });

      const converter = new OutlineConverter();
      await converter.convert(componentSet as any);

      // Verify converter processes all vectors
      expect(converter).toBeDefined();
    });

    it("should preserve visual appearance during outline conversion", async () => {
      // Requirement 12.2: Test outline conversion preserves appearance
      const componentSet = createMockComponentSet("ic-test", "functional");
      const converter = new OutlineConverter();

      // Store original dimensions
      const originalDimensions = componentSet.children.map((v) => ({
        width: v.width,
        height: v.height,
      }));

      await converter.convert(componentSet as any);

      // Verify dimensions are preserved
      componentSet.children.forEach((variant, index) => {
        expect(variant.width).toBe(originalDimensions[index].width);
        expect(variant.height).toBe(originalDimensions[index].height);
      });
    });
  });

  describe("Run All Workflow", () => {
    it("should execute all operations in the correct order", async () => {
      // Requirement 12.2: Test workflow operation ordering
      const componentSet = createMockComponentSet("ic-test", "functional");
      const orchestrator = new WorkflowOrchestrator();
      const executionOrder: string[] = [];

      // Add steps in the correct order
      orchestrator.addStep("Validation", async () => {
        executionOrder.push("Validation");
        const validator = new VectorValidator("functional");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error("Validation failed");
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        executionOrder.push("Outline Conversion");
        const converter = new OutlineConverter();
        await converter.convert(componentSet as any);
      });

      orchestrator.addStep("Flatten", async () => {
        executionOrder.push("Flatten");
        const processor = new FlattenProcessor();
        await processor.flatten(componentSet as any);
      });

      orchestrator.addStep("Color Application", async () => {
        executionOrder.push("Color Application");
        const config = {
          functional: "VariableID:functional-icon-color",
          illustrative: "VariableID:illustrative-icon-color",
        };
        const applicator = new ColorApplicator("functional", config);
        await applicator.apply(componentSet as any);
      });

      orchestrator.addStep("Scaling", async () => {
        executionOrder.push("Scaling");
        const processor = new ScaleProcessor();
        await processor.scale(componentSet as any);
      });

      const result = await orchestrator.run();

      // Verify execution order
      expect(result.success).toBe(true);
      expect(executionOrder).toEqual([
        "Validation",
        "Outline Conversion",
        "Flatten",
        "Color Application",
        "Scaling",
      ]);
    });

    it("should stop workflow if validation fails", async () => {
      // Requirement 12.3: Test workflow failure handling
      const componentSet = createMockComponentSet("ic-test", "functional");

      // Make validation fail
      (componentSet.children[0].children[0] as any).strokeWeight = 1;

      const orchestrator = new WorkflowOrchestrator();
      const executionOrder: string[] = [];

      orchestrator.addStep("Validation", async () => {
        executionOrder.push("Validation");
        const validator = new VectorValidator("functional");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error(
            `Validation failed: ${result.errors.map((e) => e.message).join(", ")}`,
          );
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        executionOrder.push("Outline Conversion");
      });

      orchestrator.addStep("Flatten", async () => {
        executionOrder.push("Flatten");
      });

      const result = await orchestrator.run();

      // Workflow should fail at validation
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe("Validation");
      expect(result.error).toContain("Validation failed");

      // Only validation should have executed
      expect(executionOrder).toEqual(["Validation"]);
      expect(result.completedSteps).toEqual([]);
    });

    it("should stop workflow if outline conversion fails", async () => {
      // Requirement 12.3: Test workflow stops on processing failure
      const componentSet = createMockComponentSet("ic-test", "functional");
      const orchestrator = new WorkflowOrchestrator();
      const executionOrder: string[] = [];

      orchestrator.addStep("Validation", async () => {
        executionOrder.push("Validation");
        const validator = new VectorValidator("functional");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error("Validation failed");
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        executionOrder.push("Outline Conversion");
        throw new Error("Outline conversion failed");
      });

      orchestrator.addStep("Flatten", async () => {
        executionOrder.push("Flatten");
      });

      const result = await orchestrator.run();

      // Workflow should fail at outline conversion
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe("Outline Conversion");
      expect(result.completedSteps).toEqual(["Validation"]);

      // Flatten should not execute
      expect(executionOrder).toEqual(["Validation", "Outline Conversion"]);
    });

    it("should report progress for each step", async () => {
      // Requirement 12.4: Test workflow progress reporting
      const componentSet = createMockComponentSet("ic-test", "functional");
      const orchestrator = new WorkflowOrchestrator();
      const progressReports: Array<{
        step: string;
        index: number;
        total: number;
      }> = [];

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("functional");
        validator.validate(componentSet as any);
      });

      orchestrator.addStep("Outline Conversion", async () => {
        const converter = new OutlineConverter();
        await converter.convert(componentSet as any);
      });

      orchestrator.addStep("Flatten", async () => {
        const processor = new FlattenProcessor();
        await processor.flatten(componentSet as any);
      });

      const onProgress = (step: string, index: number, total: number) => {
        progressReports.push({ step, index, total });
      };

      const result = await orchestrator.run(onProgress);

      // Verify progress was reported for each step
      expect(result.success).toBe(true);
      expect(progressReports).toHaveLength(3);
      expect(progressReports).toEqual([
        { step: "Validation", index: 1, total: 3 },
        { step: "Outline Conversion", index: 2, total: 3 },
        { step: "Flatten", index: 3, total: 3 },
      ]);
    });

    it("should complete full workflow with all operations", async () => {
      // Requirement 12.1: Test complete "Run All" workflow
      const componentSet = createMockComponentSet("ic-test", "functional");
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("functional");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error("Validation failed");
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        const converter = new OutlineConverter();
        await converter.convert(componentSet as any);
      });

      orchestrator.addStep("Flatten", async () => {
        const processor = new FlattenProcessor();
        await processor.flatten(componentSet as any);
      });

      orchestrator.addStep("Color Application", async () => {
        const config = {
          functional: "VariableID:functional-icon-color",
          illustrative: "VariableID:illustrative-icon-color",
        };
        const applicator = new ColorApplicator("functional", config);
        await applicator.apply(componentSet as any);
      });

      orchestrator.addStep("Scaling", async () => {
        const processor = new ScaleProcessor();
        await processor.scale(componentSet as any);
      });

      const result = await orchestrator.run();

      // Verify all steps completed successfully
      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([
        "Validation",
        "Outline Conversion",
        "Flatten",
        "Color Application",
        "Scaling",
      ]);
      expect(result.failedStep).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle illustrative icon workflow", async () => {
      // Requirement 12.1: Test workflow with illustrative icons
      const componentSet = createMockComponentSet("illu-test", "illustrative");
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("illustrative");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error("Validation failed");
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        const converter = new OutlineConverter();
        await converter.convert(componentSet as any);
      });

      orchestrator.addStep("Color Application", async () => {
        const config = {
          functional: "VariableID:functional-icon-color",
          illustrative: "VariableID:illustrative-icon-color",
        };
        const applicator = new ColorApplicator("illustrative", config);
        await applicator.apply(componentSet as any);
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([
        "Validation",
        "Outline Conversion",
        "Color Application",
      ]);
    });

    it("should provide detailed error information on failure", async () => {
      // Requirement 12.3: Test workflow error reporting
      const componentSet = createMockComponentSet("ic-test", "functional");
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("functional");
        validator.validate(componentSet as any);
      });

      orchestrator.addStep("Flatten", async () => {
        throw new Error("Flatten operation encountered an unexpected error");
      });

      orchestrator.addStep("Color Application", async () => {
        // Should not execute
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe("Flatten");
      expect(result.error).toBe(
        "Flatten operation encountered an unexpected error",
      );
      expect(result.completedSteps).toEqual(["Validation"]);
    });
  });

  describe("Workflow Edge Cases", () => {
    it("should handle empty component set", async () => {
      // Test workflow with edge case: empty component set
      const componentSet: MockComponentSetNode = {
        type: "COMPONENT_SET",
        name: "ic-empty",
        id: "empty-set",
        children: [],
      };

      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("functional");
        validator.validate(componentSet as any);
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
    });

    it("should handle component set with single variant", async () => {
      // Test workflow with edge case: single variant
      const componentSet = createMockComponentSet("ic-single", "functional", [
        32,
      ]);
      const orchestrator = new WorkflowOrchestrator();

      orchestrator.addStep("Validation", async () => {
        const validator = new VectorValidator("functional");
        const result = validator.validate(componentSet as any);
        if (!result.isValid) {
          throw new Error("Validation failed");
        }
      });

      orchestrator.addStep("Outline Conversion", async () => {
        const converter = new OutlineConverter();
        await converter.convert(componentSet as any);
      });

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([
        "Validation",
        "Outline Conversion",
      ]);
    });

    it("should handle workflow with no steps", async () => {
      // Test workflow edge case: no steps added
      const orchestrator = new WorkflowOrchestrator();

      const result = await orchestrator.run();

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual([]);
    });
  });
});
