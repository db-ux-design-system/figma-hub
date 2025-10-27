# Design Token Schema Documentation

This document describes the expected schema for design token JSON files used with the Import Custom Colors Figma plugin.

## Overview

The plugin creates a sophisticated variable collection architecture in Figma based on the imported design tokens, following professional design system patterns.

## JSON Schema

### Root Structure

```json
{
  "colors": {
    "[category-name]": {
      "[token-name]": {
        "$type": "color",
        "$value": "#hex-value"
      }
    }
  }
}
```

### Token Naming Conventions

Each color category should include the following token types for optimal variable collection generation:

#### Numeric Scale (0-14)
- `0` - Darkest color in the scale
- `1` through `13` - Progressive lightness values
- `14` - Lightest color in the scale

#### Semantic Tokens
- `origin-light-default` - Primary color for light theme
- `origin-light-hovered` - Hovered state for light theme
- `origin-light-pressed` - Pressed state for light theme
- `on-origin-light-default` - Contrast color for light theme
- `origin-dark-default` - Primary color for dark theme
- `origin-dark-hovered` - Hovered state for dark theme
- `origin-dark-pressed` - Pressed state for dark theme
- `on-origin-dark-default` - Contrast color for dark theme

#### Transparency Variants
- `transparent-full-light-default` - Fully transparent in light theme
- `transparent-full-light-hovered` - Semi-transparent hovered state
- `transparent-full-light-pressed` - Semi-transparent pressed state
- `transparent-full-dark-default` - Fully transparent in dark theme
- `transparent-full-dark-hovered` - Semi-transparent hovered state
- `transparent-full-dark-pressed` - Semi-transparent pressed state
- `transparent-semi-light-default` - Semi-transparent in light theme
- `transparent-semi-light-hovered` - Semi-transparent hovered state
- `transparent-semi-light-pressed` - Semi-transparent pressed state
- `transparent-semi-dark-default` - Semi-transparent in dark theme
- `transparent-semi-dark-hovered` - Semi-transparent hovered state
- `transparent-semi-dark-pressed` - Semi-transparent pressed state

## Generated Variable Collections

The plugin creates two Figma variable collections:

### 1. Base Colors Collection (Default mode)
Contains all raw color values exactly as defined in the JSON:
- `[category]/0` through `[category]/14`
- `[category]/origin-light-default`
- `[category]/transparent-full-light-default`
- etc.

### 2. Mode Collection (Light Mode / Dark Mode)
Contains semantic variables that alias to Base Colors:

#### Background Variables
- `[category]/bg/basic/level-1/default`
- `[category]/bg/basic/level-1/hovered`
- `[category]/bg/basic/level-1/pressed`

#### Text Variables
- `[category]/text/basic/default`
- `[category]/text/basic/hovered`
- `[category]/text/basic/pressed`

#### Border Variables
- `[category]/border/basic/default`
- `[category]/border/basic/hovered`
- `[category]/border/basic/pressed`

## Alias Mapping Logic

### Light Mode
- **Backgrounds**: Use high numbers (14, 13, 12) for light backgrounds
- **Text**: Use low numbers (1, 2, 3) for dark text on light backgrounds
- **Borders**: Use mid-range values (7) for visible borders

### Dark Mode
- **Backgrounds**: Use low numbers (1, 2, 3) for dark backgrounds
- **Text**: Use high numbers (14, 13, 12) for light text on dark backgrounds
- **Borders**: Use mid-range values (7) for visible borders

This creates an automatic theme switching system where semantic variables automatically resolve to appropriate colors based on the active mode.

## Example Usage

```json
{
  "colors": {
    "primary": {
      "0": {"$type": "color", "$value": "#1a0909"},
      "7": {"$type": "color", "$value": "#b06060"},
      "14": {"$type": "color", "$value": "#fbf9f9"},
      "origin-light-default": {"$type": "color", "$value": "#753e3e"},
      "on-origin-light-default": {"$type": "color", "$value": "#fbf9f9"}
    }
  }
}
```

This would generate:
- Base Colors: `primary/0`, `primary/7`, `primary/14`, etc.
- Semantic Colors: `primary/bg/basic/level-1/default` (aliasing to `primary/14` in light mode, `primary/1` in dark mode)