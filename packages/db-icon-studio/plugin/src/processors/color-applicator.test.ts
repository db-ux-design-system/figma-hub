/**
 * Color Applicator Tests
 *
 * Tests for the ColorApplicator which handles:
 * - Applying color variables to icon fills
 * - Functional and illustrative icon color application
 * - Error handling for missing variables
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ColorApplicator } from "./color-applicator.js";
import type { ColorVariableConfig } from "../types/index.js";

// Mock Figma API
const mockVariable = {
  id: "var-123",
  name: "Mock Color Variable",
  resolvedType: "COLOR",
};

const mockFigma = {
  variables: {
    importVariableByKeyAsync: vi.fn(),
  },
  mixed: Symbol("mixed"),
};

(global as any).figma = mockFigma;

describe("ColorApplicator", () => {
  let config: ColorVariableConfig;

  beforeEach(() => {
    config = {
      functional: "functional-color-key",
      illustrative: "illustrative-color-key",
    };

    vi.clearAllMocks();

    // Default: successful variable import
    mockFigma.variables.importVariableByKeyAsync.mockResolvedValue(
      mockVariable,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Functional Icons", () => {
    it("should apply color variable to functional icon", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
          },
        ],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // Should import functional color variable
      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "functional-color-key",
      );

      // Should bind variable to fill
      expect(mockVector.fills[0]).toHaveProperty("boundVariables");
      expect(mockVector.fills[0].boundVariables).toEqual({
        color: {
          type: "VARIABLE_ALIAS",
          id: "var-123",
        },
      });
    });

    it("should apply color to all variants in component set", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector1 = {
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
      };

      const mockVector2 = {
        name: "Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
      };

      const mockVariant1 = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector1],
      };

      const mockVariant2 = {
        name: "Size=24, Variant=(Def) Outlined",
        children: [mockVector2],
      };

      const mockComponentSet = {
        children: [mockVariant1, mockVariant2],
      } as any;

      await applicator.apply(mockComponentSet);

      // Both vectors should have bound variables
      expect(mockVector1.fills[0].boundVariables).toBeDefined();
      expect(mockVector2.fills[0].boundVariables).toBeDefined();
    });

    it("should handle multiple fills in a vector", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: [
          { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
          { type: "SOLID", color: { r: 1, g: 1, b: 1 } },
        ],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // All fills should have bound variables
      expect(mockVector.fills[0].boundVariables).toBeDefined();
      expect(mockVector.fills[1].boundVariables).toBeDefined();
    });

    it("should skip non-SOLID fills", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: [
          { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
          { type: "GRADIENT_LINEAR", gradientStops: [] },
        ],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // Only SOLID fill should have bound variable
      expect(mockVector.fills[0].boundVariables).toBeDefined();
      expect(mockVector.fills[1]).not.toHaveProperty("boundVariables");
    });
  });

  describe("Illustrative Icons", () => {
    it("should apply color variable to illustrative icon", async () => {
      const applicator = new ColorApplicator("illustrative", config);

      const mockVector = {
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
          },
        ],
      };

      const mockVariant = {
        name: "Size=64, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // Should import illustrative color variable
      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "illustrative-color-key",
      );

      // Should bind variable to fill
      expect(mockVector.fills[0].boundVariables).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should throw error if color variable key is not configured", async () => {
      const invalidConfig = {
        functional: "",
        illustrative: "illustrative-color-key",
      };

      const applicator = new ColorApplicator("functional", invalidConfig);

      const mockComponentSet = {
        children: [],
      } as any;

      await expect(applicator.apply(mockComponentSet)).rejects.toThrow(
        "Color variable not configured for functional icons",
      );
    });

    it("should throw error if color variable is not found", async () => {
      mockFigma.variables.importVariableByKeyAsync.mockResolvedValue(null);

      const applicator = new ColorApplicator("functional", config);

      const mockComponentSet = {
        children: [],
      } as any;

      await expect(applicator.apply(mockComponentSet)).rejects.toThrow(
        "Color variable not found",
      );
    });

    it("should throw error if variable import fails", async () => {
      mockFigma.variables.importVariableByKeyAsync.mockRejectedValue(
        new Error("Network error"),
      );

      const applicator = new ColorApplicator("functional", config);

      const mockComponentSet = {
        children: [],
      } as any;

      await expect(applicator.apply(mockComponentSet)).rejects.toThrow(
        "Failed to load color variable",
      );
    });

    it("should handle vectors with mixed fills gracefully", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: mockFigma.mixed, // Symbol for mixed fills
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      // Should not throw
      await expect(applicator.apply(mockComponentSet)).resolves.not.toThrow();
    });

    it("should handle vectors with no fills", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: [],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      // Should not throw
      await expect(applicator.apply(mockComponentSet)).resolves.not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty component set", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockComponentSet = {
        children: [],
      } as any;

      // Should not throw
      await expect(applicator.apply(mockComponentSet)).resolves.not.toThrow();
    });

    it("should handle variant with no children", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      // Should not throw
      await expect(applicator.apply(mockComponentSet)).resolves.not.toThrow();
    });

    it("should handle nested vectors", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockNestedVector = {
        name: "Nested Vector",
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
      };

      const mockGroup = {
        name: "Group",
        children: [mockNestedVector],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockGroup],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // Nested vector should have bound variable
      expect(mockNestedVector.fills[0].boundVariables).toBeDefined();
    });

    it("should preserve existing fill properties", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockVector = {
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            opacity: 0.5,
            visible: true,
            blendMode: "NORMAL",
          },
        ],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [mockVector],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await applicator.apply(mockComponentSet);

      // Should preserve other properties
      expect(mockVector.fills[0].opacity).toBe(0.5);
      expect(mockVector.fills[0].visible).toBe(true);
      expect(mockVector.fills[0].blendMode).toBe("NORMAL");
      expect(mockVector.fills[0].boundVariables).toBeDefined();
    });

    it("should handle multiple variants with different sizes", async () => {
      const applicator = new ColorApplicator("functional", config);

      const sizes = [32, 28, 24, 20, 16, 14, 12];
      const variants = sizes.map((size) => ({
        name: `Size=${size}, Variant=(Def) Outlined`,
        children: [
          {
            name: "Vector",
            fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
          },
        ],
      }));

      const mockComponentSet = {
        children: variants,
      } as any;

      await applicator.apply(mockComponentSet);

      // All variants should have bound variables
      variants.forEach((variant) => {
        expect(variant.children[0].fills[0].boundVariables).toBeDefined();
      });
    });
  });

  describe("Configuration", () => {
    it("should use correct variable key for functional icons", async () => {
      const applicator = new ColorApplicator("functional", config);

      const mockComponentSet = {
        children: [
          {
            name: "Size=32, Variant=(Def) Outlined",
            children: [
              {
                name: "Vector",
                fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
              },
            ],
          },
        ],
      } as any;

      await applicator.apply(mockComponentSet);

      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "functional-color-key",
      );
    });

    it("should use correct variable key for illustrative icons", async () => {
      const applicator = new ColorApplicator("illustrative", config);

      const mockComponentSet = {
        children: [
          {
            name: "Size=64, Variant=(Def) Outlined",
            children: [
              {
                name: "Vector",
                fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
              },
            ],
          },
        ],
      } as any;

      await applicator.apply(mockComponentSet);

      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "illustrative-color-key",
      );
    });

    it("should handle custom variable keys", async () => {
      const customConfig = {
        functional: "custom-functional-key",
        illustrative: "custom-illustrative-key",
      };

      const applicator = new ColorApplicator("functional", customConfig);

      const mockComponentSet = {
        children: [
          {
            name: "Size=32, Variant=(Def) Outlined",
            children: [
              {
                name: "Vector",
                fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
              },
            ],
          },
        ],
      } as any;

      await applicator.apply(mockComponentSet);

      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "custom-functional-key",
      );
    });
  });
});
