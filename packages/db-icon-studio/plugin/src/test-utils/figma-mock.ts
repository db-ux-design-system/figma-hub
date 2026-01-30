/**
 * Mock Figma API for testing
 *
 * Provides minimal mock implementations of Figma API functions
 * needed for testing workflows.
 */

// Mock figma global
export const mockFigma = {
  mixed: Symbol("mixed"),

  flatten: async (nodes: any[], parent?: any): Promise<any> => {
    // Mock implementation - just return the first node
    return nodes[0];
  },

  variables: {
    getVariableByIdAsync: async (id: string): Promise<any> => {
      // Mock implementation - return a mock variable
      if (id.includes("not-found")) {
        return null;
      }
      return {
        id,
        name: `Mock Variable ${id}`,
        resolvedType: "COLOR",
      };
    },
  },

  ui: {
    postMessage: (message: any) => {
      // Mock implementation - do nothing
    },
  },

  currentPage: {
    selection: [] as any[],
  },

  on: (event: string, callback: () => void) => {
    // Mock implementation - do nothing
  },

  showUI: (html: string, options?: any) => {
    // Mock implementation - do nothing
  },
};

/**
 * Setup Figma mock in global scope
 */
export function setupFigmaMock() {
  (global as any).figma = mockFigma;
}

/**
 * Cleanup Figma mock from global scope
 */
export function cleanupFigmaMock() {
  delete (global as any).figma;
}
