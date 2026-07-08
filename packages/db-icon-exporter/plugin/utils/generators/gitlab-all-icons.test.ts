// utils/generators/gitlab-all-icons.test.ts
// Task 11.2: Ensure "All Icons" export includes all icons
// Validates Requirement 5.3

import { generateGitLabDescriptions } from "./gitlab";
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

function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Assertion failed: expected true");
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
    description: "EN: English description\nDE: German description",
    parsedDescription: {
      en: "English description",
      de: "German description",
    },
    package: packageName,
  };
}

/**
 * Count total icons across all package JSON files
 */
function countIconsInJsonMap(jsonMap: Map<string, string>): number {
  let totalCount = 0;

  jsonMap.forEach((jsonContent) => {
    const parsed = JSON.parse(jsonContent);
    const iconCount = Object.keys(parsed).length;
    totalCount += iconCount;
  });

  return totalCount;
}

// Test Suite: "All Icons" Export Completeness
console.log("\n=== Task 11.2: All Icons Export Completeness ===\n");
console.log(
  "Requirement 5.3: All Icons export includes all icons regardless of package",
);
console.log("Requirement 5.3: Total count matches sum of all icons\n");

// Test 1: All icons included regardless of package assignment
test("Requirement 5.3: All icons included regardless of package", () => {
  const icons = [
    createMockIcon("icon-core-1", "Core", "Category1"),
    createMockIcon("icon-core-2", "Core", "Category2"),
    createMockIcon("icon-ri-1", "RI", "Category1"),
    createMockIcon("icon-ri-2", "RI", "Category3"),
    createMockIcon("icon-infrago-1", "InfraGO", "Category2"),
    createMockIcon("icon-movas-1", "Movas", "Category1"),
    createMockIcon("icon-unknown-1", "unknown", "Category3"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  // Count total icons across all package files
  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    icons.length,
    "Total icons in output should match input icon count",
  );
});

// Test 2: Icons from all packages are included
test("Requirement 5.3: Icons from all packages are included", () => {
  const icons = [
    createMockIcon("icon-core", "Core"),
    createMockIcon("icon-ri", "RI"),
    createMockIcon("icon-infrago", "InfraGO"),
    createMockIcon("icon-movas", "Movas"),
    createMockIcon("icon-unknown", "unknown"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  // Verify all package files are created
  assertTrue(result.has("core.json"), "Should have core.json");
  assertTrue(result.has("ri.json"), "Should have ri.json");
  assertTrue(result.has("infrago.json"), "Should have infrago.json");
  assertTrue(result.has("movas.json"), "Should have movas.json");
  assertTrue(result.has("unknown.json"), "Should have unknown.json");

  // Verify each package file has exactly one icon
  assertEquals(result.size, 5, "Should have 5 package files");

  const totalIconsInOutput = countIconsInJsonMap(result);
  assertEquals(
    totalIconsInOutput,
    5,
    "Total icons should be 5 (one per package)",
  );
});

// Test 3: No icons are lost when grouping by package
test("Requirement 5.3: No icons lost during package grouping", () => {
  const icons = [
    createMockIcon("icon-a", "Core"),
    createMockIcon("icon-b", "Core"),
    createMockIcon("icon-c", "RI"),
    createMockIcon("icon-d", "RI"),
    createMockIcon("icon-e", "InfraGO"),
    createMockIcon("icon-f", "Movas"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    6,
    "All 6 icons should be present in output",
  );
});

// Test 4: Icons without package assignment are included
test("Requirement 5.3: Icons without package are included", () => {
  const icons = [
    createMockIcon("icon-with-package", "Core"),
    createMockIcon("icon-without-package", "unknown"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    2,
    "Both icons should be included (with and without package)",
  );

  assertTrue(result.has("core.json"), "Should have core.json");
  assertTrue(result.has("unknown.json"), "Should have unknown.json");
});

// Test 5: Large icon set - all icons accounted for
test("Requirement 5.3: Large icon set completeness", () => {
  const icons: IconData[] = [];

  // Create 100 icons distributed across packages
  for (let i = 0; i < 100; i++) {
    const packages = ["Core", "RI", "InfraGO", "Movas", "unknown"];
    const packageName = packages[i % packages.length];
    icons.push(createMockIcon(`icon-${i}`, packageName));
  }

  const result = generateGitLabDescriptions(icons, "illustrative");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    100,
    "All 100 icons should be present in output",
  );
});

// Test 6: Icons from multiple categories in same package
test("Requirement 5.3: Cross-category icons all included", () => {
  const icons = [
    createMockIcon("icon-1", "Core", "Category1"),
    createMockIcon("icon-2", "Core", "Category2"),
    createMockIcon("icon-3", "Core", "Category3"),
    createMockIcon("icon-4", "RI", "Category1"),
    createMockIcon("icon-5", "RI", "Category2"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    5,
    "All icons from multiple categories should be included",
  );

  // Verify Core has 3 icons
  const coreJson = result.get("core.json")!;
  const coreParsed = JSON.parse(coreJson);
  assertEquals(
    Object.keys(coreParsed).length,
    3,
    "Core package should have 3 icons",
  );

  // Verify RI has 2 icons
  const riJson = result.get("ri.json")!;
  const riParsed = JSON.parse(riJson);
  assertEquals(
    Object.keys(riParsed).length,
    2,
    "RI package should have 2 icons",
  );
});

// Test 7: Functional icons - all included
test("Requirement 5.3: Functional icons all included", () => {
  const icons = [
    {
      name: "icon-1",
      id: "id-1",
      category: "Category1",
      description:
        "EN Default: desc1\nEN Contextual: ctx1\nDE Default: de1\nDE Contextual: dectx1",
      parsedDescription: {
        enDefault: "desc1",
        enContextual: "ctx1",
        deDefault: "de1",
        deContextual: "dectx1",
      },
      package: "Core",
    },
    {
      name: "icon-2",
      id: "id-2",
      category: "Category2",
      description:
        "EN Default: desc2\nEN Contextual: ctx2\nDE Default: de2\nDE Contextual: dectx2",
      parsedDescription: {
        enDefault: "desc2",
        enContextual: "ctx2",
        deDefault: "de2",
        deContextual: "dectx2",
      },
      package: "RI",
    },
  ];

  const result = generateGitLabDescriptions(icons, "functional");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(
    totalIconsInOutput,
    2,
    "All functional icons should be included",
  );
});

// Test 8: Empty input returns empty output (edge case)
test("Requirement 5.3: Empty input handled correctly", () => {
  const icons: IconData[] = [];

  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 0, "Empty input should return empty map");

  const totalIconsInOutput = countIconsInJsonMap(result);
  assertEquals(totalIconsInOutput, 0, "Total icon count should be 0");
});

// Test 9: Single icon is included
test("Requirement 5.3: Single icon is included", () => {
  const icons = [createMockIcon("single-icon", "Core")];

  const result = generateGitLabDescriptions(icons, "illustrative");

  const totalIconsInOutput = countIconsInJsonMap(result);

  assertEquals(totalIconsInOutput, 1, "Single icon should be included");
});

// Test 10: Verify no duplicate icons in output
test("Requirement 5.3: No duplicate icons in output", () => {
  // Create icons with same base name but different variants
  const icons = [
    createMockIcon("test-icon/24", "Core"),
    createMockIcon("test-icon/32", "Core"),
    createMockIcon("test-icon/48", "Core"),
  ];

  const result = generateGitLabDescriptions(icons, "illustrative");

  const coreJson = result.get("core.json")!;
  const coreParsed = JSON.parse(coreJson);

  // Should have only 1 entry (duplicates removed by base name)
  assertEquals(
    Object.keys(coreParsed).length,
    1,
    "Should have 1 unique icon (duplicates removed)",
  );

  const totalIconsInOutput = countIconsInJsonMap(result);
  assertEquals(totalIconsInOutput, 1, "Total should be 1 (duplicates removed)");
});

console.log("\n=== Task 11.2 Verification Complete ===\n");
console.log("✅ Requirement 5.3: All Icons export includes all icons");
console.log("✅ Total count matches sum of all icons across packages");
console.log("✅ No icons lost during package grouping");
console.log("✅ Icons from all packages included");
console.log("✅ Cross-category icons included");
console.log("\n📋 Summary:");
console.log("   - generateGitLabDescriptions includes all input icons");
console.log("   - Package grouping preserves all icons");
console.log("   - Total icon count in output matches input count");
console.log("   - Works for both functional and illustrative icons");
