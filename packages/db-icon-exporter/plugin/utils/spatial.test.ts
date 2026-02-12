// utils/spatial.test.ts
// Manual tests for spatial utility functions
// TODO: Integrate with a proper testing framework (e.g., Jest, Vitest)

import { calculateOverlap } from "./spatial";
import { Bounds } from "../types";

/**
 * Simple test runner for manual verification
 */
function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(error);
  }
}

function assertEquals(actual: number, expected: number, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${expected}, got ${actual}`,
    );
  }
}

// Test Suite: calculateOverlap
console.log("\n=== Testing calculateOverlap ===\n");

// Test 1: No overlap - rectangles completely separate
test("No overlap - rectangles completely separate", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 20, y: 20, width: 10, height: 10 };
  assertEquals(
    calculateOverlap(icon, frame),
    0,
    "Should return 0 for no overlap",
  );
});

// Test 2: Touching edges - no actual overlap
test("Touching edges horizontally - no overlap", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 10, y: 0, width: 10, height: 10 };
  assertEquals(
    calculateOverlap(icon, frame),
    0,
    "Should return 0 for touching edges",
  );
});

// Test 3: Touching edges vertically - no actual overlap
test("Touching edges vertically - no overlap", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 0, y: 10, width: 10, height: 10 };
  assertEquals(
    calculateOverlap(icon, frame),
    0,
    "Should return 0 for touching edges",
  );
});

// Test 4: Partial overlap
test("Partial overlap", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 5, y: 5, width: 10, height: 10 };
  // Overlap area: width = 5 (from x=5 to x=10), height = 5 (from y=5 to y=10)
  assertEquals(
    calculateOverlap(icon, frame),
    25,
    "Should return 25 for 5x5 overlap",
  );
});

// Test 5: Icon fully contained in frame
test("Icon fully contained in frame", () => {
  const icon: Bounds = { x: 5, y: 5, width: 10, height: 10 };
  const frame: Bounds = { x: 0, y: 0, width: 20, height: 20 };
  // Overlap area equals icon area
  assertEquals(
    calculateOverlap(icon, frame),
    100,
    "Should return icon area (100)",
  );
});

// Test 6: Frame fully contained in icon
test("Frame fully contained in icon", () => {
  const icon: Bounds = { x: 0, y: 0, width: 20, height: 20 };
  const frame: Bounds = { x: 5, y: 5, width: 10, height: 10 };
  // Overlap area equals frame area
  assertEquals(
    calculateOverlap(icon, frame),
    100,
    "Should return frame area (100)",
  );
});

// Test 7: Exact overlap - same bounds
test("Exact overlap - same bounds", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  assertEquals(
    calculateOverlap(icon, frame),
    100,
    "Should return 100 for exact overlap",
  );
});

// Test 8: Overlap with negative coordinates
test("Overlap with negative coordinates", () => {
  const icon: Bounds = { x: -10, y: -10, width: 20, height: 20 };
  const frame: Bounds = { x: -5, y: -5, width: 10, height: 10 };
  // Frame is fully contained in icon
  assertEquals(
    calculateOverlap(icon, frame),
    100,
    "Should handle negative coordinates",
  );
});

// Test 9: Small overlap - 1x1 pixel
test("Small overlap - 1x1 pixel", () => {
  const icon: Bounds = { x: 0, y: 0, width: 10, height: 10 };
  const frame: Bounds = { x: 9, y: 9, width: 10, height: 10 };
  // Overlap area: 1x1 pixel at corner
  assertEquals(
    calculateOverlap(icon, frame),
    1,
    "Should return 1 for 1x1 overlap",
  );
});

// Test 10: Overlap with floating point coordinates
test("Overlap with floating point coordinates", () => {
  const icon: Bounds = { x: 0.5, y: 0.5, width: 10.5, height: 10.5 };
  const frame: Bounds = { x: 5.5, y: 5.5, width: 10.5, height: 10.5 };
  // Overlap area: width = 5.5, height = 5.5
  const expected = 5.5 * 5.5;
  assertEquals(
    calculateOverlap(icon, frame),
    expected,
    "Should handle floating point",
  );
});

// Test 11: Icon to the left of frame - no overlap
test("Icon to the left of frame - no overlap", () => {
  const icon: Bounds = { x: 0, y: 5, width: 5, height: 10 };
  const frame: Bounds = { x: 10, y: 5, width: 10, height: 10 };
  assertEquals(calculateOverlap(icon, frame), 0, "Should return 0");
});

// Test 12: Icon above frame - no overlap
test("Icon above frame - no overlap", () => {
  const icon: Bounds = { x: 5, y: 0, width: 10, height: 5 };
  const frame: Bounds = { x: 5, y: 10, width: 10, height: 10 };
  assertEquals(calculateOverlap(icon, frame), 0, "Should return 0");
});

console.log("\n=== All tests completed ===\n");

// Test Suite: detectPackageFrames
console.log("\n=== Testing detectPackageFrames ===\n");

// Note: These tests require a Figma environment with mock PageNode objects
// For now, we document the expected behavior

console.log("📝 detectPackageFrames test scenarios:");
console.log(
  "  1. Should detect all frames with names: Core, RI, InfraGO, Movas",
);
console.log("  2. Should extract x, y, width, height for each frame");
console.log("  3. Should return empty array if no package frames found");
console.log("  4. Should ignore frames with similar but non-matching names");
console.log("  5. Should handle pages with multiple package frames");
console.log("\n⚠️  Note: Full tests require Figma plugin environment");
console.log("   These will be implemented in property-based tests (task 3.2)");

console.log("\n=== detectPackageFrames tests documented ===\n");

// Test Suite: assignPackage
console.log("\n=== Testing assignPackage ===\n");

// Note: These tests require mock icon and package frame objects
// We'll create simplified test cases to verify the logic

console.log("📝 assignPackage test scenarios:");
console.log("  1. Should assign icon to single overlapping package");
console.log(
  "  2. Should assign to package with maximum overlap when multiple overlaps exist",
);
console.log(
  "  3. Should return 'unknown' when icon doesn't overlap any package",
);
console.log("  4. Should use alphabetical tiebreaker for equal overlaps");
console.log("  5. Should return 'unknown' when no package frames exist");

// We can test the logic with mock data structures
import { assignPackage } from "./spatial";
import { PackageFrame } from "../types";

// Mock icon object for testing
function createMockIcon(
  x: number,
  y: number,
  width: number,
  height: number,
): ComponentSetNode {
  return {
    x,
    y,
    width,
    height,
    type: "COMPONENT_SET",
    name: "test-icon",
  } as ComponentSetNode;
}

// Test 1: Single overlapping package
test("assignPackage: Single overlapping package", () => {
  const icon = createMockIcon(5, 5, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "Core", x: 0, y: 0, width: 20, height: 20 },
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "Core") {
    throw new Error(`Expected "Core", got "${result}"`);
  }
});

// Test 2: Multiple overlaps - should pick maximum
test("assignPackage: Maximum overlap selection", () => {
  const icon = createMockIcon(5, 5, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "Core", x: 0, y: 0, width: 10, height: 10 }, // Small overlap (5x5 = 25)
    { name: "RI", x: 0, y: 0, width: 20, height: 20 }, // Full overlap (10x10 = 100)
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "RI") {
    throw new Error(`Expected "RI" (larger overlap), got "${result}"`);
  }
});

// Test 3: No overlap - should return "unknown"
test("assignPackage: No overlap returns 'unknown'", () => {
  const icon = createMockIcon(50, 50, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "Core", x: 0, y: 0, width: 20, height: 20 },
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "unknown") {
    throw new Error(`Expected "unknown", got "${result}"`);
  }
});

// Test 4: Equal overlaps - alphabetical tiebreaker
test("assignPackage: Alphabetical tiebreaker for equal overlaps", () => {
  const icon = createMockIcon(10, 10, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "RI", x: 5, y: 5, width: 20, height: 20 }, // Same overlap
    { name: "Core", x: 5, y: 5, width: 20, height: 20 }, // Same overlap, but "Core" < "RI"
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "Core") {
    throw new Error(`Expected "Core" (alphabetically first), got "${result}"`);
  }
});

// Test 5: No package frames - should return "unknown"
test("assignPackage: No package frames returns 'unknown'", () => {
  const icon = createMockIcon(5, 5, 10, 10);
  const packageFrames: PackageFrame[] = [];
  const result = assignPackage(icon, packageFrames);
  if (result !== "unknown") {
    throw new Error(`Expected "unknown", got "${result}"`);
  }
});

// Test 6: Partial overlap with multiple packages
test("assignPackage: Partial overlap with multiple packages", () => {
  const icon = createMockIcon(15, 15, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "Core", x: 0, y: 0, width: 20, height: 20 }, // Overlap: 5x5 = 25
    { name: "RI", x: 10, y: 10, width: 20, height: 20 }, // Overlap: 10x10 = 100
    { name: "Movas", x: 20, y: 20, width: 20, height: 20 }, // Overlap: 5x5 = 25
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "RI") {
    throw new Error(`Expected "RI" (maximum overlap), got "${result}"`);
  }
});

// Test 7: Icon touching edge of package frame (no overlap)
test("assignPackage: Icon touching edge returns 'unknown'", () => {
  const icon = createMockIcon(20, 0, 10, 10);
  const packageFrames: PackageFrame[] = [
    { name: "Core", x: 0, y: 0, width: 20, height: 20 },
  ];
  const result = assignPackage(icon, packageFrames);
  if (result !== "unknown") {
    throw new Error(`Expected "unknown" (touching edge), got "${result}"`);
  }
});

console.log("\n=== All assignPackage tests completed ===\n");
