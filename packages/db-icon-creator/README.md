# DB Icon Creator

A Figma plugin to validate and edit icon component sets according to Deutsche Bahn guidelines.

## Features

- **Icon Type Detection**: Automatically detects functional and illustrative icons
- **Vector Validation**: Validates stroke widths, sizes, and other vector properties
- **Outline Conversion**: Converts strokes to fills according to guidelines
- **Flatten Operations**: Combines multiple vector layers into single layers
- **Color Variables**: Applies predefined color variables to icons
- **Size Scaling**: Creates additional scaled variants (32px→28px, 20px→16px/14px/12px)
- **Description Editing**: Updates icon descriptions with structured metadata
- **Name Validation**: Validates and suggests corrections for icon names
- **Workflow Orchestration**: Run all operations in sequence with "Run All"

## Development

### Prerequisites

- Node.js (see `.nvmrc` for version)
- npm

### Setup

```bash
# Install dependencies from the monorepo root
npm install

# Navigate to the plugin directory
cd packages/db-icon-creator

# Install workspace dependencies
npm install
```

### Development Mode

```bash
# Run both plugin and UI in watch mode
npm run dev

# Or run individually:
npm run dev:code  # Plugin code only
npm run dev:ui    # UI only
```

### Building

```bash
# Build both plugin and UI
npm run build

# Or build individually:
npm run build:code  # Plugin code only
npm run build:ui    # UI only
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Architecture

The plugin follows a modular architecture with separate workspaces:

- **plugin/**: TypeScript code for Figma API interactions
  - `src/main.ts`: Main entry point and message handler
  - `src/validators/`: Validation modules
  - `src/processors/`: Processing modules (outline, flatten, color, scale, description)
  - `src/utils/`: Utility functions (selection, workflow, error handling)
  - `src/types/`: Shared TypeScript types

- **ui/**: React/Vite UI workspace
  - `src/App.tsx`: Main React component
  - `src/components/`: React components
  - `src/types.ts`: UI-specific types

## Testing Strategy

The plugin uses a dual testing approach:

- **Unit Tests**: Specific examples and edge cases using Vitest
- **Property-Based Tests**: Universal correctness properties using fast-check
  - Minimum 100 iterations per property test
  - All 23 correctness properties from the design document

## License

Apache-2.0

## Author

DB Systel GmbH
