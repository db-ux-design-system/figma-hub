import {
  BASE_COLLECTION_NAME,
  DISPLAY_MODE_COLLECTION_NAME,
  COLORS_COLLECTION_NAME,
  MODE_NAMES,
} from "../config";
import { log } from "./logger";

/**
 * Helper function to ensure family name has the correct prefix
 */
function ensurePrefixedFamily(family: string, prefix: string): string {
  return family.toLowerCase().startsWith(prefix.toLowerCase() + "-")
    ? family
    : `${prefix}-${family}`;
}

/**
 * Helper function to create variable groups from a path
 * Keeps original family names but creates nested groups
 * The selectedPrefix is only used for collection names, not variable names
 */
function createVariableGroupPath(
  family: string,
  selectedPrefix: string,
): string {
  // Keep the original family name - don't add selectedPrefix to it
  // Just create the group structure from the existing family name

  // Split by dashes to find potential group structure
  const parts = family.split("-");

  // If we have at least 3 parts (prefix-group-subgroup), try to create nested structure
  if (parts.length >= 3) {
    // Find common prefix patterns
    // Example: "db-poi-db-services" -> ["db", "poi", "db", "services"]
    // We want to group as: "db-poi/db-services"

    // Strategy: Look for repeated prefix patterns
    const result: string[] = [];
    let i = 0;

    while (i < parts.length) {
      // Check if current part + next part forms a known prefix pattern
      if (i < parts.length - 1) {
        const combined = `${parts[i]}-${parts[i + 1]}`;
        // If this looks like a prefix (2 parts), group it
        if (i === 0 || result.length === 0) {
          result.push(combined);
          i += 2;
        } else {
          // Start a new group
          result.push(parts.slice(i).join("-"));
          break;
        }
      } else {
        // Last part, add it
        result.push(parts[i]);
        i++;
      }
    }

    // Join with slashes for nested groups
    return result.join("/");
  }

  // If less than 3 parts, return as-is (keep original family name)
  return family;
}

export async function getOrCreateCollections(prefix: string) {
  log.subsection("Getting or Creating Collections");

  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();

  // First, try to find existing collections with any prefix
  let baseCol = localCollections.find((c) =>
    c.name.endsWith(`-${BASE_COLLECTION_NAME}`),
  );
  let displayCol = localCollections.find((c) =>
    c.name.endsWith(`-${DISPLAY_MODE_COLLECTION_NAME}`),
  );
  let colorCol = localCollections.find((c) =>
    c.name.endsWith(`-${COLORS_COLLECTION_NAME}`),
  );

  // If existing collections found, use them (don't rename)
  // If not found, create new ones with the provided prefix
  if (!baseCol) {
    const baseColName = `${prefix}-${BASE_COLLECTION_NAME}`;
    baseCol = figma.variables.createVariableCollection(baseColName);
    log.info(
      `Created new collection: ${baseColName}`,
      "getOrCreateCollections",
    );
  } else {
    log.info(
      `Using existing collection: ${baseCol.name}`,
      "getOrCreateCollections",
    );
  }

  if (!displayCol) {
    const displayColName = `${prefix}-${DISPLAY_MODE_COLLECTION_NAME}`;
    displayCol = figma.variables.createVariableCollection(displayColName);
    log.info(
      `Created new collection: ${displayColName}`,
      "getOrCreateCollections",
    );
  } else {
    log.info(
      `Using existing collection: ${displayCol.name}`,
      "getOrCreateCollections",
    );
  }

  if (!colorCol) {
    const colorColName = `${prefix}-${COLORS_COLLECTION_NAME}`;
    colorCol = figma.variables.createVariableCollection(colorColName);
    log.info(
      `Created new collection: ${colorColName}`,
      "getOrCreateCollections",
    );
  } else {
    log.info(
      `Using existing collection: ${colorCol.name}`,
      "getOrCreateCollections",
    );
  }

  return { baseCol, displayCol, colorCol };
}

