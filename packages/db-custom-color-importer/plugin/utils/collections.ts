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
  for (const family of colorFamilies) {
    const modeName = ensurePrefixedFamily(family, prefix);

    let mode = colorCol.modes.find((m) => m.name === modeName);
    if (!mode) {
      const newModeId = colorCol.addMode(modeName);
      colorFamilyModeIds[family] = newModeId;
      log.info(`Added color family mode: ${modeName}`, "setupColorModes");
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
