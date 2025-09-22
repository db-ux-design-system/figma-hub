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

### Design Token JSON Import (Recommended)
1. Open the plugin in Figma
2. Select the "Design Tokens JSON" tab
3. Click "Select JSON File" and choose your design token JSON file
4. The plugin will:
   - Parse the JSON and extract all color tokens
   - Create a "Base Colors" frame with visual swatches
   - Generate a variable collection with light and dark modes
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

### Manual Color Entry
1. Select the "Manual Entry" tab
2. Add colors individually using the color picker
3. Or paste multiple colors in the text area
4. Supported text formats:
   - `Color Name #FF5733`
   - `Color Name: #FF5733`
   - `Primary Blue #3498DB`
   - `Secondary Green: #2ECC71`
5. Click "Import Colors" to create the color palette

## Output

The plugin creates different outputs based on the import method:

### Design Token Import
1. **Base Colors Frame**: Visual representation of all design tokens
2. **Variable Collection**: Figma variables with light/dark modes for token-based design
3. **Paint Styles**: Local paint styles in the "Base Colors/" category

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
- Supports both design token workflows and manual color entry