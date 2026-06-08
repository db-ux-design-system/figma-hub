# Scripts

Utility scripts for the figma-hub monorepo.

---

## export-plugins

Copies built `db-*` Figma plugins to a target directory so they can be shared with others (e.g. via a synced SharePoint folder) or imported into Figma from a separate location.

### What It Does

For each selected plugin the script copies:

- `manifest.json`
- `dist/index.js` (plugin code)
- `dist/index.html` (UI)

The copied manifest is modified automatically:

- Any leading emoji is replaced with 📦 so the exported version is distinguishable from the local development version in Figma

### Usage

```bash
# Export one or multiple specific plugins (to default target)
npm run export-plugins -- db-figma-migrate
npm run export-plugins -- db-figma-migrate db-figma-release

# Export all db-* plugins
npm run export-plugins -- --all

# Export to a custom directory
npm run export-plugins -- ~/my-folder db-figma-migrate

# List available plugins
npm run export-plugins -- --help
```

### Configuration

The default target directory can be set via the `PLUGIN_EXPORT_DIR` variable in `.env`:

```dotenv
PLUGIN_EXPORT_DIR=~/Library/CloudStorage/OneDrive-Company/path/to/shared/folder
```

If `PLUGIN_EXPORT_DIR` is not set, plugins are exported to `dist-plugins/` in the project root.

A target directory passed as a CLI argument takes precedence over the `.env` value.

### Requirements

- Plugins must be built before exporting (`npm run build` or the individual `build:*` scripts)
- The script only considers packages whose folder name starts with `db-`
