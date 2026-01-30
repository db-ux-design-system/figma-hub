import {
  BASE_COLLECTION_NAME,
  DISPLAY_MODE_COLLECTION_NAME,
  COLORS_COLLECTION_NAME,
} from "../config";

export async function getOrCreateCollections(prefix: string) {
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
  }

  if (!displayCol) {
    const displayColName = `${prefix}-${DISPLAY_MODE_COLLECTION_NAME}`;
    displayCol = figma.variables.createVariableCollection(displayColName);
  }

  if (!colorCol) {
    const colorColName = `${prefix}-${COLORS_COLLECTION_NAME}`;
    colorCol = figma.variables.createVariableCollection(colorColName);
  }

  return { baseCol, displayCol, colorCol };
}

export function setupDisplayModes(
  displayCol: VariableCollection,
  baseCol: VariableCollection,
) {
  console.log("=== setupDisplayModes START ===");
  console.log("displayCol name:", displayCol.name);
  console.log(
    "displayCol modes before:",
    displayCol.modes.map((m) => ({ name: m.name, id: m.modeId })),
  );
  console.log("baseCol name:", baseCol.name);
  console.log(
    "baseCol modes before:",
    baseCol.modes.map((m) => ({ name: m.name, id: m.modeId })),
  );

  // Setup Display Collection (Mode) with Light and Dark modes
  if (displayCol.modes[0].name !== "Light Mode")
    displayCol.renameMode(displayCol.modes[0].modeId, "Light Mode");
  if (!displayCol.modes.find((m) => m.name === "Dark Mode"))
    displayCol.addMode("Dark Mode");

  const lightModeId = displayCol.modes.find(
    (m) => m.name === "Light Mode",
  )!.modeId;
  const darkModeId = displayCol.modes.find(
    (m) => m.name === "Dark Mode",
  )!.modeId;

  console.log(
    "displayCol modes after setup:",
    displayCol.modes.map((m) => ({ name: m.name, id: m.modeId })),
  );

  // Theme collection (baseCol) should only have one mode
  // Rename the default mode to "Value" or keep it as "Mode 1"
  if (baseCol.modes[0].name !== "Value") {
    console.log("Renaming baseCol mode 0 to 'Value'");
    baseCol.renameMode(baseCol.modes[0].modeId, "Value");
  }

  // Remove any additional modes from Theme collection
  while (baseCol.modes.length > 1) {
    console.log("Removing extra mode from baseCol:", baseCol.modes[1].name);
    baseCol.removeMode(baseCol.modes[1].modeId);
  }

  console.log(
    "baseCol modes after setup:",
    baseCol.modes.map((m) => ({ name: m.name, id: m.modeId })),
  );
  console.log("=== setupDisplayModes END ===");

  return { lightModeId, darkModeId };
}

export function setupColorModes(
  colorCol: VariableCollection,
  colorFamilies: string[],
  prefix: string,
) {
  if (colorCol.modes[0].name !== "db-adaptive")
    colorCol.renameMode(colorCol.modes[0].modeId, "db-adaptive");

  const dbAdaptiveModeId = colorCol.modes.find(
    (m) => m.name === "db-adaptive",
  )!.modeId;

  const colorFamilyModeIds: Record<string, string> = {};
  for (const family of colorFamilies) {
    // Check if family already starts with prefix to avoid duplication
    const modeName = family.toLowerCase().startsWith(prefix.toLowerCase() + "-")
      ? family
      : `${prefix}-${family}`;

    let mode = colorCol.modes.find((m) => m.name === modeName);
    if (!mode) {
      const newModeId = colorCol.addMode(modeName);
      colorFamilyModeIds[family] = newModeId;
    } else {
      colorFamilyModeIds[family] = mode.modeId;
    }
  }

  return { dbAdaptiveModeId, colorFamilyModeIds };
}
