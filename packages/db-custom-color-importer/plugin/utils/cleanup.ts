import {
  BASE_COLLECTION_NAME,
  DISPLAY_MODE_COLLECTION_NAME,
  COLORS_COLLECTION_NAME,
} from "../config";

export async function deleteCollections() {
  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();

  for (const col of localCollections) {
    // Check if collection ends with the expected suffixes
    if (col.name.endsWith(`-${BASE_COLLECTION_NAME}`)) {
      // For Theme collection, remove all variables
      if (Array.isArray(col.variableIds)) {
        for (const id of col.variableIds) {
          const v = await figma.variables.getVariableByIdAsync(id);
          if (v) {
            try {
              await v.remove();
            } catch (e) {
              console.warn(`Could not remove variable ${v.name}:`, e);
            }
          }
        }
      }
      // Remove the collection itself
      try {
        await col.remove();
      } catch (e) {
        console.warn(`Could not remove collection ${col.name}:`, e);
      }
    } else if (
      col.name.endsWith(`-${DISPLAY_MODE_COLLECTION_NAME}`) ||
      col.name.endsWith(`-${COLORS_COLLECTION_NAME}`)
    ) {
      // For Mode and Colors collections, remove the entire collection
      try {
        await col.remove();
      } catch (e) {
        console.warn(`Could not remove collection ${col.name}:`, e);
      }
    }
  }
}
