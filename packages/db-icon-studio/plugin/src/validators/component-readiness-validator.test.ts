/**
 * Component Readiness Validator Tests
 *
 * Tests for the ComponentReadinessValidator which validates:
 * - Outline stroked (no strokes, only fills)
 * - Unified (no overlapping paths)
 * - Flattened (single vector node, no groups)
 * - Proper variant structure
 * - Size validation
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ComponentReadinessValidator } from "./component-readiness-validator.js";

describe("ComponentReadinessValidator", () => {
  let validator: ComponentReadinessValidator;

  beforeEach(() => {
    validator = new ComponentReadinessValidator();
  });

  describe("validate - single component", () => {
    it("should pass validation for a properly prepared component", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail if container is empty", () => {
      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Empty container");
    });

    it("should fail if multiple vectors exist (not flattened)", () => {
      const mockVector1 = {
        type: "VECTOR",
        name: "Vector 1",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockVector2 = {
        type: "VECTOR",
        name: "Vector 2",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector1, mockVector2],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Multiple vectors");
    });

    it("should fail if vector has strokes (not outline stroked)", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokeWeight: 2,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Strokes not converted");
    });

    it("should fail if no vector content exists", () => {
      const mockFrame = {
        type: "FRAME",
        name: "Empty Frame",
        children: [],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockFrame],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("No vector content");
    });

    it("should detect multiple separate vectors needing unify and flatten", () => {
      const mockVector1 = {
        type: "VECTOR",
        name: "Path 1",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockVector2 = {
        type: "VECTOR",
        name: "Path 2",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockVector3 = {
        type: "VECTOR",
        name: "Path 3",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockVector1, mockVector2, mockVector3],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("3 separate vectors");
      expect(result.errors[0].message).toContain("Unify");
      expect(result.errors[0].message).toContain("Flatten");
    });

    it("should handle black and red vectors separately (illustrative icons)", () => {
      const mockBlackVector = {
        type: "VECTOR",
        name: "Black",
        fills: [{ type: "SOLID", color: { r: 0.05, g: 0.05, b: 0.05 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockRedVector = {
        type: "VECTOR",
        name: "Red",
        fills: [{ type: "SOLID", color: { r: 0.9, g: 0.1, b: 0.1 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockBlackVector, mockRedVector],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=64, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("2 separate vectors");
      // Should only suggest Flatten (not Unify) for different colors
      expect(result.errors[0].message).toContain("Flatten");
      expect(result.errors[0].message).not.toContain("Unify");
    });

    it("should warn about boolean operations", () => {
      const mockBooleanOp = {
        type: "BOOLEAN_OPERATION",
        name: "Union",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
        children: [],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockBooleanOp],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(true); // Warnings don't block
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      expect(result.warnings![0].message).toContain("Boolean operation");
    });

    it("should handle component without container frame", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail if vector has no fills", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("No fills found");
    });
  });

  describe("validateComponentSet", () => {
    it("should pass validation for a properly prepared component set", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant32 = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockVariant24 = {
        type: "COMPONENT",
        name: "Size=24, Variant=(Def) Outlined",
        children: [{ ...mockContainer }],
      };

      const mockVariant20 = {
        type: "COMPONENT",
        name: "Size=20, Variant=(Def) Outlined",
        children: [{ ...mockContainer }],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant32, mockVariant24, mockVariant20],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail if duplicate variants exist", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant1 = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockVariant2 = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined", // Duplicate
        children: [{ ...mockContainer }],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant1, mockVariant2],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Duplicate variant")),
      ).toBe(true);
    });

    it("should fail if too many variants per size exist", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant1 = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockVariant2 = {
        type: "COMPONENT",
        name: "Size=32, Variant=Filled",
        children: [{ ...mockContainer }],
      };

      const mockVariant3 = {
        type: "COMPONENT",
        name: "Size=32, Variant=Custom",
        children: [{ ...mockContainer }],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant1, mockVariant2, mockVariant3],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Too many variants")),
      ).toBe(true);
    });

    it("should fail if invalid sizes exist", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant16 = {
        type: "COMPONENT",
        name: "Size=16, Variant=(Def) Outlined", // Invalid size (should be 32, 24, or 20)
        children: [mockContainer],
      };

      const mockVariant32 = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [{ ...mockContainer }],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant16, mockVariant32],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Invalid icon sizes")),
      ).toBe(true);
      expect(result.errors.some((e) => e.message.includes("16px"))).toBe(true);
    });

    it("should add preparation steps hint for functional icons with readiness errors", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], // Has strokes
        strokeWeight: 2,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain(
        "Please prepare your icon manually",
      );
      expect(result.errors[0].message).toContain("Outline Stroke");
      expect(result.errors[0].message).toContain("Boolean Groups > Union");
      expect(result.errors[0].message).toContain("Flatten Selection");
    });

    it("should add illustrative-specific preparation steps for illustrative icons", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }], // Has strokes
        strokeWeight: 2,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant = {
        type: "COMPONENT",
        name: "Size=64, Variant=(Def) Outlined", // 64px = illustrative
        children: [mockContainer],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test_icon",
        children: [mockVariant],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("Select all black vectors");
      expect(result.errors[0].message).toContain("Select all red vectors");
      expect(result.errors[0].message).toContain(
        "Process black and red separately",
      );
    });

    it("should validate all variants in the component set", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant32Good = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockVariant24Bad = {
        type: "COMPONENT",
        name: "Size=24, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [], // Empty container
          },
        ],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant32Good, mockVariant24Bad],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("Empty container")),
      ).toBe(true);
    });

    it("should handle component set with both Outlined and Filled variants", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
      };

      const mockVariant32Outlined = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      };

      const mockVariant32Filled = {
        type: "COMPONENT",
        name: "Size=32, Variant=Filled",
        children: [{ ...mockContainer }],
      };

      const mockComponentSet = {
        type: "COMPONENT_SET",
        name: "test-icon",
        children: [mockVariant32Outlined, mockVariant32Filled],
      } as any;

      const result = validator.validateComponentSet(mockComponentSet);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("color detection", () => {
    it("should detect black color (r<0.2, g<0.2, b<0.2)", () => {
      const mockBlackVector = {
        type: "VECTOR",
        name: "Black",
        fills: [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockRedVector = {
        type: "VECTOR",
        name: "Red",
        fills: [{ type: "SOLID", color: { r: 0.9, g: 0.1, b: 0.1 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockBlackVector, mockRedVector],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=64, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      // Should detect both colors and only suggest Flatten (not Unify)
      expect(result.errors[0].message).toContain("Flatten");
      expect(result.errors[0].message).not.toContain("Unify");
    });

    it("should detect red color (r>0.7, g<0.3, b<0.3)", () => {
      const mockRedVector = {
        type: "VECTOR",
        name: "Red",
        fills: [{ type: "SOLID", color: { r: 0.8, g: 0.2, b: 0.2 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockBlackVector = {
        type: "VECTOR",
        name: "Black",
        fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockRedVector, mockBlackVector],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=64, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      // Should detect both colors
      expect(result.errors[0].message).toContain("Flatten");
      expect(result.errors[0].message).not.toContain("Unify");
    });

    it("should not detect orange as red (g>0.3)", () => {
      const mockOrangeVector = {
        type: "VECTOR",
        name: "Orange",
        fills: [{ type: "SOLID", color: { r: 0.9, g: 0.5, b: 0.1 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockBlackVector = {
        type: "VECTOR",
        name: "Black",
        fills: [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockOrangeVector, mockBlackVector],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=64, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      // Should suggest both Unify and Flatten (not detected as black+red)
      expect(result.errors[0].message).toContain("Unify");
      expect(result.errors[0].message).toContain("Flatten");
    });
  });

  describe("edge cases", () => {
    it("should handle nested groups with vectors", () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockNestedGroup = {
        type: "GROUP",
        name: "Nested Group",
        children: [mockVector],
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockNestedGroup],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      // Should find the nested vector
      expect(result.isValid).toBe(true);
    });

    it("should handle mixed vector types (VECTOR, STAR, ELLIPSE, etc.)", () => {
      const mockStar = {
        type: "STAR",
        name: "Star",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockEllipse = {
        type: "ELLIPSE",
        name: "Ellipse",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        strokes: [],
        strokeWeight: 0,
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockStar, mockEllipse],
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockGroup],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockContainer],
      } as any;

      const result = validator.validate(mockComponent);

      // Should detect multiple vectors needing flatten
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("2 separate vectors");
    });

    it("should handle component with no children", () => {
      const mockComponent = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        children: [],
      } as any;

      const result = validator.validate(mockComponent);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("Empty container");
    });
  });
});
