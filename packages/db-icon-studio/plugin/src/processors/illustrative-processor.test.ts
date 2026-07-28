/**
 * Illustrative Processor Tests
 *
 * Tests for the IllustrativeProcessor which handles:
 * - Color variable application to Vector Networks with mixed fills
 * - Black and red color detection
 * - Variable binding for illustrative icons
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { IllustrativeProcessor } from "./illustrative-processor.js";

// Mock Figma API
const mockBaseVariable = {
  id: "base-var-id",
  name: "Base Color",
  resolvedType: "COLOR",
};

const mockPulseVariable = {
  id: "pulse-var-id",
  name: "Pulse Color",
  resolvedType: "COLOR",
};

const mockFigma = {
  variables: {
    importVariableByKeyAsync: vi.fn(),
  },
};

(global as any).figma = mockFigma;

describe("IllustrativeProcessor", () => {
  let processor: IllustrativeProcessor;

  beforeEach(() => {
    processor = new IllustrativeProcessor();
    vi.clearAllMocks();

    // Default mock: both variables import successfully
    mockFigma.variables.importVariableByKeyAsync.mockImplementation(
      async (key: string) => {
        if (key === "497497bca9694f6004d1667de59f1a903b3cd3ef") {
          return mockBaseVariable;
        }
        if (key === "998998d67d3ebef6f2692db932bce69431b3d0cc") {
          return mockPulseVariable;
        }
        return null;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("process", () => {
    it("should process a valid illustrative icon component", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should import both color variables
      expect(
        mockFigma.variables.importVariableByKeyAsync,
      ).toHaveBeenCalledTimes(2);
      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "497497bca9694f6004d1667de59f1a903b3cd3ef",
      );
      expect(mockFigma.variables.importVariableByKeyAsync).toHaveBeenCalledWith(
        "998998d67d3ebef6f2692db932bce69431b3d0cc",
      );

      // Should set constraints to SCALE
      expect(mockVector.constraints).toEqual({
        horizontal: "SCALE",
        vertical: "SCALE",
      });

      // Should remove container fills
      expect(mockContainer.fills).toEqual([]);

      // Should ensure container is named "Container"
      expect(mockContainer.name).toBe("Container");
    });

    it("should throw error if component has no container", async () => {
      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [],
      } as any;

      await expect(processor.process(mockComponent)).rejects.toThrow(
        "Component has no container",
      );
    });

    it("should throw error if container has no children", async () => {
      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await expect(processor.process(mockComponent)).rejects.toThrow(
        "Container has no children",
      );
    });

    it("should throw error if no Vector layer found", async () => {
      const mockOtherLayer = {
        type: "RECTANGLE",
        name: "NotVector",
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockOtherLayer],
        layoutMode: "NONE",
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await expect(processor.process(mockComponent)).rejects.toThrow(
        "No Vector layer found in container",
      );
    });

    it("should remove Auto Layout from container if present", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "HORIZONTAL", // Has Auto Layout
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should remove Auto Layout
      expect(mockContainer.layoutMode).toBe("NONE");
    });

    it("should handle missing color variables gracefully", async () => {
      // Mock: variables fail to import
      mockFigma.variables.importVariableByKeyAsync.mockResolvedValue(null);

      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      // Should not throw, but log errors
      await expect(processor.process(mockComponent)).resolves.not.toThrow();
    });
  });

  describe("color detection and variable binding", () => {
    it("should bind black fills to base variable", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.05, g: 0.05, b: 0.05 }, // Black
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should bind to base variable
      expect(mockVector.fills[0]).toEqual({
        type: "SOLID",
        color: { r: 0, g: 0, b: 0 },
        boundVariables: {
          color: {
            type: "VARIABLE_ALIAS",
            id: "base-var-id",
          },
        },
      });
    });

    it("should bind red fills to pulse variable", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.8, g: 0.2, b: 0.2 }, // Red
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should bind to pulse variable
      expect(mockVector.fills[0]).toEqual({
        type: "SOLID",
        color: { r: 1, g: 0, b: 0 },
        boundVariables: {
          color: {
            type: "VARIABLE_ALIAS",
            id: "pulse-var-id",
          },
        },
      });
    });

    it("should handle mixed black and red fills", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.05, g: 0.05, b: 0.05 }, // Black
            visible: true,
          },
          {
            type: "SOLID",
            color: { r: 0.8, g: 0.2, b: 0.2 }, // Red
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should bind both fills to their respective variables
      expect(mockVector.fills[0].boundVariables).toEqual({
        color: {
          type: "VARIABLE_ALIAS",
          id: "base-var-id",
        },
      });
      expect(mockVector.fills[1].boundVariables).toEqual({
        color: {
          type: "VARIABLE_ALIAS",
          id: "pulse-var-id",
        },
      });
    });

    it("should keep non-black/red fills unchanged", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.5, g: 0.5, b: 0.5 }, // Gray (not black or red)
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should keep the fill unchanged (no boundVariables)
      expect(mockVector.fills[0]).toEqual({
        type: "SOLID",
        color: { r: 0.5, g: 0.5, b: 0.5 },
        visible: true,
      });
    });

    it("should skip invisible fills", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            visible: false, // Invisible
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should keep invisible fill unchanged
      expect(mockVector.fills[0]).toEqual({
        type: "SOLID",
        color: { r: 0, g: 0, b: 0 },
        visible: false,
      });
    });

    it("should handle Vector Networks with mixed fills", async () => {
      const mockVectorNetwork = {
        type: "VECTOR",
        name: "Vector",
        fills: Symbol("mixed"), // Symbol indicates Vector Network
        vectorNetwork: {
          regions: [
            {
              windingRule: "NONZERO",
              loops: [[0, 1, 2]],
              fills: [
                {
                  type: "SOLID",
                  color: { r: 0.05, g: 0.05, b: 0.05 }, // Black
                  visible: true,
                },
              ],
            },
            {
              windingRule: "NONZERO",
              loops: [[3, 4, 5]],
              fills: [
                {
                  type: "SOLID",
                  color: { r: 0.8, g: 0.2, b: 0.2 }, // Red
                  visible: true,
                },
              ],
            },
          ],
        },
        setVectorNetworkAsync: vi.fn(),
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVectorNetwork],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should call setVectorNetworkAsync with updated regions
      expect(mockVectorNetwork.setVectorNetworkAsync).toHaveBeenCalledTimes(1);

      const updatedNetwork =
        mockVectorNetwork.setVectorNetworkAsync.mock.calls[0][0];

      // Check that regions were updated with bound variables
      expect(updatedNetwork.regions[0].fills[0].boundVariables).toEqual({
        color: {
          type: "VARIABLE_ALIAS",
          id: "base-var-id",
        },
      });
      expect(updatedNetwork.regions[1].fills[0].boundVariables).toEqual({
        color: {
          type: "VARIABLE_ALIAS",
          id: "pulse-var-id",
        },
      });
    });
  });

  describe("color detection thresholds", () => {
    it("should detect pure black (r=0, g=0, b=0)", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      expect(mockVector.fills[0].boundVariables).toBeDefined();
      expect(mockVector.fills[0].boundVariables.color.id).toBe("base-var-id");
    });

    it("should detect dark gray as black (r=0.09, g=0.09, b=0.09)", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.09, g: 0.09, b: 0.09 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      expect(mockVector.fills[0].boundVariables.color.id).toBe("base-var-id");
    });

    it("should NOT detect medium gray as black (r=0.11, g=0.11, b=0.11)", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.11, g: 0.11, b: 0.11 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should not bind to any variable
      expect(mockVector.fills[0].boundVariables).toBeUndefined();
    });

    it("should detect bright red (r=0.9, g=0.1, b=0.1)", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.9, g: 0.1, b: 0.1 },
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      expect(mockVector.fills[0].boundVariables.color.id).toBe("pulse-var-id");
    });

    it("should NOT detect orange as red (r=0.9, g=0.5, b=0.1)", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0.9, g: 0.5, b: 0.1 }, // Orange (g > 0.3)
            visible: true,
          },
        ],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      await processor.process(mockComponent);

      // Should not bind to any variable
      expect(mockVector.fills[0].boundVariables).toBeUndefined();
    });
  });

  describe("recursive color application", () => {
    it("should apply colors to nested children", async () => {
      const mockNestedVector = {
        type: "VECTOR",
        name: "Nested Vector",
        fills: [
          {
            type: "SOLID",
            color: { r: 0, g: 0, b: 0 },
            visible: true,
          },
        ],
      };

      const mockGroup = {
        type: "GROUP",
        name: "Group",
        children: [mockNestedVector],
      };

      const mockVector = {
        type: "FRAME",
        name: "Vector",
        children: [mockGroup],
        constraints: { horizontal: "MIN", vertical: "MIN" },
      };

      const mockContainer = {
        type: "FRAME",
        name: "Container",
        children: [mockVector],
        layoutMode: "NONE",
        fills: [],
      };

      const mockComponent = {
        type: "COMPONENT",
        name: "test_icon",
        children: [mockContainer],
      } as any;

      // Note: This test assumes the Vector layer can have children
      // In practice, the processor looks for a node named "Vector"
      // For this test, we're testing the recursive logic
      mockVector.name = "Vector";

      await processor.process(mockComponent);

      // Should apply color to nested vector
      expect(mockNestedVector.fills[0].boundVariables).toBeDefined();
      expect(mockNestedVector.fills[0].boundVariables.color.id).toBe(
        "base-var-id",
      );
    });
  });
});
