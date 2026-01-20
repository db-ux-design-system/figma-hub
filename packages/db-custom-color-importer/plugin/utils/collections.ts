import {
  BASE_COLLECTION_NAME,
  DISPLAY_MODE_COLLECTION_NAME,
  COLORS_COLLECTION_NAME,
} from "../config";

export async function getOrCreateCollections(prefix: string) {
  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();

  // Use original casing from filename for collection names
  const baseColName = `${prefix}-${BASE_COLLECTION_NAME}`;
  const displayColName = `${prefix}-${DISPLAY_MODE_COLLECTION_NAME}`;
  const colorColName = `${prefix}-${COLORS_COLLECTION_NAME}`;

  const baseCol =
    localCollections.find((c) => c.name === baseColName) ||
    figma.variables.createVariableCollection(baseColName);
  const displayCol =
    localCollections.find((c) => c.name === displayColName) ||
    figma.variables.createVariableCollection(displayColName);
  const colorCol =
    localCollections.find((c) => c.name === colorColName) ||
    figma.variables.createVariableCollection(colorColName);

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

  // Sync modes with Theme collection (baseCol)
  // Ensure Theme collection has the same modes
  if (baseCol.modes[0].name !== "Light Mode") {
    console.log("Renaming baseCol mode 0 to 'Light Mode'");
    baseCol.renameMode(baseCol.modes[0].modeId, "Light Mode");
  }
  if (!baseCol.modes.find((m) => m.name === "Dark Mode")) {
    console.log("Adding 'Dark Mode' to baseCol");
    baseCol.addMode("Dark Mode");
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
    const modeName = `${prefix}-${family}`;
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
