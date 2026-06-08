# DB Renamer

This plugin provides comprehensive renaming functionality for Figma layers.

## Features

- Find & Replace with case sensitivity option
- Case transformation (Title Case, camelCase, snake_case, etc.)
- Clean special characters, digits, and extra spaces
- Apply to specific layer types
- Option to apply only to parent layers

## Usage

### 1. Select Layers

Select one or more layers in Figma that you want to rename. The plugin works with your current selection.

### 2. Choose Renaming Mode

The plugin offers three tabs with different renaming modes:

#### Tab 1: Rename (Find & Replace)

Replace text in layer names:

1. Enter the text to **Find** (e.g., "Button")
2. Enter the text to **Replace** with (e.g., "Icon")
3. Toggle **Case sensitive** if needed
4. Click **Rename**

**Example:**

- Find: `old` → Replace: `new`
- "old-button" becomes "new-button"

#### Tab 2: Transform (Case Conversion)

Convert layer names to different case styles:

- **Title Case**: Each Word Capitalized
- **Sentence case**: First word capitalized
- **Header-Case**: Words-Separated-By-Dashes
- **PascalCase**: WordsWithoutSpaces
- **camelCase**: firstWordLowercaseRestCapitalized
- **lowercase**: all lowercase
- **UPPERCASE**: ALL UPPERCASE
- **CONSTANT_CASE**: WORDS_SEPARATED_BY_UNDERSCORES
- **snake_case**: words_separated_by_underscores
- **param-case**: words-separated-by-dashes
- **path/case**: words/separated/by/slashes
- **dot.case**: words.separated.by.dots
- **no case**: words separated by spaces

Select your desired case style and click **Transform**.

#### Tab 3: Clean

Remove unwanted characters from layer names:

- **Clean all special characters**: Removes everything except letters, numbers, spaces, dashes, and underscores
- **Clean all digits**: Removes all numbers (0-9)
- **Clean all extra spaces**: Removes multiple spaces and trims whitespace

Select your cleaning options and click **Clean**.

### 3. Configure Layer Type Filters

At the bottom of the plugin, choose which layer types to rename:

**Available types:**

- Components
- Variants
- Instance
- Frame
- Group
- Section
- Text
- Image
- Line
- Shape
- Vector
- Slice

**Quick actions:**

- **Select all**: Selects all layer types
- **Deselect all**: Deselects all layer types

### 4. Parent Layers Only

Toggle **"Only apply to parent layers"** to:

- ✅ **Enabled**: Only rename the top-level selected layers (default)
- ❌ **Disabled**: Rename selected layers and all their children recursively

### 5. Execute

Click the action button at the bottom:

- **Rename** (for Find & Replace)
- **Transform** (for Case Conversion)
- **Clean** (for Character Cleaning)

The plugin will show a notification with the number of renamed layers.

## Tips

- All layer types are selected by default
- The "Only apply to parent layers" option is enabled by default to prevent unintended changes to nested layers
- You can combine multiple operations: first clean, then transform, then rename
- Use case-sensitive search when you need exact matches
- The plugin works on your current selection, so you can preview changes by selecting a single layer first

## Troubleshooting

**"Please select at least one layer"**

- Make sure you have selected at least one layer in Figma before using the plugin

**No layers were renamed**

- Check if the selected layer types match your selection
- Verify that "Only apply to parent layers" setting matches your intent
- For Find & Replace: ensure the search text exists in the layer names

**Need help?**

- Create a [GitHub Issue](https://github.com/db-ux-design-system/core/issues) for support
