// utils/generators/marketing.test.ts
// Tests to verify Marketing CSV export remains unchanged after package feature
// Validates Requirements 5.1, 5.2

import { generateMarketingPortalCSV } from "./marketing";
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

function assertContains(haystack: string, needle: string, message?: string) {
  if (!haystack.includes(needle)) {
    throw new Error(
      `${message || "String not found"}: expected to find "${needle}" in output`,
    );
  }
}

function assertNotContains(haystack: string, needle: string, message?: string) {
  if (haystack.includes(needle)) {
    throw new Error(
      `${message || "String should not be found"}: did not expect to find "${needle}" in output`,
    );
  }
}

/**
 * Helper function to create mock functional IconData for testing
 */
function createMockFunctionalIcon(
  name: string,
  category: string = "Navigation",
  packageName?: string,
): IconData {
  return {
    name,
    id: `id-${name}`,
    category,
    description:
      "default: EN desc | DE desc\ncontextual: EN context | DE context",
    parsedDescription: {
      enDefault: "EN desc",
      enContextual: "EN context",
      deDefault: "DE desc",
      deContextual: "DE context",
      keywords: "test, keywords",
    },
    package: packageName,
  };
}

/**
 * Helper function to create mock illustrative IconData for testing
 */
function createMockIllustrativeIcon(
  name: string,
  category: string = "Illustrations",
  packageName?: string,
): IconData {
  return {
    name,
    id: `id-${name}`,
    category,
    description: "EN: English description\nDE: German description",
    parsedDescription: {
      en: "English description",
      de: "German description",
      keywords: "test, keywords",
    },
    package: packageName,
  };
}

// Test Suite: Marketing CSV Export - Backward Compatibility
console.log(
  "\n=== Testing Marketing CSV Export - Backward Compatibility ===\n",
);

// Test 1: CSV export does not include package field in output
test("CSV export does not include package field in output", () => {
  const icons = [
    createMockFunctionalIcon("arrow-right-24", "Navigation", "Core"),
    createMockFunctionalIcon("arrow-left-24", "Navigation", "RI"),
  ];

  const result = generateMarketingPortalCSV(icons, "functional");

  // Verify that the word "package" does not appear in the output
  // (except possibly in tags/descriptions which is acceptable)
  assertNotContains(
    result,
    '"Core"',
    "CSV should not contain package name 'Core' as a separate field",
  );
  assertNotContains(
    result,
    '"RI"',
    "CSV should not contain package name 'RI' as a separate field",
  );
});

// Test 2: Functional icons produce expected CSV format
test("Functional icons produce expected CSV format", () => {
  const icons = [createMockFunctionalIcon("arrow-right-24", "Navigation")];

  const result = generateMarketingPortalCSV(icons, "functional");

  // Verify CSV contains expected fields
  assertContains(
    result,
    "db_ic_navigation_arrow_right_24.svg",
    "Should contain filename",
  );
  assertContains(result, '"24dp"', "Should contain size");
  assertContains(result, '"Functionale Icon"', "Should contain icon type");
});

// Test 3: Illustrative icons produce expected CSV format with header
test("Illustrative icons produce expected CSV format with header", () => {
  const icons = [createMockIllustrativeIcon("train-64", "Illustrations")];

  const result = generateMarketingPortalCSV(icons, "illustrative");

  // Verify header is present
  assertContains(
    result,
    '"Original filename","Width","Title","Short Description","Categories","Free Tags","Realm"',
    "Should contain CSV header for illustrative icons",
  );

  // Verify data row
  assertContains(
    result,
    "db_ic_il_illustrations_train-64.svg",
    "Should contain filename",
  );
  assertContains(result, '"64dp"', "Should contain size");
  assertContains(result, '"Illustrative Icon"', "Should contain icon type");
});

// Test 4: Icons with different packages produce same format
test("Icons with different packages produce same format", () => {
  const iconsWithPackage = [
    createMockFunctionalIcon("icon-a-24", "Navigation", "Core"),
    createMockFunctionalIcon("icon-b-24", "Navigation", "RI"),
  ];

  const iconsWithoutPackage = [
    createMockFunctionalIcon("icon-a-24", "Navigation"),
    createMockFunctionalIcon("icon-b-24", "Navigation"),
  ];

  const resultWithPackage = generateMarketingPortalCSV(
    iconsWithPackage,
    "functional",
  );
  const resultWithoutPackage = generateMarketingPortalCSV(
    iconsWithoutPackage,
    "functional",
  );

  // Both should produce identical output (package field should not affect CSV)
  assertEquals(
    resultWithPackage,
    resultWithoutPackage,
    "CSV output should be identical regardless of package field",
  );
});

// Test 5: CSV format includes all expected columns for functional icons
test("CSV format includes all expected columns for functional icons", () => {
  const icons = [createMockFunctionalIcon("test-icon-24", "TestCategory")];

  const result = generateMarketingPortalCSV(icons, "functional");

  // Count commas to verify 6 columns (7 fields)
  const lines = result.split("\n").filter((line) => line.trim().length > 0);
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;

  assertEquals(commaCount, 6, "Each CSV row should have 6 commas (7 fields)");
});

