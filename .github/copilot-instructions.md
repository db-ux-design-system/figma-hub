# Copilot Instructions for Packages

This folder contains multiple Figma plugins and widgets for the DB UX Design System. Each package follows a consistent structure and pattern.

## Package Structure

Each package in this folder follows this structure:
```
package-name/
├── package.json          # Main package configuration with workspaces
├── manifest.json         # Figma plugin/widget manifest
├── index.html           # Built UI file (generated)
├── index.js             # Built plugin code (generated)
├── plugin/              # Plugin/widget logic
│   ├── package.json     # Plugin-specific dependencies and build scripts
│   ├── tsconfig.json    # TypeScript configuration
│   └── src/
│       └── index.ts     # Main plugin entry point
└── ui/                  # React-based UI (if applicable)
    ├── package.json     # UI-specific dependencies and build scripts
    ├── vite.config.ts   # Vite configuration for UI build
    ├── tsconfig.json    # TypeScript configuration
    └── src/
        └── index.tsx    # Main UI entry point
```

## Existing Packages

- **auto-sync**: Widget for synchronizing design tokens
- **codegen**: Plugin for generating code from designs
- **design-migration**: Plugin for migrating design system components
- **handover**: Widget for creating design handover documentation
- **inspect**: Plugin for inspecting design elements
- **shared**: Common utilities and types used across packages

## Development Guidelines

### Creating a New Package

1. Follow the existing package structure pattern
2. Use the same build tools (esbuild for plugin, vite for UI)
3. Include proper TypeScript configurations
4. Add appropriate scripts to root package.json
5. Use shared utilities from the `shared` package when possible

### Plugin Development (plugin/ folder)

- Use TypeScript with `@figma/plugin-typings`
- Main entry point should handle `figma.showUI()` for UI-based plugins
- Use `figma.ui.onmessage` for UI communication
- Use esbuild for building with ES6 target
- Follow ESLint configuration with Figma plugin rules

### UI Development (ui/ folder)

- Use React with TypeScript
- Use Vite with singlefile plugin to generate inline HTML
- Use Tailwind CSS for styling with DB design tokens
- Use `@db-ux/react-core-components` for UI components
- Communication with plugin via `parent.postMessage()`

### Build Process

- Plugin builds to `../index.js` in package root
- UI builds to `../index.html` in package root
- Use `npm-run-all` for parallel builds
- Include watch modes for development

### Message Communication Pattern

Use the shared message pattern:
```typescript
// From UI to Plugin
parent.postMessage({ pluginMessage: { type: "action", data: payload } }, "*");

// From Plugin to UI
figma.ui.postMessage({ type: "response", data: result });
```

### Code Quality

- Use ESLint with TypeScript and Figma plugin rules
- Follow existing code patterns and conventions
- Use proper TypeScript types, especially for Figma API
- Include error handling for user interactions

### Dependencies

- Prefer shared dependencies in root package.json when possible
- Keep package-specific dependencies minimal
- Use exact versions for design system components
- Avoid duplicating build tools across packages

## Common Patterns

### Plugin Entry Point
```typescript
import { handlePluginLogic } from "./plugin-logic";

if (figma.editorType === "figma") {
  handlePluginLogic();
}
```

### UI Message Handling
```typescript
useEffect(() => {
  onmessage = (event: MessageEvent) => {
    const message = event.data.pluginMessage;
    // Handle different message types
  };
}, []);
```

### Build Scripts
```json
{
  "scripts": {
    "build": "npm-run-all --parallel build:*",
    "build:code": "npm run build -w=package-name-code -- --minify",
    "build:ui": "npm run build -w=package-name-ui",
    "dev": "npm-run-all --parallel dev:*",
    "dev:code": "npm run dev -w=package-name-code",
    "dev:ui": "npm run dev -w=package-name-ui"
  }
}
```