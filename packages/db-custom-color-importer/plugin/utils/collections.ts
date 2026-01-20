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

export function setupDisplayModes(displayCol: VariableCollection) {
  if (displayCol.modes[0].name !== "Light")
    displayCol.renameMode(displayCol.modes[0].modeId, "Light");
  if (!displayCol.modes.find((m) => m.name === "Dark"))
    displayCol.addMode("Dark");

  const lightModeId = displayCol.modes.find((m) => m.name === "Light")!.modeId;
  const darkModeId = displayCol.modes.find((m) => m.name === "Dark")!.modeId;

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
