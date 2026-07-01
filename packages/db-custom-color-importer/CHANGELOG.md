# Changelog

## [Unreleased]

### Fixed

- **Incorrect color alias**: `on-bg/vibrant/pressed` referenced the wrong
  Foundation key.
  - Before: key `85aadee…2408c` (belongs to `on-bg/inverted/pressed`)
  - Now: correct key `581ec00…616f6`, verified against the Core Foundation
    library.
- **Color precision**: hex values are now imported with full precision.
  - Before: RGB channels were rounded to 2 decimals, which could shift a hex
    value by one step (e.g. `#EBFFE6` became `#EBFFE5`).
  - Now: RGB channels use full precision; only the alpha channel is rounded to
    whole percent (Figma requirement).
  - Note: some older Figma files quantize color variables to ~1% internally.
    This is a file-/platform-level limitation outside the plugin's control; the
    plugin writes the exact value.

### Changed

- **Variable grouping** (breaking): the theme prefix is now split off as its own
  group instead of being kept flat.
  - Before: `dibe-colors/dibe-br-color-01/0`
  - Now: `dibe-colors/dibe/br-color-01/0`
  - Affects the Theme (base) and Mode (display) collections. Adaptive variables
    are unaffected.
- **Processing state**: replaced the custom spinner and misused infotext with a
  proper standalone `DBNotification` (headline + description, `aria-live` for
  screen readers).

### Added

- **Automatic migration of legacy variable names**: on import, variables created
  by earlier versions using the flat naming are renamed to the new grouped
  naming.
  - `dibe-colors/dibe-br-color-01/0` → `dibe-colors/dibe/br-color-01/0`
  - `dibe-br-color-01/<mapping>` → `dibe/br-color-01/<mapping>`
  - Renaming preserves variable IDs and all bindings, so existing designs keep
    working and no duplicates are created on re-import.
  - Safe and idempotent (collision guard); skipped when "Delete existing" is on.
  - The result message reports how many variables were migrated.
- **Flexible prefix selection**: the prefix dialog shows every detected prefix as
  a selectable option (from variable names and/or filename), with free text
  input as a fallback.
- **Smart variable reuse**: existing variables are detected by name and reused
  (values updated) instead of duplicated.
- **Separate collection and variable prefixes**: collections use the chosen
  prefix (e.g. `RI-Theme`, `RI-Mode`, `RI-Colors`) while variables keep their
  original names; grouping is derived from the variable names.

### Removed

- Debug logging that was written to the console during import.

### Technical Details

- New `createVariableGroupPath()` for prefix-based grouping.
- New `migrateLegacyVariableNames()` runs before the variable map is built so
  renamed variables are reused rather than recreated.
- Display mode variables are updated instead of always recreated.
- Logging indicates whether variables were created, updated, or migrated.
