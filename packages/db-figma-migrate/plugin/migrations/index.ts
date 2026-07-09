/**
 * Barrel file for auto-discovery of all migrations.
 *
 * New migrations are added here as re-exports.
 * The plugin core imports this file and registers
 * all exported MigrationDefinitions automatically.
 */
export { default as slotIntroduction } from "./v5/slot-introduction";
