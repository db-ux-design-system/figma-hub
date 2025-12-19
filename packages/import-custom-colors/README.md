# Import Custom Colors - Figma Plugin

A Figma plugin for importing custom colors and design tokens into Figma with visual swatches, local paint styles, and variable collections.

## Features

- **Design Token JSON Import**: Upload JSON files containing design tokens with the W3C specification format
- **Variable Collections**: Creates Figma variable collections with light and dark modes for design tokens
- **Individual Color Import**: Add colors one by one using the color picker interface
- **Bulk Import**: Paste multiple colors in various text formats
- **Visual Color Swatches**: Creates organized frames with color swatches, names, and hex values
- **Paint Styles**: Automatically creates local paint styles for each imported color
- **Multiple Format Support**: Supports various text formats for bulk import

## Usage

### Design Token JSON Import
1. Open the plugin in Figma
2. Click "Select JSON File" and choose your design token JSON file
3. The plugin will:
   - Parse the JSON and extract all color tokens
   - Create a "Base Colors" frame with visual swatches
   - Generate a variable collection with Base Colors (Default mode)
   - Create a Mode collection with Light/Dark modes and semantic aliases
   - Create local paint styles in the "Base Colors/" category

#### Supported JSON Format
The plugin supports the following design token JSON structure:
```json
{
  "colors": {
    "category-name": {
      "token-name": {
        "$type": "color",
        "$value": "#FF5733"
      },
      "another-token": {
        "$type": "color",
        "$value": "#3498DB"
      }
    },
    "another-category": {
      "token-name": {
        "$type": "color",
        "$value": "#2ECC71"
      }
    }
  }
}
```

## Output

The plugin creates:

1. **Base Colors Frame**: Visual representation of all design tokens organized by category
2. **Base Colors Collection**: Figma variable collection containing all raw color values with Default mode
3. **Mode Collection**: Semantic color variables with Light Mode and Dark Mode containing aliases to Base Colors
4. **Semantic Variables**: Automatically creates variables for:
   - Background colors (`category/bg/basic/level-1`, `category/bg/basic/level-1/hovered`, etc.)
   - Text colors (`category/text/basic/default`, `category/text/basic/hovered`, etc.) 
   - Border colors (`category/border/basic/default`, `category/border/basic/hovered`, etc.)
5. **Paint Styles**: Local paint styles in the "Base Colors/" category

#### Variable Collection Structure
The plugin creates two collections following professional design system patterns:

**Base Colors Collection (Default mode):**
- Contains raw color values from JSON (0-14, origin-*, transparent-*, etc.)
- Organized by category (e.g., `dibe-category1/0`, `dibe-category1/origin-light-default`)

**Mode Collection (Light Mode / Dark Mode):**
- Semantic variables that alias to Base Colors
- Light mode uses high numbers (14, 13, 12) for backgrounds and low numbers (1, 2, 3) for text
- Dark mode uses low numbers (1, 2, 3) for backgrounds and high numbers (14, 13, 12) for text
- Enables automatic theme switching in Figma

### Manual Import
1. **Custom Color Palette Frame**: Visual color swatches in a grid layout
2. **Paint Styles**: Local paint styles in the "Custom Colors/" category

## Development

### Building
```bash
npm run build:import-custom-colors
```

### Development Mode
```bash
npm run dev:import-custom-colors
```

## File Structure

```
import-custom-colors/
├── manifest.json         # Figma plugin manifest
├── package.json          # Main package configuration
├── plugin/               # Plugin logic (TypeScript)
│   ├── src/index.ts     # Main plugin file with JSON parsing
│   └── package.json     # Plugin dependencies
└── ui/                   # React UI
    ├── src/App.tsx      # Main UI with file upload
    └── package.json     # UI dependencies
```

## Plugin Capabilities

- Parses W3C design token JSON format
- Creates Figma variable collections for scalable design systems
- Creates visual color swatches in organized frames
- Organizes colors in a grid layout (8 colors per row)
- Automatically focuses viewport on the created color palette
- Creates reusable paint styles for design work
- Handles invalid color formats gracefully
- Provides user feedback for all operations
- Supports design token workflows with professional variable collections