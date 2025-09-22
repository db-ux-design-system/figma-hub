# Import Custom Colors - Figma Plugin

A Figma plugin for importing custom colors into Figma with visual swatches and local paint styles.

## Features

- **Individual Color Import**: Add colors one by one using the color picker interface
- **Bulk Import**: Paste multiple colors in various text formats
- **Visual Color Swatches**: Creates a "Custom Color Palette" frame with color swatches, names, and hex values
- **Paint Styles**: Automatically creates local paint styles for each imported color
- **Multiple Format Support**: Supports various text formats for bulk import

## Usage

### Individual Colors
1. Open the plugin in Figma
2. Enter a color name (e.g., "Primary Blue")
3. Select a color using the color picker
4. Click "Add" to add it to your list
5. Repeat for additional colors
6. Click "Import Colors" to create the color palette

### Bulk Import
1. Copy colors from your design system or color palette
2. Paste them in the text area
3. Supported formats:
   - `Color Name #FF5733`
   - `Color Name: #FF5733`
   - `Primary Blue #3498DB`
   - `Secondary Green: #2ECC71`
4. Colors will be automatically parsed and added to your list
5. Click "Import Colors" to create the color palette

## Output

The plugin creates:
1. **Color Frame**: A "Custom Color Palette" frame containing visual swatches
2. **Color Swatches**: Rectangular color swatches with proper colors applied
3. **Labels**: Color names and hex values displayed below each swatch
4. **Paint Styles**: Local paint styles in the "Custom Colors/" category

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
│   ├── src/index.ts     # Main plugin file
│   └── package.json     # Plugin dependencies
└── ui/                   # React UI
    ├── src/App.tsx      # Main UI component
    └── package.json     # UI dependencies
```

## Plugin Capabilities

- Creates visual color swatches in a dedicated frame
- Organizes colors in a grid layout (8 colors per row)
- Automatically focuses viewport on the created color palette
- Creates reusable paint styles for design work
- Handles invalid color formats gracefully
- Provides user feedback for all operations