# DB Figma Migrate

This plugin handles migration of DB Design System components between major versions. It analyses documents for affected instances and runs automatic or semi-automatic migrations.

## Features

- **Modular migration framework** – New migrations are registered as modules
- **Stamp validation** – Checks the `updated_with` stamp on each component to determine migration eligibility
- **Analysis** – Scans documents for affected instances with configurable scope (Frame, Page, Document)
- **Automatic migration** – Applies transformations directly
- **Semi-automatic migration** – Guides the user through decision points
- **Reports** – Generates migration reports with success/error/skipped status
- **Navigation** – Jumps directly to affected components on the canvas

## Available Migrations

### v5.0.0

#### Slot Introduction

Checks Accordion, Badge and Button instances for overridden text content. Caches the values so they can be restored after a manual instance update.

**Prerequisite**: The component must have the update stamp `4.6` (set by the DB Figma Release plugin).

- Instances with stamp `4.6` → eligible for automatic migration
- Instances with an older or missing stamp → manual migration required

#### Adaptive Size → Density + Device

Splits the combined "Adaptive Size" variable collection into separate Density and Device collections.

## Setup

### Requirements

- Node.js >= 22
- DB Design System libraries with update stamps applied (via the DB Figma Release plugin)

### Installation

```bash
npm install        # in the monorepo root
npm run build:db-figma-migrate
```

### Import into Figma

1. Figma → Plugins → Development → "Import plugin from manifest..."
2. Select `packages/db-figma-migrate/manifest.json`

## Usage

1. Open the plugin
2. Select a release version (e.g. 5.0.0)
3. Choose a migration
4. Set the scope (Frame / Page / Document)
5. **Start analysis** – Scans for affected instances
6. Review the results:
   - Green tags = eligible for migration (correct stamp)
   - Yellow tags = manual migration required
7. **Show** – Jumps to the component on the canvas
8. **Restore content** – Runs the migration

## Technical Details

- **Stamp namespace**: `db_ux`, key: `updated_with`
- **Required stamp for v5**: `4.6`
- **Persistence**: Migration state is stored per document in `sharedPluginData`
- **UI**: React + Tailwind + `@db-ux/react-core-components`
- **Plugin code**: TypeScript, bundled with esbuild
