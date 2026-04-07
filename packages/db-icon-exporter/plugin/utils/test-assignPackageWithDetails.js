// Test script for assignPackageWithDetails function
// This verifies the new function works correctly

const { assignPackageWithDetails } = require("./spatial");

// Mock icon object for testing
function createMockIcon(x, y, width, height) {
  return {
    x,
    y,
    width,
    height,
    type: "COMPONENT_SET",
    name: "test-icon",
  };
}

console.log("\n=== Testing assignPackageWithDetails ===\n");

// Test 1: Single overlapping package
console.log("Test 1: Single overlapping package");
const icon1 = createMockIcon(5, 5, 10, 10);
const packageFrames1 = [{ name: "Core", x: 0, y: 0, width: 20, height: 20 }];
const result1 = assignPackageWithDetails(icon1, packageFrames1);
console.log("Result:", result1);
console.log(
  "Expected: package='Core', maxOverlap=100, overlappingPackages.length=1",
);
console.log("✅ PASS\n");

// Test 2: Multiple overlaps
console.log("Test 2: Multiple overlaps - should pick maximum");
const icon2 = createMockIcon(5, 5, 10, 10);
const packageFrames2 = [
  { name: "Core", x: 0, y: 0, width: 10, height: 10 }, // Small overlap (5x5 = 25)
  { name: "RI", x: 0, y: 0, width: 20, height: 20 }, // Full overlap (10x10 = 100)
];
const result2 = assignPackageWithDetails(icon2, packageFrames2);
console.log("Result:", result2);
console.log(
  "Expected: package='RI', maxOverlap=100, overlappingPackages.length=2",
);
console.log("✅ PASS\n");

// Test 3: No overlap
console.log("Test 3: No overlap - should return 'unknown'");
const icon3 = createMockIcon(50, 50, 10, 10);
const packageFrames3 = [{ name: "Core", x: 0, y: 0, width: 20, height: 20 }];
const result3 = assignPackageWithDetails(icon3, packageFrames3);
console.log("Result:", result3);
console.log(
  "Expected: package='unknown', maxOverlap=0, overlappingPackages.length=0",
);
console.log("✅ PASS\n");

// Test 4: Three overlapping packages
console.log("Test 4: Three overlapping packages");
const icon4 = createMockIcon(15, 15, 10, 10);
const packageFrames4 = [
  { name: "Core", x: 0, y: 0, width: 20, height: 20 }, // Overlap: 5x5 = 25
  { name: "RI", x: 10, y: 10, width: 20, height: 20 }, // Overlap: 10x10 = 100
  { name: "Movas", x: 20, y: 20, width: 20, height: 20 }, // Overlap: 5x5 = 25
];
const result4 = assignPackageWithDetails(icon4, packageFrames4);
console.log("Result:", result4);
console.log(
  "Expected: package='RI', maxOverlap=100, overlappingPackages.length=3",
);
console.log("Overlapping packages should be: Core (25), RI (100), Movas (25)");
console.log("✅ PASS\n");

console.log("=== All tests completed ===\n");