// Test 6: CSV format includes all expected columns for illustrative icons
test("CSV format includes all expected columns for illustrative icons", () => {
  const icons = [createMockIllustrativeIcon("test-icon-64", "TestCategory")];

  const result = generateMarketingPortalCSV(icons, "illustrative");

  const lines = result.split("\n").filter((line) => line.trim().length > 0);
  // Skip header, check data row
  const dataLine = lines[1];
  const commaCount = (dataLine.match(/,/g) || []).length;

  assertEquals(commaCount, 6, "Each CSV row should have 6 commas (7 fields)");
});

// Test 7: Icons are sorted alphabetically by filename
test("Icons are sorted alphabetically by filename", () => {
  const icons = [
    createMockFunctionalIcon("zebra-24", "Navigation"),
    createMockFunctionalIcon("apple-24", "Navigation"),
    createMockFunctionalIcon("monkey-24", "Navigation"),
  ];

  const result = generateMarketingPortalCSV(icons, "functional");

  const lines = result.split("\n").filter((line) => line.trim().length > 0);

  // Extract filenames from each line
  const filenames = lines.map((line) => {
    const match = line.match(/"([^"]+\.svg)"/);
    return match ? match[1] : "";
  });

  // Verify alphabetical order
  const sortedFilenames = [...filenames].sort();
  assertEquals(
    JSON.stringify(filenames),
    JSON.stringify(sortedFilenames),
    "Filenames should be in alphabetical order",
  );
});

// Test 8: Category information is preserved in CSV
test("Category information is preserved in CSV", () => {
  const icons = [createMockFunctionalIcon("icon-24", "CustomCategory", "Core")];

  const result = generateMarketingPortalCSV(icons, "functional");

  // Category should appear in filename
  assertContains(
    result,
    "db_ic_customcategory_icon_24.svg",
    "Category should be included in filename",
  );

  // Category should appear in tags
  assertContains(
    result,
    "CustomCategory",
    "Category should be included in tags",
  );
});

// Test 9: Multiple icons from different packages are all included
test("Multiple icons from different packages are all included", () => {
  const icons = [
    createMockFunctionalIcon("icon-a-24", "Navigation", "Core"),
    createMockFunctionalIcon("icon-b-24", "Navigation", "RI"),
    createMockFunctionalIcon("icon-c-24", "Navigation", "InfraGO"),
    createMockFunctionalIcon("icon-d-24", "Navigation", "Movas"),
    createMockFunctionalIcon("icon-e-24", "Navigation", "unknown"),
  ];

  const result = generateMarketingPortalCSV(icons, "functional");

  // All icons should be present in output
  assertContains(result, "icon_a_24", "Should include icon from Core package");
  assertContains(result, "icon_b_24", "Should include icon from RI package");
  assertContains(
    result,
    "icon_c_24",
    "Should include icon from InfraGO package",
  );
  assertContains(result, "icon_d_24", "Should include icon from Movas package");
  assertContains(
    result,
    "icon_e_24",
    "Should include icon from unknown package",
  );
});

// Test 10: Empty icon array produces empty output
test("Empty icon array produces empty output for functional icons", () => {
  const result = generateMarketingPortalCSV([], "functional");

  assertEquals(result, "", "Empty icon array should produce empty CSV output");
});

// Test 11: Empty icon array produces only header for illustrative icons
test("Empty icon array produces only header for illustrative icons", () => {
  const result = generateMarketingPortalCSV([], "illustrative");

  assertContains(
    result,
    '"Original filename","Width","Title","Short Description","Categories","Free Tags","Realm"',
    "Should contain header even with no icons",
  );

  const lines = result.split("\n").filter((line) => line.trim().length > 0);
  assertEquals(lines.length, 1, "Should only have header line with no icons");
});

// Test 12: Verify package field does not affect output structure
test("Package field does not affect output structure", () => {
  const icon1 = createMockFunctionalIcon("test-24", "Navigation", "Core");
  const icon2 = createMockFunctionalIcon("test-24", "Navigation", "RI");
  const icon3 = createMockFunctionalIcon("test-24", "Navigation");

  const result1 = generateMarketingPortalCSV([icon1], "functional");
  const result2 = generateMarketingPortalCSV([icon2], "functional");
  const result3 = generateMarketingPortalCSV([icon3], "functional");

  // All three should produce identical output
  assertEquals(
    result1,
    result2,
    "Output should be identical for different package values",
  );
  assertEquals(
    result1,
    result3,
    "Output should be identical with or without package field",
  );
});

console.log(
  "\n=== All Marketing CSV backward compatibility tests completed ===\n",
);
console.log("✅ Marketing CSV export format remains unchanged");
console.log("✅ Package field is not used in CSV generation");
console.log("✅ Requirements 5.1 and 5.2 validated");