export function setupDisplayModes(
  displayCol: VariableCollection,
  baseCol: VariableCollection,
) {
  log.subsection("Setting up Display Modes");
  log.debug(`Display collection: ${displayCol.name}`, "setupDisplayModes");
  log.debug(`Base collection: ${baseCol.name}`, "setupDisplayModes");

  // Setup Display Collection (Mode) with Light and Dark modes
  if (displayCol.modes[0].name !== MODE_NAMES.LIGHT) {
    displayCol.renameMode(displayCol.modes[0].modeId, MODE_NAMES.LIGHT);
    log.info(`Renamed mode to: ${MODE_NAMES.LIGHT}`, "setupDisplayModes");
  }

  if (!displayCol.modes.find((m) => m.name === MODE_NAMES.DARK)) {
    displayCol.addMode(MODE_NAMES.DARK);
    log.info(`Added mode: ${MODE_NAMES.DARK}`, "setupDisplayModes");
  }

  const lightModeId = displayCol.modes.find(
    (m) => m.name === MODE_NAMES.LIGHT,
  )!.modeId;
  const darkModeId = displayCol.modes.find(
    (m) => m.name === MODE_NAMES.DARK,
  )!.modeId;

  // Theme collection (baseCol) should only have one mode
  if (baseCol.modes[0].name !== MODE_NAMES.BASE) {
    baseCol.renameMode(baseCol.modes[0].modeId, MODE_NAMES.BASE);
    log.info(`Renamed base mode to: ${MODE_NAMES.BASE}`, "setupDisplayModes");
  }

  // Remove any additional modes from Theme collection
  while (baseCol.modes.length > 1) {
    const modeToRemove = baseCol.modes[1];
    log.debug(`Removing extra mode: ${modeToRemove.name}`, "setupDisplayModes");
    baseCol.removeMode(modeToRemove.modeId);
  }

  log.success("Display modes configured", "setupDisplayModes");
  return { lightModeId, darkModeId };
}

export function setupColorModes(
  colorCol: VariableCollection,
  colorFamilies: string[],
  prefix: string,
) {
  log.subsection("Setting up Color Modes");

  if (colorCol.modes[0].name !== MODE_NAMES.DB_ADAPTIVE) {
    colorCol.renameMode(colorCol.modes[0].modeId, MODE_NAMES.DB_ADAPTIVE);
    log.info(`Renamed mode to: ${MODE_NAMES.DB_ADAPTIVE}`, "setupColorModes");
  }

  const dbAdaptiveModeId = colorCol.modes.find(
    (m) => m.name === MODE_NAMES.DB_ADAPTIVE,
  )!.modeId;

  const colorFamilyModeIds: Record<string, string> = {};

  // Log current modes for debugging
  log.debug(
    `Current modes in collection: ${colorCol.modes.map((m) => m.name).join(", ")}`,
    "setupColorModes",
  );
  log.debug(
    `Color families to process: ${colorFamilies.join(", ")}`,
    "setupColorModes",
  );

  // Build a set of expected mode names (without slashes)
  const expectedModeNames = new Set(colorFamilies);

  // Find modes with slashes that have a corresponding non-slash version
  // These are old grouped modes that should be removed
  const modesToRemove = colorCol.modes.filter((m) => {
    if (m.name === MODE_NAMES.DB_ADAPTIVE) return false;
    if (!m.name.includes("/")) return false;

    // Check if there's a non-slash version of this mode name
    // e.g., "db-poi/db-services" -> "db-poi-db-services"
    const nonSlashVersion = m.name.replace(/\//g, "-");
    return expectedModeNames.has(nonSlashVersion);
  });

  for (const mode of modesToRemove) {
    try {
      colorCol.removeMode(mode.modeId);
      log.info(`Removed old grouped mode: ${mode.name}`, "setupColorModes");
    } catch (e) {
      log.warn(`Could not remove mode ${mode.name}: ${e}`, "setupColorModes");
    }
  }

  for (const family of colorFamilies) {
    // Use original family name for mode names (no grouping with slashes)
    const modeName = family;

    let mode = colorCol.modes.find((m) => m.name === modeName);
    if (!mode) {
      try {
        const newModeId = colorCol.addMode(modeName);
        colorFamilyModeIds[family] = newModeId;
        log.info(`Added color family mode: ${modeName}`, "setupColorModes");
      } catch (e) {
        log.error(`Failed to add mode ${modeName}: ${e}`, e, "setupColorModes");
        throw e;
      }
    } else {
      colorFamilyModeIds[family] = mode.modeId;
      log.debug(`Using existing mode: ${modeName}`, "setupColorModes");
    }
  }

  log.success(
    `Configured ${colorFamilies.length} color family modes`,
    "setupColorModes",
  );
  return { dbAdaptiveModeId, colorFamilyModeIds };
}
