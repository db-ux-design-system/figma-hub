import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.parent.postMessage for Figma plugin communication
global.window.parent = {
  postMessage: vi.fn(),
} as any;

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock document.execCommand for clipboard fallback
document.execCommand = vi.fn(() => true);
