# DB Custom Color Importer

This plugin imports the custom color variables from Theme Builder Export.

## Features

- Import custom color variables
- Create Figma variables and modes
- Create collections with aliases

## Usage

### 1. Create Custom Colors in Theme Builder

Before using this plugin, create your custom color palette in the [DB UX Theme Builder](https://design-system.deutschebahn.com/theme-builder/):

1. Visit the Theme Builder
2. Create or customize your color palette
3. Export the color configuration as JSON file

Note: **DB Products**: Only use [secondary colors](https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Farbe/Sekundaerfarben) from the DB brand palette for custom colors

### 2. Import the JSON File

1. Open the plugin in Figma
2. Click "select file" and choose your exported JSON file from Theme Builder (Utils/XYZ-figma-custom-colors.json)
3. (Optional) Check **"Delete existing color variables"** if you want to start fresh
4. Click **"Import variables"**

### 3. What Happens During Import

The plugin creates three variable collections in your Figma file:

#### Collection 1: ❌ Base Variables ❌

- Contains all raw color values from your JSON
- Organized by color family (e.g., `colors/blue/1`, `colors/blue/2`, etc.)
- Hidden from publishing
- Used as source for other collections

#### Collection 2: Mode

- Contains light and dark mode variants
- Maps base colors to display modes
- Hidden from publishing
- Provides mode-specific color references
- Used as source for other collections

#### Collection 3: Colors

- Contains the final adaptive color variables
- Includes modes for:
  - **DB Adaptive**: Links to default DB design system colors
  - **[Your Color Families]**: One mode per imported color family
- Published and ready to use in your designs
- Organized by semantic naming:
  - `custom-adaptive/bg/*` - Background colors (scoped to fills)
  - `custom-adaptive/on-bg/*` - Foreground colors (scoped to text, stroke, effects)
  - `custom-adaptive/origin/*` - Origin colors
  - `custom-adaptive/on-origin/*` - On-origin colors

### 4. Using the Imported Colors

After import, you can use the colors in your designs:

#### Using Custom Colors in Local Components

1. Select a layer in Figma
2. In the color picker, choose from the **Colors** collection
3. Switch between modes to see your custom color families
4. The colors automatically adapt between light and dark modes

#### Using Custom Colors in DB Components

To use your custom colors with DB Components (e.g., DBButton, DBTag), you need to create local component wrappers:

1. **Create a local component** (e.g., `CustomTag`) that contains a DB Component instance (e.g., `DBTag`)
2. **Add all necessary variants** that match the original component (interactive states, sizes, etc.)
3. **Override the color variables**: Replace the `db-adaptive/*` color variables with your `custom-adaptive/*` equivalents
4. **Use your local component** in your designs instead of the original DB Component

**Example workflow:**

- Original: `DBTag` uses `db-adaptive/bg/basic/level-1/default`
- Custom: `CustomTag` overrides this with `custom-adaptive/bg/basic/level-1/default`
- Result: Your custom colors are applied while maintaining all component functionality

This approach ensures your custom colors work seamlessly with the DB Design System components while preserving all interactive states and behaviors.

### 5. Import Options

**Delete existing color variables:**

- ✅ **Checked**: Removes all existing custom color collections and creates them fresh
- ❌ **Unchecked**: Synchronizes/updates existing variables (default)

Use the delete option when:

- You want to start completely fresh
- You've removed color families from your Theme Builder export
- You're experiencing issues with existing variables

## Color Structure

The plugin maps your custom colors to semantic tokens following this structure:

**Background colors:**

- `bg/basic/level-1/` - Primary background (default, hovered, pressed)
- `bg/basic/level-2/` - Secondary background
- `bg/basic/level-3/` - Tertiary background
- `bg/basic/transparent-full/` - Fully transparent backgrounds
- `bg/basic/transparent-semi/` - Semi-transparent backgrounds
- `bg/vibrant/` - Vibrant/accent backgrounds
- `bg/inverted/` - Inverted backgrounds (contrast-max, contrast-high, contrast-low)

**Foreground colors:**

- `on-bg/basic/emphasis-100/` - Maximum emphasis (default text)
- `on-bg/basic/emphasis-90/` - High emphasis
- `on-bg/basic/emphasis-80/` - Medium-high emphasis
- `on-bg/basic/emphasis-70/` - Medium emphasis
- `on-bg/basic/emphasis-60/` - Medium-low emphasis
- `on-bg/basic/emphasis-50/` - Low emphasis
- `on-bg/vibrant/` - Vibrant foreground
- `on-bg/inverted/` - Inverted foreground

**Origin colors:**

- `origin/` - Origin background colors
- `on-origin/` - Origin foreground colors

## Requirements

- Valid JSON export from DB UX Theme Builder
- Access to the DB Design System library (for DB Adaptive mode)

## Troubleshooting

**"The selected file does not appear to be a valid JSON."**

- Ensure you're uploading a JSON file exported from Theme Builder
- Verify the file wasn't corrupted during download
- Check that the file contains the expected color structure

**Variables not showing up:**

- Make sure the import completed successfully (check for success message)
- Look for the "Colors" collection in your local variables panel
- Try refreshing the Figma file

**Colors don't match Theme Builder:**

- Check if you selected the correct JSON file
- Try re-importing with "Delete existing color variables" checked
- Verify the JSON file contains the expected color values

**Need help?**

- Create a [GitHub Issue](https://github.com/db-ux-design-system/core/issues) for support

## Tips

- Keep your Theme Builder JSON file for future reference and re-import for updates
- Use descriptive names for your color families in Theme Builder (ideally < 15 characters)
- The "DB Adaptive" mode provides fallback to default DB colors
- Custom color modes allow you to switch between different product colors
- Variables are scoped appropriately (backgrounds to fills, foregrounds to text/stroke)
