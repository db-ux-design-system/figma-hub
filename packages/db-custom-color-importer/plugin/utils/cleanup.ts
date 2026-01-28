import { BASE_COLLECTION_NAME, DISPLAY_MODE_COLLECTION_NAME, COLORS_COLLECTION_NAME } from "../config";

export async function deleteCollections() {
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
  
  for (const col of localCollections) {
    if (col.name === BASE_COLLECTION_NAME) {
      if (Array.isArray(col.variableIds)) {
        for (const id of col.variableIds) {
          const v = await figma.variables.getVariableByIdAsync(id);
          if (v && v.name.startsWith("colors/")) {
            try {
              await v.remove();
            } catch {}
          }
        }
      }
    } else if (col.name === DISPLAY_MODE_COLLECTION_NAME || col.name === COLORS_COLLECTION_NAME) {
      await col.remove();
    }
  }
}
