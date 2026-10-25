# Testing Guide

## Overview

The DB Custom Color Importer plugin includes comprehensive unit tests to ensure code quality and prevent regressions.

## Test Framework

We use **Vitest** as our test framework, which provides:

- ⚡ Fast test execution
- 📘 TypeScript support out of the box
- 🧪 Jest-compatible API
- 👀 Watch mode for development
- 📊 Code coverage reporting

## Running Tests

### Run all tests once

```bash
npm test
```

### Run tests in watch mode (for development)

```bash
npm run test:watch
```

### Run tests from the plugin directory

```bash
cd plugin
npm test
```

## Test Coverage

### Current Test Statistics

- **Test Files:** 3
- **Total Tests:** 53
- **Pass Rate:** 100%

### Covered Modules

#### 1. Color Utilities (`utils/color.test.ts`) - 16 tests

Tests for color conversion and comparison:

- ✅ Hex to RGBA conversion (6-digit format)
- ✅ Hex to RGBA conversion (8-digit format with alpha)
- ✅ Color equality comparison with tolerance
- ✅ Handling of edge cases (null, variable aliases)
- ✅ Rounding to 2 decimal places

**Example:**

```typescript
it("should convert 6-digit hex to rgba", () => {
  const result = hexToRgba("#FF0000");
  expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
});
```

#### 2. Configuration (`config.test.ts`) - 13 tests

Tests for configuration constants and helpers:

- ✅ Scope mapping for different variable types
- ✅ SCOPES constants validation
- ✅ MODE_NAMES constants validation
- ✅ MESSAGES constants validation
- ✅ Message generation functions

**Example:**

```typescript
it("should return BACKGROUND scopes for bg/ prefix", () => {
  const result = getScopesForMapping("bg/basic/level-1/default");
  expect(result).toEqual(SCOPES.BACKGROUND);
});
```

#### 3. Logger (`utils/logger.test.ts`) - 24 tests

Tests for the logging system:

- ✅ Log level filtering (DEBUG, INFO, WARN, ERROR)
- ✅ Message formatting with timestamps
- ✅ Context tags in log messages
- ✅ Error logging with stack traces
- ✅ Convenience methods (section, subsection, success, step)
- ✅ Convenience log object

**Example:**

```typescript
it("should log debug messages when level is DEBUG", () => {
  logger.setLevel(LogLevel.DEBUG);
  logger.debug("test message");
  expect(console.debug).toHaveBeenCalled();
});
```

## Writing New Tests

### Test File Structure

Tests are co-located with the source files they test:

```
plugin/
├── config.ts
├── config.test.ts          ← Test file
├── utils/
│   ├── color.ts
│   ├── color.test.ts       ← Test file
│   ├── logger.ts
│   └── logger.test.ts      ← Test file
```

### Test Template

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myModule";

describe("myFunction", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test input";

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe("expected output");
  });

  it("should handle edge cases", () => {
    expect(myFunction(null)).toBe(null);
    expect(myFunction("")).toBe("");
  });
});
```

### Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test edge cases** - Include tests for null, undefined, empty strings, etc.
4. **Keep tests focused** - Each test should verify one specific behavior
5. **Use beforeEach/afterEach** - For setup and cleanup
6. **Mock external dependencies** - Use `vi.fn()` for mocking

### Example with Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("myModule", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should call external function", () => {
    const mockFn = vi.fn();
    myFunction(mockFn);
    expect(mockFn).toHaveBeenCalledWith("expected argument");
  });
});
```

## Continuous Integration

Tests should be run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
```

## Future Improvements

- [ ] Add integration tests for the full import workflow
- [ ] Add tests for variable creation functions
- [ ] Add tests for collection management
- [ ] Set up code coverage reporting with thresholds
- [ ] Add visual regression tests for UI components
- [ ] Add performance benchmarks

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure all dependencies are installed:

```bash
npm install
```

### Tests timeout

Increase the timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
});
```

### Mock not working

Ensure you're using `vi.fn()` from Vitest, not Jest:

```typescript
import { vi } from "vitest";
const mockFn = vi.fn();
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
