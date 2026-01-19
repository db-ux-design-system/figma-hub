# DB Logo Importer

This plugin creates a Figma component from an SVG, assigns color variables to shapes, and scales it to a defined size.

## Features

- Import SVG files
- Create Figma components
- Assign color variables
- Scale to user-defined size

## Usage

### 1. Generate Your Logo

Before using this plugin, create your custom logo using the [DB brand logo generator](https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Logo/Logozusatz-mit-Tool) from the Marketing Portal.

### 2. Import the SVG

1. Open the plugin in Figma
2. Click "Choose SVG File" and select your downloaded SVG file
3. Click "Import SVG" to start the import process

### 3. What Happens During Import

The plugin automatically:

- **Validates** the SVG file format
- **Flattens** all layers for optimal performance
- **Creates** a Figma component from the SVG
- **Assigns** color variables to logo elements:
  - `DB Logo` layer → Brand color variable
  - `Logo Addition` layer → Adaptive on-bg/emphasis-100 variable
- **Scales** the component to 24px height (standard size)
- **Binds** the component height variable for responsive sizing
- **Locks** the aspect ratio to maintain proportions
- **Places** the component in the center of your viewport

### 4. Integration

After import, integrate the created component into the [logo component](https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13656-3564) following the [documentation](https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13920-21204).

**Important:** Do not change any set variables on the imported component, as they are required for proper integration with design system components.

## Requirements

- Valid SVG file from the DB brand logo generator
- Access to the DB Design System library (for variable binding)

## Troubleshooting

**"Variables could not be linked. Check Library."**

- Ensure the DB Design System library is enabled in your Figma file
- Check that you have access to the required design tokens

**"The selected file does not appear to be a valid SVG."**

- Make sure you're uploading an SVG file (not PNG, JPG, etc.)
- Verify the file was downloaded correctly from the logo generator

**Need help?**

- Create a [GitHub Issue](https://github.com/db-ux-design-system/core/issues) for support

## Technical Details

- **Target height**: 24px (configurable via component height variable)
- **Layer structure**: Automatically flattened for performance
- **Constraints**: Set to MIN/MIN for flexible positioning
- **Aspect ratio**: Locked to maintain logo proportions
