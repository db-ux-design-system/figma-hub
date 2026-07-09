# DB Figma Release

This plugin manages release workflows for DB Design System libraries. It stamps components with version numbers and maintains the changelog.

## Modules

### Stamping

Writes a version number (`updated_with`) as `sharedPluginData` onto components and component sets. This stamp is used by other plugins (e.g. DB Figma Migrate) to check compatibility.

- **Stamp all** – Sets the version on all publishable components in the document
- **Stamp selection** – Only the currently selected components
- **Stamp by IDs** – Targeted selection via the component list
- **Update status** – Refreshes the overview table on the changelog page
- **Clear data** – Removes all plugin data from components and root

### Changelog

Reads the version history of the current library via the Figma REST API and generates release notes.

- **Load version history** – Fetches all labeled versions of the current library
- **Filter merges** – Shows only merges since the last publish, auto-selected
- **Generate release note** – Creates a formatted release note from selected merges
- **Scan changed components** – Detects changed components, grouped by page
- **Write to changelog** – Creates a new entry in the changelog frame of the Figma file
- **Copy to clipboard** – For external use

## Setup

### Requirements

- Node.js >= 22
- Access to the DB Design System libraries

### Installation

```bash
npm install        # in the monorepo root
npm run build:db-figma-release
```

### Import into Figma

1. Figma → Plugins → Development → "Import plugin from manifest..."
2. Select `packages/db-figma-release/manifest.json`

### Configuration

On first launch in a library file:

1. **API Token** – Enter a Figma Personal Access Token under Settings
2. **File detection** – The plugin automatically recognises known libraries by document name. For unknown files, a share link can be pasted.

### Known Libraries

The following libraries are hardcoded in `plugin/config.ts`:

- Core Foundation
- Core Components
- Core Lab

Additional libraries can be added via a Figma share link (persisted per user).

## Technical Details

- **Stamp format**: `MAJOR.MINOR` (e.g. `4.6`)
- **Namespace**: `db_ux`
- **Storage**: `sharedPluginData` on components + root-level version map
- **API**: Figma REST API for version history (`/v1/files/{key}/versions`)
- **UI**: React + Tailwind + `@db-ux/react-core-components`
