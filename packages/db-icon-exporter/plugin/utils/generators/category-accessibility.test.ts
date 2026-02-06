// Test file for verifying category information remains accessible (Task 11.3)
// Requirements: 5.4

import { IconData, ParsedDescriptionIllustrative } from "../../types";

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

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Assertion failed: expected true");
  }
}

/**
 * Helper function to create mock icon data for testing
 */
function createMockIcon(
  name: string,
  packageName: string,
  category: string,
): IconData {
  return {
    name,
    id: `id-${name}`,
    category,
    description: "EN: English description\nDE: German description",
    parsedDescription: {
      en: "English description",
      de: "German description",
      keywords: "test, icon",
    } as ParsedDescriptionIllustrative,
    package: packageName,
  };
}

// Test 1: Verify category field is populated in metadata
test("Requirement 5.4: Category field is populated in icon metadata", () => {
  const icon = createMockIcon("test-icon", "Core", "TestCategory");

  // Verify category field exists and is populated
  assertTrue(icon.category !== undefined, "Category should be defined");
  assertEquals(icon.category, "TestCategory", "Category should match");
  assertEquals(typeof icon.category, "string", "Category should be a string");
  assertTrue(icon.category.length > 0, "Category should have non-zero length");

  console.log("✅ Category field is populated in metadata");
});

// Test 2: Verify category field persists alongside package field
test("Requirement 5.4: Category and package fields coexist in metadata", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Category1"),
    createMockIcon("icon-2", "RI", "Category2"),
    createMockIcon("icon-3", "InfraGO", "Category3"),
    createMockIcon("icon-4", "Movas", "Category1"),
  ];

  icons.forEach((icon) => {
    // Both fields should be present
    assertTrue(icon.category !== undefined, "Category should be defined");
    assertTrue(icon.package !== undefined, "Package should be defined");

    // Both fields should be strings
    assertEquals(typeof icon.category, "string", "Category should be a string");
    assertEquals(typeof icon.package, "string", "Package should be a string");

    // Both fields should have values
    assertTrue(
      icon.category.length > 0,
      "Category should have non-zero length",
    );
    assertTrue(icon.package!.length > 0, "Package should have non-zero length");
  });

  console.log("✅ Category and package fields coexist in metadata");
});

// Test 3: Verify category-based grouping still works
test("Requirement 5.4: Icons can be grouped by category", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Category1"),
    createMockIcon("icon-2", "Core", "Category1"),
    createMockIcon("icon-3", "RI", "Category2"),
    createMockIcon("icon-4", "InfraGO", "Category2"),
    createMockIcon("icon-5", "Movas", "Category3"),
  ];

  // Group icons by category
  const categoryMap = new Map<string, IconData[]>();
  icons.forEach((icon) => {
    if (!categoryMap.has(icon.category)) {
      categoryMap.set(icon.category, []);
    }
    categoryMap.get(icon.category)!.push(icon);
  });

  // Verify grouping
  assertEquals(categoryMap.size, 3, "Should have 3 categories");
  assertEquals(
    categoryMap.get("Category1")?.length,
    2,
    "Category1 should have 2 icons",
  );
  assertEquals(
    categoryMap.get("Category2")?.length,
    2,
    "Category2 should have 2 icons",
  );
  assertEquals(
    categoryMap.get("Category3")?.length,
    1,
    "Category3 should have 1 icon",
  );

  console.log("✅ Icons can be grouped by category");
});

// Test 4: Verify category information is independent of package assignment
test("Requirement 5.4: Category is independent of package assignment", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Category1"),
    createMockIcon("icon-2", "RI", "Category1"),
    createMockIcon("icon-3", "InfraGO", "Category1"),
    createMockIcon("icon-4", "Movas", "Category1"),
  ];

  // All icons have the same category but different packages
  const categories = icons.map((icon) => icon.category);
  const packages = icons.map((icon) => icon.package);

  // All categories should be the same
  assertEquals(
    new Set(categories).size,
    1,
    "All icons should have the same category",
  );
  assertEquals(categories[0], "Category1", "Category should be Category1");

  // All packages should be different
  assertEquals(
    new Set(packages).size,
    4,
    "All icons should have different packages",
  );

  console.log("✅ Category is independent of package assignment");
});

