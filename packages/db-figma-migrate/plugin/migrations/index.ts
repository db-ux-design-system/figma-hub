/**
 * Barrel-Datei für Auto-Discovery aller Migrationen.
 *
 * Neue Migrationen werden hier als Re-Export hinzugefügt.
 * Der Plugin-Kern importiert diese Datei und registriert
 * alle exportierten MigrationDefinitions automatisch.
 */
export { default as slotIntroduction } from "./v5/slot-introduction";
