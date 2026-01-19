# DB Icon Exporter

This plugin exports icons from Figma to SVG format, optimized for the Deutsche Bahn design system.

## Features

- Export selected icons as SVG files
- Batch export multiple icons
- Optimized SVG output for web and app usage
- Maintains icon naming conventions
- Supports team library icons

## Usage

### 1. Starting the Plugin

Open the plugin in Figma. The plugin will automatically scan all icons in your current file and display them grouped by category.

### 2. Selecting Icons

**Select individual icon sets:**

- Click on any icon name tag to select/deselect it
- Each icon set includes all its variants (sizes, styles)

**Select by category:**

- Click on a category header to select/deselect all icons in that category
- Categories are displayed with the number of icon sets they contain

**Bulk selection:**

- **Select all**: Selects all available icon sets
- **Select Export-Page**: Automatically selects all icons that are present on the "🚀 Icon Export" page
- **Clear selection**: Removes all selections

**Filter icons:**

- Use the search field to filter icons by name or category
- The counter shows how many icon sets match your filter

### 3. Setting Version (Optional)

Enter a version number (e.g., `1.2.4`) in the version field if you want to generate a changelog. If left empty, no changelog will be created.

### 4. Assigning Status to Icons

For each selected icon, choose a changelog status:

- ⭐ **added**: New icons
- 🪲 **fixed**: Bug fixes or corrections
- 🔀 **changed**: Modified icons
- ⚠️ **deprecated**: Icons marked for removal

The default status is "added" for all newly selected icons.

### 5. Export Options

**Full Export (Assets + Info):**

- Exports SVG files for all selected icons
- Creates a "🚀 Icon Export" page in Figma with:
  - GitLab frame containing all icon instances
  - Marketing frame with icon overview
- Generates description files for GitLab and Marketing Portal
- Creates an overview page if "added" icons are present

**Info Only Export:**

- Generates only the description files (no SVG export)
- Creates GitLab descriptions for selected and all icons
- Creates Marketing Portal CSV data
- No Figma export page is created

### 6. Export Results

After export, you'll see three text areas with generated data:

**GitLab Descriptions (Selected Icons):**

- JSON format with descriptions for your selected icons
- Use this for GitLab documentation updates

**GitLab Descriptions (All Icons):**

- Complete JSON with all icons in the file
- Use this for full documentation exports

**Marketing Portal Code (All Icons):**

- CSV-formatted data for the Marketing Portal
- Contains all icons with their metadata

Click the "Copy" button next to each section to copy the content to your clipboard.

## Icon Types

The plugin automatically detects the icon type from your Figma file:

- **Functional Icons**: Icons with contextual and default variants
- **Illustrative Icons**: Decorative or illustrative icons

## Tips

- Icons are grouped by their base name (without size/variant suffixes)
- The plugin preserves all variants when exporting
- Use the Export-Page selection to quickly re-export previously exported icons
- The overview page is only updated when "added" icons are present
