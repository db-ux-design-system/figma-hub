// utils/generators/gitlab-package.test.ts
// Tests for package-based GitLab description generation
// Manual tests for verification
// TODO: Integrate with a proper testing framework (e.g., Jest, Vitest)

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
  isContextual: boolean = false,
): IconData {
  if (isContextual) {
    return {
      name,
      id: `id-${name}`,
      category,
      description: `Description for ${name}`,
      parsedDescription: {
        enDefault: `Default English for ${name}`,
        enContextual: `Contextual English for ${name}`,
        deDefault: `Default German for ${name}`,
        deContextual: `Contextual German for ${name}`,
        keywords: "test",
      },
      package: packageName,
    };
  } else {
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
}

// Test Suite: generateGitLabDescriptions with package grouping
console.log("\n=== Testing generateGitLabDescriptions (Package-Based) ===\n");

// Test 1: Empty array should return empty map
test("Empty array returns empty map", () => {
  const result = generateGitLabDescriptions([], "illustrative");
  assertEquals(result.size, 0, "Should return empty map for empty array");
});

// Test 2: Single package with single icon
test("Single package with single icon", () => {
  const icons = [createMockIcon("test-icon", "Core")];
  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 1, "Should have one package file");
  assertTrue(result.has("core.json"), "Should have core.json file");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  assertTrue("test-icon" in parsed, "Should contain test-icon");
  assertEquals(
    parsed["test-icon"].en[0],
    "English description for test-icon",
    "Should have correct English description",
  );
});

// Test 3: Multiple packages with icons
test("Multiple packages with icons", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "RI"),
    createMockIcon("icon3", "InfraGO"),
    createMockIcon("icon4", "Movas"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 4, "Should have four package files");
  assertTrue(result.has("core.json"), "Should have core.json");
  assertTrue(result.has("ri.json"), "Should have ri.json");
  assertTrue(result.has("infrago.json"), "Should have infrago.json");
  assertTrue(result.has("movas.json"), "Should have movas.json");
});

// Test 4: Icons sorted alphabetically within each package
test("Icons sorted alphabetically within each package", () => {
  const icons = [
    createMockIcon("zebra-icon", "Core"),
    createMockIcon("apple-icon", "Core"),
    createMockIcon("middle-icon", "Core"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);
  const keys = Object.keys(parsed);

  assertEquals(keys.length, 3, "Should have 3 icons");
  assertEquals(keys[0], "apple-icon", "First should be apple-icon");
  assertEquals(keys[1], "middle-icon", "Second should be middle-icon");
  assertEquals(keys[2], "zebra-icon", "Third should be zebra-icon");
});

// Test 5: Functional icons with default and contextual descriptions
test("Functional icons with default and contextual descriptions", () => {
  const icons = [
    createMockIcon("functional-icon", "Core", "TestCategory", true),
  ];
  const result = generateGitLabDescriptions(icons, "functional");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  assertTrue("functional-icon" in parsed, "Should contain functional-icon");
  assertTrue("en" in parsed["functional-icon"], "Should have en field");
  assertTrue("de" in parsed["functional-icon"], "Should have de field");
  assertTrue(
    "default" in parsed["functional-icon"].en,
    "Should have en.default field",
  );
  assertTrue(
    "contextual" in parsed["functional-icon"].en,
    "Should have en.contextual field",
  );
});

// Test 6: Package name converted to lowercase filename
test("Package name converted to lowercase filename", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "InfraGO"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  assertTrue(result.has("core.json"), "Core should become core.json");
  assertTrue(result.has("infrago.json"), "InfraGO should become infrago.json");
});

