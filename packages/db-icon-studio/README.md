# DB Icon Studio

This plugin processes and prepares icons for the DB Design System, handling both functional and illustrative icon types with automated workflows for flattening, scaling, color assignment, and metadata management.

## Features

- Process functional icons (sizes: 12, 14, 16, 20, 24, 28, 32)
- Process illustrative icons (size: 64)
- Automated layer flattening and structure optimization
- Color variable assignment
- Icon metadata management (descriptions, keywords)
- Real-time validation and feedback

## Icon Types

### Functional Icons

Small, single-color icons used throughout the interface for actions and navigation.

**Sizes:** 12px, 14px, 16px, 20px, 24px, 28px , 32px
**Color:** Single color (base token)  
**Naming:** kebab-case (e.g., `bell-disabled`)

### Illustrative Icons

Larger, two-color icons used for visual emphasis and storytelling.

**Size:** 64px  
**Colors:** Black (base token) and red (pulse token)  
**Naming:** snake_case (e.g., `train_station`)

## Usage

### 1. Prepare Your Icon

Before using the plugin:

1. Create your icon component in Figma
2. Name it according to the icon type:
   - Functional: `kebab-case` (e.g., `bell-disabled`)
   - Illustrative: `snake_case` (e.g., `train_station`)
3. Ensure the component has a Container frame as the first child
4. Place your vector artwork inside the Container

**Required structure:**

```
Component (your-icon-name)
└── Container (Frame)
    └── Your vector layers
```

### 2. Select Your Icon Component

1. Open the plugin in Figma
2. Select the icon component you want to process
3. The plugin will automatically detect the icon type based on the name

### 3. Process the Icon

#### For Functional Icons:

Click **"Create Functional Icon"** to start the automated workflow:

1. **Structure Cleanup** - Removes empty groups and optimizes layer structure
2. **Flatten Layers** - Combines all vector layers into a single "Vector" layer
3. **Scale to Sizes** - Creates variants for all functional icon sizes (12, 14, 16, 28)
4. **Apply Colors** - Assigns the base color variable to the vector
5. **Add Metadata** - Opens the description editor for icon details

#### For Illustrative Icons:

Click **"Create Illustrative Icon"** to start the automated workflow:

1. **Structure Cleanup** - Removes empty groups and optimizes layer structure
2. **Flatten Layers** - Combines all vector layers, extracting from nested groups
3. **Apply Colors** - Assigns color variables:
   - Black fills → Base color variable
   - Red fills → Pulse color variable
4. **Add Metadata** - Opens the description editor for icon details

### 4. Add Icon Metadata

After processing, the description dialog opens automatically:

#### Functional Icons:

- **EN Default** (required): English default description
- **EN Contextual**: Additional English context
- **DE Default** (required): German default description
- **DE Contextual**: Additional German context
- **Keywords**: Search keywords

#### Illustrative Icons:

- **EN Description** (required): English description
- **DE Description** (required): German description
- **Keywords**: Search keywords

### 5. Validation

The plugin validates your icon at each step:

- ✅ Component structure (Container frame present)
- ✅ Icon name format (kebab-case or snake_case)
- ✅ Vector layers present
- ✅ Proper size constraints
- ✅ Color variable binding

## Workflow Details

### Functional Icon Processing

1. **Flatten**: All layers in Container → single "Vector" layer
2. **Scale**: Creates 4 size variants (12, 14, 16, 28)
3. **Color**: Applies base color variable
4. **Structure**: Component > Container > Vector

### Illustrative Icon Processing

1. **Extract Groups**: Moves children from nested groups to Container
2. **Flatten**: All layers → single "Vector" layer with mixed fills
3. **Color Detection**:
   - Black (r<0.1, g<0.1, b<0.1) → Base variable
   - Red (r>0.5, g<0.3, b<0.3) → Pulse variable
4. **Structure**: Component > Container > Vector (with color-bound fills)

## Requirements

- Valid icon component with Container frame
- Access to the DB Design System library (for variable binding)
- Proper icon naming convention

## Troubleshooting

**"No component selected"**

- Select a component (not a frame or group) before running the plugin

**"Container not found"**

- Ensure your component has a Container frame as the first child
- The Container should contain your vector artwork

**"No Vector layer found in container"**

- The flatten step may have failed
- Check that your Container has vector layers to flatten
- Try manually flattening nested groups first

**"Failed to import color variable"**

- Ensure the DB Design System library is enabled in your Figma file
- Check that you have access to the required design tokens

**"Icon name must be in kebab-case/snake_case"**

- Functional icons: Use lowercase letters, numbers, and hyphens (e.g., `bell-disabled`)
- Illustrative icons: Use lowercase letters, numbers, and underscores (e.g., `train_station`)

**Need help?**

- Create a [GitHub Issue](https://github.com/db-ux-design-system/core/issues) for support

## Technical Details

### Functional Icons

- **Sizes**: 12px, 14px, 16px, 20px, 24px, 28px , 32px
- **Color variable**: Base (key: `497497bca9694f6004d1667de59f1a903b3cd3ef`)
- **Layer structure**: Component > Container > Vector
- **Constraints**: SCALE/SCALE for responsive sizing

### Illustrative Icons

- **Size**: 64px
- **Color variables**:
  - Base/Black (key: `497497bca9694f6004d1667de59f1a903b3cd3ef`)
  - Pulse/Red (key: `998998d67d3ebef6f2692db932bce69431b3d0cc`)
- **Layer structure**: Component > Container > Vector (with mixed fills)
- **Constraints**: SCALE/SCALE for responsive sizing

### Color Detection Thresholds

- **Black**: RGB values all < 0.1
- **Red**: R > 0.5, G < 0.3, B < 0.3

---

## Development

### Prerequisites

- Node.js (see `.nvmrc` for version)
- npm

### Setup

```bash
# Install dependencies from the monorepo root
npm install

# Navigate to the plugin directory
cd packages/db-icon-studio

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
  - `src/processors/`: Processing modules (outline, flatten, union, color, scale, description)
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

---

**Version:** 0.1.0  
**Maintained by:** DB UX Design System Team  
**License:** Apache-2.0  
**Author:** DB Systel GmbH