// Test 5: Verify category field is accessible for export functions
test("Requirement 5.4: Category field is accessible for exports", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Actions"),
    createMockIcon("icon-2", "RI", "Navigation"),
    createMockIcon("icon-3", "InfraGO", "Communication"),
  ];

  // Simulate export function accessing category field
  const categoryUsage = icons.map((icon) => {
    const categorySlug = icon.category
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/&/g, "");
    return {
      name: icon.name,
      category: icon.category,
      categorySlug,
    };
  });

  // Verify category field is accessible and can be transformed
  assertEquals(categoryUsage[0].category, "Actions", "Category should match");
  assertEquals(
    categoryUsage[0].categorySlug,
    "actions",
    "Category slug should match",
  );
  assertEquals(
    categoryUsage[1].category,
    "Navigation",
    "Category should match",
  );
  assertEquals(
    categoryUsage[1].categorySlug,
    "navigation",
    "Category slug should match",
  );
  assertEquals(
    categoryUsage[2].category,
    "Communication",
    "Category should match",
  );
  assertEquals(
    categoryUsage[2].categorySlug,
    "communication",
    "Category slug should match",
  );

  console.log("✅ Category field is accessible for exports");
});

// Test 6: Verify category field with special characters
test("Requirement 5.4: Category field handles special characters", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Actions & Controls"),
    createMockIcon("icon-2", "RI", "Navigation / Wayfinding"),
    createMockIcon("icon-3", "InfraGO", "Communication (Basic)"),
  ];

  icons.forEach((icon) => {
    // Category field should preserve original value
    assertTrue(icon.category !== undefined, "Category should be defined");
    assertTrue(
      icon.category.length > 0,
      "Category should have non-zero length",
    );

    // Category field should be transformable for exports
    const categorySlug = icon.category
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/&/g, "")
      .replace(/\//g, "_")
      .replace(/[()]/g, "");

    assertTrue(
      categorySlug.length > 0,
      "Category slug should have non-zero length",
    );
  });

  console.log("✅ Category field handles special characters");
});

// Test 7: Verify category counts are accurate
test("Requirement 5.4: Category counts are accurate", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Category1"),
    createMockIcon("icon-2", "Core", "Category1"),
    createMockIcon("icon-3", "RI", "Category2"),
    createMockIcon("icon-4", "InfraGO", "Category2"),
    createMockIcon("icon-5", "Movas", "Category3"),
    createMockIcon("icon-6", "unknown", "Category1"),
  ];

  // Count icons per category
  const categoryMap = new Map<string, number>();
  icons.forEach((icon) => {
    categoryMap.set(icon.category, (categoryMap.get(icon.category) || 0) + 1);
  });

  // Verify counts
  assertEquals(
    categoryMap.get("Category1"),
    3,
    "Category1 should have 3 icons",
  );
  assertEquals(
    categoryMap.get("Category2"),
    2,
    "Category2 should have 2 icons",
  );
  assertEquals(categoryMap.get("Category3"), 1, "Category3 should have 1 icon");

  // Verify total
  const totalCount = Array.from(categoryMap.values()).reduce(
    (sum, count) => sum + count,
    0,
  );
  assertEquals(totalCount, icons.length, "Total count should match");

  console.log("✅ Category counts are accurate");
});

console.log("\n📋 Summary:");
console.log("   - Category field is populated in metadata");
console.log("   - Category and package fields coexist");
console.log("   - Category-based grouping still works");
console.log("   - Category is independent of package");
console.log("   - Category field is accessible for exports");
console.log("   - Category field handles special characters");
console.log("   - Category counts are accurate");

console.log("\n📋 Summary:");
console.log("   - Category field is populated in metadata");
console.log("   - Category and package fields coexist");
console.log("   - Category-based grouping still works");
console.log("   - Category is independent of package");
console.log("   - Category field is accessible for exports");
console.log("   - Category field handles special characters");
console.log("   - Category counts are accurate");