// Test 7: Unknown package handling
test("Unknown package creates unknown.json", () => {
  const icons = [
    createMockIcon("icon1", "Core"),
    createMockIcon("icon2", "unknown"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 2, "Should have two package files");
  assertTrue(result.has("core.json"), "Should have core.json");
  assertTrue(result.has("unknown.json"), "Should have unknown.json");
});

// Test 8: Icons from different categories in same package
test("Icons from different categories grouped in same package file", () => {
  const icons = [
    createMockIcon("icon1", "Core", "Category1"),
    createMockIcon("icon2", "Core", "Category2"),
    createMockIcon("icon3", "Core", "Category3"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 1, "Should have one package file");
  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  assertEquals(
    Object.keys(parsed).length,
    3,
    "Should have all 3 icons in core.json",
  );
});

// Test 9: JSON format preservation for illustrative icons
test("JSON format preservation for illustrative icons", () => {
  const icons = [createMockIcon("test-icon", "Core")];
  const result = generateGitLabDescriptions(icons, "illustrative");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  // Check structure matches expected format
  assertTrue("test-icon" in parsed, "Should have icon key");
  assertTrue("en" in parsed["test-icon"], "Should have en field");
  assertTrue("de" in parsed["test-icon"], "Should have de field");
  assertTrue(Array.isArray(parsed["test-icon"].en), "en should be array");
  assertTrue(Array.isArray(parsed["test-icon"].de), "de should be array");
});

// Test 10: JSON format preservation for functional icons
test("JSON format preservation for functional icons", () => {
  const icons = [createMockIcon("test-icon", "Core", "TestCategory", true)];
  const result = generateGitLabDescriptions(icons, "functional");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  // Check structure matches expected format
  assertTrue("test-icon" in parsed, "Should have icon key");
  assertTrue("en" in parsed["test-icon"], "Should have en field");
  assertTrue("de" in parsed["test-icon"], "Should have de field");
  assertTrue(
    "default" in parsed["test-icon"].en,
    "en should have default field",
  );
  assertTrue(
    "contextual" in parsed["test-icon"].en,
    "en should have contextual field",
  );
  assertTrue(
    Array.isArray(parsed["test-icon"].en.default),
    "en.default should be array",
  );
  assertTrue(
    Array.isArray(parsed["test-icon"].en.contextual),
    "en.contextual should be array",
  );
});

// Test 11: Multiple icons per package sorted alphabetically
test("Multiple icons per package sorted alphabetically", () => {
  const icons = [
    createMockIcon("zebra", "Core"),
    createMockIcon("apple", "Core"),
    createMockIcon("banana", "RI"),
    createMockIcon("cherry", "RI"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  // Check Core package
  const coreJson = result.get("core.json")!;
  const coreParsed = JSON.parse(coreJson);
  const coreKeys = Object.keys(coreParsed);
  assertEquals(coreKeys[0], "apple", "Core: first should be apple");
  assertEquals(coreKeys[1], "zebra", "Core: second should be zebra");

  // Check RI package
  const riJson = result.get("ri.json")!;
  const riParsed = JSON.parse(riJson);
  const riKeys = Object.keys(riParsed);
  assertEquals(riKeys[0], "banana", "RI: first should be banana");
  assertEquals(riKeys[1], "cherry", "RI: second should be cherry");
});

// Test 12: Flat JSON structure (no category nesting)
test("Flat JSON structure without category nesting", () => {
  const icons = [
    createMockIcon("icon1", "Core", "Category1"),
    createMockIcon("icon2", "Core", "Category2"),
  ];
  const result = generateGitLabDescriptions(icons, "illustrative");

  const coreJson = result.get("core.json")!;
  const parsed = JSON.parse(coreJson);

  // Verify flat structure - icon names should be at top level
  assertTrue("icon1" in parsed, "icon1 should be at top level");
  assertTrue("icon2" in parsed, "icon2 should be at top level");

  // Verify no category grouping
  const topLevelKeys = Object.keys(parsed);
  topLevelKeys.forEach((key) => {
    assertTrue(
      key === "icon1" || key === "icon2",
      `Top level key should be icon name, got: ${key}`,
    );
  });
});

// Test 13: Large dataset with all packages
test("Large dataset with all packages", () => {
  const icons: IconData[] = [];
  const packages = ["Core", "RI", "InfraGO", "Movas"];

  // Create 10 icons per package
  packages.forEach((pkg) => {
    for (let i = 1; i <= 10; i++) {
      icons.push(createMockIcon(`${pkg.toLowerCase()}-icon-${i}`, pkg));
    }
  });

  const result = generateGitLabDescriptions(icons, "illustrative");

  assertEquals(result.size, 4, "Should have four package files");

  packages.forEach((pkg) => {
    const filename = `${pkg.toLowerCase()}.json`;
    assertTrue(result.has(filename), `Should have ${filename}`);

    const json = result.get(filename)!;
    const parsed = JSON.parse(json);
    assertEquals(Object.keys(parsed).length, 10, `${pkg} should have 10 icons`);
  });
});

// Test 14: JSON is properly formatted with tabs
test("JSON is properly formatted with tabs", () => {
  const icons = [createMockIcon("test-icon", "Core")];
  const result = generateGitLabDescriptions(icons, "illustrative");

  const coreJson = result.get("core.json")!;

  // Check that JSON contains tabs (formatted)
  assertTrue(coreJson.includes("\t"), "JSON should be formatted with tabs");

  // Verify it's valid JSON
  try {
    JSON.parse(coreJson);
  } catch (e) {
    throw new Error("Generated JSON should be valid");
  }
});

console.log("\n=== All generateGitLabDescriptions tests completed ===\n");
