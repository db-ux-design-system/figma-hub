import { BASE_COLLECTION_NAME, DISPLAY_MODE_COLLECTION_NAME, COLORS_COLLECTION_NAME } from "../config";

export async function getOrCreateCollections() {
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
  
  const baseCol = localCollections.find((c) => c.name === BASE_COLLECTION_NAME) ||
    figma.variables.createVariableCollection(BASE_COLLECTION_NAME);
  const displayCol = localCollections.find((c) => c.name === DISPLAY_MODE_COLLECTION_NAME) ||
    figma.variables.createVariableCollection(DISPLAY_MODE_COLLECTION_NAME);
  const colorCol = localCollections.find((c) => c.name === COLORS_COLLECTION_NAME) ||
    figma.variables.createVariableCollection(COLORS_COLLECTION_NAME);

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

export function setupColorModes(colorCol: VariableCollection, colorFamilies: string[]) {
  if (colorCol.modes[0].name !== "db-adaptive")
    colorCol.renameMode(colorCol.modes[0].modeId, "db-adaptive");
  
  const dbAdaptiveModeId = colorCol.modes.find((m) => m.name === "db-adaptive")!.modeId;
  
  const colorFamilyModeIds: Record<string, string> = {};
  for (const family of colorFamilies) {
    let mode = colorCol.modes.find((m) => m.name === family);
    if (!mode) {
      const newModeId = colorCol.addMode(family);
      colorFamilyModeIds[family] = newModeId;
    } else {
      colorFamilyModeIds[family] = mode.modeId;
    }
  }
  
  return { dbAdaptiveModeId, colorFamilyModeIds };
}
