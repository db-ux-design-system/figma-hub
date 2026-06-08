/**
 * Tests for Master Icon Template Validator
 *
 * Tests validation of master icon templates in "Icon templates (open paths)"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MasterIconValidator } from "./master-icon-validator.js";
import { setupFigmaMock, cleanupFigmaMock } from "../test-utils/figma-mock.js";

// Mock types for testing
interface MockFrameNode {
  type: "FRAME";
  name: string;
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  children: MockSceneNode[];
}

interface MockVectorNode {
  type: "VECTOR";
  name: string;
  id: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  strokeWeight: number;
  strokes: any[];
  fills: any[];
}

type MockSceneNode = MockFrameNode | MockVectorNode;

// Helper function to create mock master icon frame
function createMockMasterIconFrame(
  size: number,
  hasContainer: boolean = true,
  containerHasContent: boolean = true,
  strokeWeight: number = 2,
): MockFrameNode {
  const children: MockSceneNode[] = [];

  if (hasContainer) {
    const containerChildren: MockSceneNode[] = [];

    if (containerHasContent) {
      containerChildren.push({
        type: "VECTOR",
        name: "Vector",
        id: "vector-1",
        x: 8,
        y: 8,
        width: size - 16,
        height: size - 16,
        strokeWeight,
        strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        fills: [],
      });
    }

    children.push({
      type: "FRAME",
      name: "Container",
      id: "container-1",
      x: 0,
      y: 0,
      width: size,
      height: size,
      children: containerChildren,
    });
  }

  return {
    type: "FRAME",
    name: `Icon ${size}px`,
    id: "frame-1",
    width: size,
    height: size,
    children,
  };
}

describe("MasterIconValidator", () => {
  beforeEach(() => {
    setupFigmaMock();
  });

  afterEach(() => {
    cleanupFigmaMock();
  });

  describe("Functional Icon Templates (32px, 24px, 20px)", () => {
    it("should validate 32px functional icon template successfully", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate 24px functional icon template successfully", () => {
      const frame = createMockMasterIconFrame(24, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate 20px functional icon template successfully", () => {
      const frame = createMockMasterIconFrame(20, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should warn for 1.75px stroke width for functional icons", () => {
      const frame = createMockMasterIconFrame(32, true, true, 1.75);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true); // Valid but with warning
      expect(result.errors).toHaveLength(0);
      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.warnings?.[0].message).toContain("1.75px");
      expect(result.warnings?.[0].message).toContain("Recommended: 2px");
    });

    it("should warn for 1.5px stroke width for functional icons", () => {
      const frame = createMockMasterIconFrame(32, true, true, 1.5);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true); // Valid but with warning
      expect(result.errors).toHaveLength(0);
      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.warnings?.[0].message).toContain("1.5px");
      expect(result.warnings?.[0].message).toContain("Recommended: 2px");
    });

    it("should detect incorrect stroke width for functional icons", () => {
      const frame = createMockMasterIconFrame(32, true, true, 3);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("stroke width");
      expect(result.errors[0].message).toContain("3px");
    });
  });

  describe("Illustrative Icon Templates (64px)", () => {
    it("should validate 64px illustrative icon template successfully", () => {
      const frame = createMockMasterIconFrame(64, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect incorrect stroke width for illustrative icons", () => {
      const frame = createMockMasterIconFrame(64, true, true, 1.5);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("stroke width");
      expect(result.errors[0].message).toContain("1.5px");
      expect(result.errors[0].message).toContain("2px");
    });
  });

  describe("Frame Size Validation", () => {
    it("should reject invalid frame size", () => {
      const frame = createMockMasterIconFrame(48, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain(
        "not a valid master icon size",
      );
    });

    it("should reject non-square frame", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      frame.height = 24; // Make it non-square
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("must be square")),
      ).toBe(true);
    });
  });

  describe("Container Validation", () => {
    it("should detect missing container", () => {
      const frame = createMockMasterIconFrame(32, false, false, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("Frame is empty");
    });

    it("should detect empty container", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Container is empty")),
      ).toBe(true);
    });

    it("should detect container size mismatch", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      // Make container smaller than frame
      (frame.children[0] as MockFrameNode).width = 28;
      (frame.children[0] as MockFrameNode).height = 28;
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.message.includes("Container size mismatch"),
        ),
      ).toBe(true);
    });

    it("should warn if container is not named 'Container'", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      (frame.children[0] as MockFrameNode).name = "Container Frame"; // Contains "container" but not exact match
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.message.includes('Container frame should be named "Container"'),
        ),
      ).toBe(true);
    });
  });

  describe("Container Content Validation", () => {
    it("should detect missing vector content", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      // Replace vector with a text node (non-vector)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "FRAME" as any,
          name: "Text",
          id: "text-1",
          width: 20,
          height: 20,
          children: [],
        },
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("no vector content")),
      ).toBe(true);
    });

    it("should validate nested vector content in groups", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add a group with vector content
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "FRAME",
          name: "Group",
          id: "group-1",
          width: 24,
          height: 24,
          children: [
            {
              type: "VECTOR",
              name: "Vector",
              id: "vector-1",
              width: 20,
              height: 20,
              strokeWeight: 2,
              strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
              fills: [],
            },
          ],
        },
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Multiple Vectors Validation", () => {
    it("should validate all vectors in container", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add multiple vectors with correct stroke
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector 1",
          id: "vector-1",
          width: 20,
          height: 20,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        },
        {
          type: "VECTOR",
          name: "Vector 2",
          id: "vector-2",
          width: 18,
          height: 18,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        },
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect incorrect stroke in any vector", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add multiple vectors, one with incorrect stroke
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector 1",
          id: "vector-1",
          width: 20,
          height: 20,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        },
        {
          type: "VECTOR",
          name: "Vector 2",
          id: "vector-2",
          width: 18,
          height: 18,
          strokeWeight: 1, // Incorrect stroke
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        },
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("Vector 2");
      expect(result.errors[0].message).toContain("stroke width");
    });
  });

  describe("Edge Cases", () => {
    it("should handle frame with no children", () => {
      const frame: MockFrameNode = {
        type: "FRAME",
        name: "Empty Frame",
        id: "frame-1",
        width: 32,
        height: 32,
        children: [],
      };
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Frame is empty")),
      ).toBe(true);
    });

    it("should handle container with deeply nested vectors", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Create deeply nested structure
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "FRAME",
          name: "Group 1",
          id: "group-1",
          width: 24,
          height: 24,
          children: [
            {
              type: "FRAME",
              name: "Group 2",
              id: "group-2",
              width: 20,
              height: 20,
              children: [
                {
                  type: "VECTOR",
                  name: "Vector",
                  id: "vector-1",
                  width: 16,
                  height: 16,
                  strokeWeight: 2,
                  strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
                  fills: [],
                },
              ],
            },
          ],
        },
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate vectors directly in container (without frame/group)", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add vectors directly to container (no intermediate frame/group)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector1",
          id: "vector-1",
          x: 8,
          y: 8,
          width: 8,
          height: 8,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
        {
          type: "VECTOR",
          name: "Vector2",
          id: "vector-2",
          x: 16,
          y: 8,
          width: 8,
          height: 8,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      // Should validate successfully - vectors directly in container are valid
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Should find both vectors
      expect(result.vectorPositions?.length).toBe(2);
    });
  });

  describe("Icon Type Detection", () => {
    it("should detect functional icon from 32px size", () => {
      const frame = createMockMasterIconFrame(32, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      // Should validate with functional icon rules (2px stroke)
      expect(result.isValid).toBe(true);
    });

    it("should detect functional icon from 24px size", () => {
      const frame = createMockMasterIconFrame(24, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
    });

    it("should detect functional icon from 20px size", () => {
      const frame = createMockMasterIconFrame(20, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
    });

    it("should detect illustrative icon from 64px size", () => {
      const frame = createMockMasterIconFrame(64, true, true, 2);
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      // Should validate with illustrative icon rules (2px stroke)
      expect(result.isValid).toBe(true);
    });
  });

  describe("Safety Zone Validation", () => {
    it("should detect vector too close to left edge", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add vector too close to left edge (at x=1, should be at least 3px for strokes)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector",
          id: "vector-1",
          x: 1,
          y: 10,
          width: 20,
          height: 20,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Check position of")),
      ).toBe(true);
      expect(
        result.errors.some((e) =>
          e.message.includes("left edge is in safety area"),
        ),
      ).toBe(true);
    });

    it("should detect vector too close to right edge", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add vector too close to right edge (at x=28, width=5, right=33, should be max 29 for strokes)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector",
          id: "vector-1",
          x: 28,
          y: 10,
          width: 5,
          height: 20,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Check position of")),
      ).toBe(true);
      expect(
        result.errors.some((e) =>
          e.message.includes("right edge is in safety area"),
        ),
      ).toBe(true);
    });

    it("should validate vector within safety zone", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add vector properly positioned (at x=5, y=5, width=22, height=22)
      // This gives 5px from left/top and 5px from right/bottom (32 - 5 - 22 = 5)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "Vector",
          id: "vector-1",
          x: 5,
          y: 5,
          width: 22,
          height: 22,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect fill vector too close to edge (2px minimum)", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add fill-only vector too close to left edge (at x=1, should be at least 2px for fills)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "FillVector",
          id: "vector-1",
          x: 1,
          y: 5,
          width: 20,
          height: 20,
          strokeWeight: 0,
          strokes: [],
          fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Check position of")),
      ).toBe(true);
      expect(result.errors.some((e) => e.message.includes("(fill)"))).toBe(
        true,
      );
      expect(
        result.errors.some((e) =>
          e.message.includes("left edge is in safety area"),
        ),
      ).toBe(true);
    });

    it("should validate fill vector at 2px from edge", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add fill-only vector at exactly 2px from edge (should be valid)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "FillVector",
          id: "vector-1",
          x: 2,
          y: 2,
          width: 28,
          height: 28,
          strokeWeight: 0,
          strokes: [],
          fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect stroke vector too close to edge (3px minimum)", () => {
      const frame = createMockMasterIconFrame(32, true, false, 2);
      // Add stroke vector at 2.5px from edge (should fail, needs 3px)
      (frame.children[0] as MockFrameNode).children = [
        {
          type: "VECTOR",
          name: "StrokeVector",
          id: "vector-1",
          x: 2.5,
          y: 5,
          width: 20,
          height: 20,
          strokeWeight: 2,
          strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          fills: [],
        } as any,
      ];
      const validator = new MasterIconValidator();

      const result = validator.validate(frame as any);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Check position of")),
      ).toBe(true);
      expect(result.errors.some((e) => e.message.includes("(stroke)"))).toBe(
        true,
      );
      expect(
        result.errors.some((e) =>
          e.message.includes("left edge is in safety area"),
        ),
      ).toBe(true);
    });
  });
});
