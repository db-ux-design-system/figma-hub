// Standalone test for assignPackage function
// This can be run with Node.js to verify the logic

// Mock the types and functions
const PACKAGE_NAMES = ["Core", "RI", "InfraGO", "Movas"];

function calculateOverlap(iconBounds, frameBounds) {
  const intersectionLeft = Math.max(iconBounds.x, frameBounds.x);
  const intersectionRight = Math.min(
    iconBounds.x + iconBounds.width,
    frameBounds.x + frameBounds.width,
  );
  const intersectionTop = Math.max(iconBounds.y, frameBounds.y);
  const intersectionBottom = Math.min(
    iconBounds.y + iconBounds.height,
    frameBounds.y + frameBounds.height,
  );

  if (
    intersectionRight <= intersectionLeft ||
    intersectionBottom <= intersectionTop
  ) {
    return 0;
  }

  const intersectionWidth = intersectionRight - intersectionLeft;
  const intersectionHeight = intersectionBottom - intersectionTop;

  return intersectionWidth * intersectionHeight;
}

function assignPackage(icon, packageFrames) {
  if (packageFrames.length === 0) {
    return "unknown";
  }

  const iconBounds = {
    x: icon.x,
    y: icon.y,
    width: icon.width,
    height: icon.height,
  };

  let maxOverlap = 0;
  let assignedPackage = "unknown";

  for (const packageFrame of packageFrames) {
    const frameBounds = {
      x: packageFrame.x,
      y: packageFrame.y,
      width: packageFrame.width,
      height: packageFrame.height,
    };

    const overlap = calculateOverlap(iconBounds, frameBounds);

    if (
      overlap > maxOverlap ||
      (overlap === maxOverlap &&
        overlap > 0 &&
        packageFrame.name < assignedPackage)
    ) {
      maxOverlap = overlap;
      assignedPackage = packageFrame.name;
    }
  }

  return assignedPackage;
}

// Test utilities
function test(description, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(`   ${error.message}`);
    return false;
  }
}

function createMockIcon(x, y, width, height) {
  return { x, y, width, height, type: "COMPONENT_SET", name: "test-icon" };
}

// Run tests
console.log("\n=== Testing assignPackage ===\n");

let passed = 0;
let failed = 0;

// Test 1: Single overlapping package
if (
  test("Single overlapping package", () => {
    const icon = createMockIcon(5, 5, 10, 10);
    const packageFrames = [{ name: "Core", x: 0, y: 0, width: 20, height: 20 }];
    const result = assignPackage(icon, packageFrames);
    if (result !== "Core") {
      throw new Error(`Expected "Core", got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 2: Maximum overlap selection
if (
  test("Maximum overlap selection", () => {
    const icon = createMockIcon(5, 5, 10, 10);
    const packageFrames = [
      { name: "Core", x: 0, y: 0, width: 10, height: 10 }, // Small overlap (5x5 = 25)
      { name: "RI", x: 0, y: 0, width: 20, height: 20 }, // Full overlap (10x10 = 100)
    ];
    const result = assignPackage(icon, packageFrames);
    if (result !== "RI") {
      throw new Error(`Expected "RI" (larger overlap), got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 3: No overlap returns 'unknown'
if (
  test("No overlap returns 'unknown'", () => {
    const icon = createMockIcon(50, 50, 10, 10);
    const packageFrames = [{ name: "Core", x: 0, y: 0, width: 20, height: 20 }];
    const result = assignPackage(icon, packageFrames);
    if (result !== "unknown") {
      throw new Error(`Expected "unknown", got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 4: Alphabetical tiebreaker for equal overlaps
if (
  test("Alphabetical tiebreaker for equal overlaps", () => {
    const icon = createMockIcon(10, 10, 10, 10);
    const packageFrames = [
      { name: "RI", x: 5, y: 5, width: 20, height: 20 }, // Same overlap
      { name: "Core", x: 5, y: 5, width: 20, height: 20 }, // Same overlap, but "Core" < "RI"
    ];
    const result = assignPackage(icon, packageFrames);
    if (result !== "Core") {
      throw new Error(
        `Expected "Core" (alphabetically first), got "${result}"`,
      );
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 5: No package frames returns 'unknown'
if (
  test("No package frames returns 'unknown'", () => {
    const icon = createMockIcon(5, 5, 10, 10);
    const packageFrames = [];
    const result = assignPackage(icon, packageFrames);
    if (result !== "unknown") {
      throw new Error(`Expected "unknown", got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 6: Partial overlap with multiple packages
if (
  test("Partial overlap with multiple packages", () => {
    const icon = createMockIcon(15, 15, 10, 10);
    const packageFrames = [
      { name: "Core", x: 0, y: 0, width: 20, height: 20 }, // Overlap: 5x5 = 25
      { name: "RI", x: 10, y: 10, width: 20, height: 20 }, // Overlap: 10x10 = 100
      { name: "Movas", x: 20, y: 20, width: 20, height: 20 }, // Overlap: 5x5 = 25
    ];
    const result = assignPackage(icon, packageFrames);
    if (result !== "RI") {
      throw new Error(`Expected "RI" (maximum overlap), got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 7: Icon touching edge returns 'unknown'
if (
  test("Icon touching edge returns 'unknown'", () => {
    const icon = createMockIcon(20, 0, 10, 10);
    const packageFrames = [{ name: "Core", x: 0, y: 0, width: 20, height: 20 }];
    const result = assignPackage(icon, packageFrames);
    if (result !== "unknown") {
      throw new Error(`Expected "unknown" (touching edge), got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 8: Multiple packages with different overlaps
if (
  test("Multiple packages with different overlaps", () => {
    const icon = createMockIcon(8, 8, 10, 10);
    const packageFrames = [
      { name: "Core", x: 0, y: 0, width: 15, height: 15 }, // Overlap: 7x7 = 49
      { name: "InfraGO", x: 5, y: 5, width: 20, height: 20 }, // Overlap: 10x10 = 100
      { name: "Movas", x: 10, y: 10, width: 20, height: 20 }, // Overlap: 8x8 = 64
    ];
    const result = assignPackage(icon, packageFrames);
    if (result !== "InfraGO") {
      throw new Error(`Expected "InfraGO" (maximum overlap), got "${result}"`);
    }
  })
) {
  passed++;
} else {
  failed++;
}

// Test 9: Tiebreaker with three equal overlaps
if (
  test("Tiebreaker with three equal overlaps", () => {
    const icon = createMockIcon(10, 10, 10, 10);
    const packageFrames = [
      { name: "RI", x: 5, y: 5, width: 20, height: 20 },
      { name: "Movas", x: 5, y: 5, width: 20, height: 20 },
      { name: "Core", x: 5, y: 5, width: 20, height: 20 },
    ];
    const result = assignPackage(icon, packageFrames);
    if (result !== "Core") {
      throw new Error(
        `Expected "Core" (alphabetically first), got "${result}"`,
      );
    }
  })
) {
  passed++;
} else {
  failed++;
}

console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log("\n✅ All tests passed!\n");
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed!\n");
  process.exit(1);
}
