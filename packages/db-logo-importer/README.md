# DB Logo Importer

This plugin imports an SVG logo, assigns color variables to shapes, and scales it to a defined size. The result is a frame (not a component) that can be placed freely or imported directly into a Shell or ControlPanel.

## Features

- Import SVG files
- Create a Figma frame with auto layout
- Assign color variables
- Scale to standard size (24px height)
- Direct import into Shell or ControlPanel components

## Usage

### 1. Generate Your Logo

Before using this plugin, create your custom logo using the [DB brand logo generator](https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Logo/Logozusatz-mit-Tool) from the Marketing Portal.

### 2. Import the SVG

1. Open the plugin in Figma
2. Click "Browse" and select your downloaded SVG file
3. Click "Import SVG" to start the import process

### 3. What Happens During Import

The plugin automatically:

- **Validates** the SVG file format
- **Flattens** all layers for optimal performance
- **Creates** a frame from the SVG (no component wrapper)
- **Assigns** color variables to logo elements:
  - `DB Logo` layer → Brand color variable
  - `Logo Addition` layer → Adaptive on-bg/emphasis-100 variable
- **Scales** the frame to 24px height (standard size)
- **Binds** the height variable for responsive sizing
- **Locks** the aspect ratio to maintain proportions
- **Places** the frame in the center of your viewport

### 4. Direct Import into Shell or ControlPanel

If you select a **Shell** or **ControlPanel** instance (or any child node within one) before importing, the plugin will automatically place the logo into the CP Brand Children slot:

- Detects Shell/ControlPanel context from the current selection
- Locates the CP Brand subcomponent and its `📦 Children` slot
- Replaces any existing logo in the slot, or inserts a new one
- Falls back to the default import (centered in viewport) if no compatible slot is found

This lets you skip manual placement and directly update logos within Shell or ControlPanel variants.

### 5. Integration

After import, integrate the created frame into the [logo component](https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13656-3564) following the [documentation](https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13920-21204).

**Important:** Do not change any set variables on the imported frame, as they are required for proper integration with design system components.

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

**"This Shell variant has no CP Brand Children slot. Using default import."**

- The selected Shell variant doesn't have the CP Brand subcomponent with a Children slot
- The logo will be placed at the viewport center instead

**Need help?**

- Create a [GitHub Issue](https://github.com/db-ux-design-system/core/issues) for support

## Technical Details

- **Output type**: Frame (not a component)
- **Target height**: 24px (configurable via height variable)
- **Layer structure**: Automatically flattened for performance
- **Auto Layout**: Horizontal, hug width, fixed height
- **Aspect ratio**: Locked to maintain logo proportions
- **Shell support**: Detects Shell/ControlPanel → CP Brand → Children slot hierarchy
