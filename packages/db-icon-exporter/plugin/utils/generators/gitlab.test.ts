// utils/generators/gitlab.test.ts
// Manual tests for GitLab generator utility functions
// TODO: Integrate with a proper testing framework (e.g., Jest, Vitest)

import { groupByPackage } from "./gitlab";
import { IconData } from "../../types";

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

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${expected}, got ${actual}`,
    );
  }
}

function assertArrayEquals(actual: any[], expected: any[], message?: string) {
  if (actual.length !== expected.length) {
    throw new Error(
      `${message || "Array length mismatch"}: expected length ${expected.length}, got ${actual.length}`,
    );
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(
        `${message || "Array element mismatch"} at index ${i}: expected ${expected[i]}, got ${actual[i]}`,
      );
    }
  }
}

/**
 * Helper function to create mock IconData for testing
 */
function createMockIcon(
  name: string,
  packageName: string,
  category: string = "TestCategory",
): IconData {
  return {
    name,
    id: `id-${name}`,
    category,
    description: `Description for ${name}`,
    parsedDescription: {
      en: `English description for ${name}`,
      de: `German description for ${name}`,
      keywords: "test",
    },
    package: packageName,
  };
}

// Test Suite: groupByPackage
console.log("\n=== Testing groupByPackage ===\n");

// Test 1: Empty array should return empty map
test("Empty array returns empty map", () => {
  const result = groupByPackage([]);
  assertEquals(result.size, 0, "Should return empty map for empty array");
});

// Test 2: Single icon should create one group
test("Single icon creates one group", () => {
  const icons = [createMockIcon("icon1", "Core")];
  const result = groupByPackage(icons);

  assertEquals(result.size, 1, "Should have one package group");
  assertEquals(result.has("Core"), true, "Should have Core package");
  assertEquals(result.get("Core")!.length, 1, "Core should have 1 icon");
  assertEquals(result.get("Core")![0].name, "icon1", "Should contain icon1");
});

// Test 3: Multiple icons in same package
test("Multiple icons in same package", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "Core"),
    createMockIcon("icon3", "Core"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 1, "Should have one package group");
  assertEquals(result.get("Core")!.length, 3, "Core should have 3 icons");

  const iconNames = result.get("Core")!.map((icon) => icon.name);
  assertArrayEquals(
    iconNames,
    ["icon1", "icon2", "icon3"],
    "Should contain all three icons in order",
  );
});

// Test 4: Icons distributed across multiple packages
test("Icons distributed across multiple packages", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "RI"),
    createMockIcon("icon3", "InfraGO"),
    createMockIcon("icon4", "Movas"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 4, "Should have four package groups");
  assertEquals(result.has("Core"), true, "Should have Core package");
  assertEquals(result.has("RI"), true, "Should have RI package");
  assertEquals(result.has("InfraGO"), true, "Should have InfraGO package");
  assertEquals(result.has("Movas"), true, "Should have Movas package");

  assertEquals(
    result.get("Core")!.length,
    1,
    "Each package should have 1 icon",
  );
  assertEquals(result.get("RI")!.length, 1, "Each package should have 1 icon");
  assertEquals(
    result.get("InfraGO")!.length,
    1,
    "Each package should have 1 icon",
  );
  assertEquals(
    result.get("Movas")!.length,
    1,
    "Each package should have 1 icon",
  );
});

// Test 5: Mixed distribution with multiple icons per package
test("Mixed distribution with multiple icons per package", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "Core"),
    createMockIcon("icon3", "RI"),
    createMockIcon("icon4", "RI"),
    createMockIcon("icon5", "RI"),
    createMockIcon("icon6", "InfraGO"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 3, "Should have three package groups");
  assertEquals(result.get("Core")!.length, 2, "Core should have 2 icons");
  assertEquals(result.get("RI")!.length, 3, "RI should have 3 icons");
  assertEquals(result.get("InfraGO")!.length, 1, "InfraGO should have 1 icon");
});

// Test 6: Icons with "unknown" package
test("Icons with 'unknown' package", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "unknown"),
    createMockIcon("icon3", "unknown"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 2, "Should have two package groups");
  assertEquals(result.has("Core"), true, "Should have Core package");
  assertEquals(result.has("unknown"), true, "Should have unknown package");
  assertEquals(result.get("Core")!.length, 1, "Core should have 1 icon");
  assertEquals(result.get("unknown")!.length, 2, "unknown should have 2 icons");
});

// Test 7: Icons with undefined package field (should default to "unknown")
test("Icons with undefined package field default to 'unknown'", () => {
  const icon: IconData = {
    name: "icon1",
    id: "id-icon1",
    category: "TestCategory",
    description: "Test description",
    parsedDescription: {
      en: "English description",
      de: "German description",
      keywords: "test",
    },
    // package field is undefined
  };

  const result = groupByPackage([icon]);

  assertEquals(result.size, 1, "Should have one package group");
  assertEquals(result.has("unknown"), true, "Should have unknown package");
  assertEquals(result.get("unknown")!.length, 1, "unknown should have 1 icon");
});

// Test 8: Icons from different categories in same package
test("Icons from different categories in same package", () => {
  const icons = [
    createMockIcon("icon1", "Core", "Category1"),
    createMockIcon("icon2", "Core", "Category2"),
    createMockIcon("icon3", "Core", "Category3"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 1, "Should have one package group");
  assertEquals(
    result.get("Core")!.length,
    3,
    "Core should have 3 icons from different categories",
  );

  const categories = result.get("Core")!.map((icon) => icon.category);
  assertArrayEquals(
    categories,
    ["Category1", "Category2", "Category3"],
    "Should preserve category information",
  );
});

// Test 9: Large dataset with all packages
test("Large dataset with all packages", () => {
  const icons: IconData[] = [];
  const packages = ["Core", "RI", "InfraGO", "Movas", "unknown"];

  // Create 10 icons per package
  packages.forEach((pkg) => {
    for (let i = 1; i <= 10; i++) {
      icons.push(createMockIcon(`${pkg}-icon${i}`, pkg));
    }
  });

  const result = groupByPackage(icons);

  assertEquals(result.size, 5, "Should have five package groups");
  packages.forEach((pkg) => {
    assertEquals(result.has(pkg), true, `Should have ${pkg} package`);
    assertEquals(result.get(pkg)!.length, 10, `${pkg} should have 10 icons`);
  });
});

// Test 10: Verify original array is not modified
test("Original array is not modified", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "RI"),
  ];
  const originalLength = icons.length;
  const originalFirstIcon = icons[0];

  const result = groupByPackage(icons);

  assertEquals(
    icons.length,
    originalLength,
    "Original array length should not change",
  );
  assertEquals(
    icons[0],
    originalFirstIcon,
    "Original array elements should not change",
  );
});

// Test 11: Icons with same name in different packages
test("Icons with same name in different packages", () => {
  const icons = [
    createMockIcon("duplicate-icon", "Core"),
    createMockIcon("duplicate-icon", "RI"),
    createMockIcon("duplicate-icon", "InfraGO"),
  ];
  const result = groupByPackage(icons);

  assertEquals(result.size, 3, "Should have three package groups");
  assertEquals(
    result.get("Core")![0].name,
    "duplicate-icon",
    "Core should have duplicate-icon",
  );
  assertEquals(
    result.get("RI")![0].name,
    "duplicate-icon",
    "RI should have duplicate-icon",
  );
  assertEquals(
    result.get("InfraGO")![0].name,
    "duplicate-icon",
    "InfraGO should have duplicate-icon",
  );
});

// Test 12: Verify Map preserves insertion order (icons within each package)
test("Map preserves icon order within each package", () => {
  const icons = [
    createMockIcon("icon-z", "Core"),
    createMockIcon("icon-a", "Core"),
    createMockIcon("icon-m", "Core"),
  ];
  const result = groupByPackage(icons);

  const coreIcons = result.get("Core")!;
  assertEquals(coreIcons[0].name, "icon-z", "First icon should be icon-z");
  assertEquals(coreIcons[1].name, "icon-a", "Second icon should be icon-a");
  assertEquals(coreIcons[2].name, "icon-m", "Third icon should be icon-m");
});

console.log("\n=== All groupByPackage tests completed ===\n");
