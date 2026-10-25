# Tests

This directory contains unit tests for the DB Custom Color Importer plugin.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests from the plugin directory
cd plugin
npm test
```

## Test Structure

Tests are co-located with the source files they test:

- `utils/color.test.ts` - Tests for color conversion utilities
- `utils/logger.test.ts` - Tests for the logging system
- `config.test.ts` - Tests for configuration constants and helpers

## Test Coverage

### Color Utils (`color.test.ts`)

- ✅ Hex to RGBA conversion (6-digit and 8-digit)
- ✅ Color equality comparison with tolerance
- ✅ Handling of null values and variable aliases

### Config (`config.test.ts`)

- ✅ Scope mapping for different variable types
- ✅ Constants validation (SCOPES, MODE_NAMES, MESSAGES)
- ✅ Message generation functions

### Logger (`logger.test.ts`)

- ✅ Log level filtering
- ✅ Message formatting with timestamps and context
- ✅ Error logging with stack traces
- ✅ Convenience methods (section, subsection, success, step)

## Writing New Tests

When adding new functionality, please add corresponding tests:

1. Create a `.test.ts` file next to the source file
2. Import the functions/classes to test
3. Use `describe` blocks to group related tests
4. Use `it` blocks for individual test cases
5. Use `expect` assertions to verify behavior

Example:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myModule";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
});
```

## Test Framework

We use [Vitest](https://vitest.dev/) as our test framework. It provides:

- Fast test execution
- TypeScript support out of the box
- Jest-compatible API
- Watch mode for development
- Code coverage reporting

## Future Improvements

- [ ] Add integration tests for the full import workflow
- [ ] Add tests for variable creation functions
- [ ] Add tests for collection management
- [ ] Set up code coverage reporting
- [ ] Add CI/CD integration for automated testing
