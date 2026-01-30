/**
 * Union Processor Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { UnionProcessor } from "./union-processor.js";

// Mock Figma API
const mockFigma = {
  currentPage: {
    selection: [] as any[],
  },
  flatten: vi.fn(),
};

(global as any).figma = mockFigma;

describe("UnionProcessor", () => {
  let processor: UnionProcessor;

  beforeEach(() => {
    processor = new UnionProcessor();
    vi.clearAllMocks();
  });

  describe("union", () => {
    it("should process all variants in a component set", async () => {
      const mockVariant1 = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [
              {
                type: "VECTOR",
                name: "Vector 1",
                parent: null,
                absoluteTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
              {
                type: "VECTOR",
                name: "Vector 2",
                parent: null,
                absoluteTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        ],
      };

      const mockVariant2 = {
        name: "Size=24, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [
              {
                type: "VECTOR",
                name: "Vector",
                parent: null,
                absoluteTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        ],
      };

      const mockComponentSet = {
        children: [mockVariant1, mockVariant2],
      } as any;

      // Setup parent references
      mockVariant1.children[0].children[0].parent = mockVariant1.children[0];
      mockVariant1.children[0].children[1].parent = mockVariant1.children[0];
      mockVariant2.children[0].children[0].parent = mockVariant2.children[0];

      // Mock flatten to return a new vector
      mockFigma.flatten.mockReturnValue({
        name: "",
        x: 0,
        y: 0,
      });

      await processor.union(mockComponentSet);

      // Should call flatten for both variants (variant1 has 2 children, variant2 has 1)
      expect(mockFigma.flatten).toHaveBeenCalledTimes(2);
    });

    it("should skip variants with no container", async () => {
      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await processor.union(mockComponentSet);

      expect(mockFigma.flatten).not.toHaveBeenCalled();
    });

    it("should skip variants with no children", async () => {
      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [],
          },
        ],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      await processor.union(mockComponentSet);

      expect(mockFigma.flatten).not.toHaveBeenCalled();
    });

    it("should flatten single child to 'Vector'", async () => {
      const mockVector = {
        type: "VECTOR",
        name: "Path",
        parent: null,
        absoluteTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
      };

      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [mockVector],
          },
        ],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      mockVector.parent = mockVariant.children[0];

      // Mock flatten to return a new vector
      mockFigma.flatten.mockReturnValue({
        name: "",
        x: 0,
        y: 0,
      });

      await processor.union(mockComponentSet);

      // Should call flatten even for single child (might be a group with nested vectors)
      expect(mockFigma.flatten).toHaveBeenCalledTimes(1);
    });

    it("should handle flatten errors gracefully", async () => {
      const mockVariant = {
        name: "Size=32, Variant=(Def) Outlined",
        children: [
          {
            type: "FRAME",
            name: "Container",
            children: [
              {
                type: "VECTOR",
                name: "Vector 1",
                parent: null,
                absoluteTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
              {
                type: "VECTOR",
                name: "Vector 2",
                parent: null,
                absoluteTransform: [
                  [1, 0, 0],
                  [0, 1, 0],
                ],
              },
            ],
          },
        ],
      };

      const mockComponentSet = {
        children: [mockVariant],
      } as any;

      mockVariant.children[0].children[0].parent = mockVariant.children[0];
      mockVariant.children[0].children[1].parent = mockVariant.children[0];

      // Mock flatten to throw error
      mockFigma.flatten.mockImplementation(() => {
        throw new Error("Flatten failed");
      });

      // Should not throw, just log warning
      await expect(processor.union(mockComponentSet)).resolves.not.toThrow();
    });
  });
});
