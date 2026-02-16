import {
  BASE_COLLECTION_NAME,
  DISPLAY_MODE_COLLECTION_NAME,
  COLORS_COLLECTION_NAME,
} from "../config";
import { log } from "./logger";

export async function deleteCollections() {
  log.subsection("Deleting Existing Collections");

  const localCollections =
    await figma.variables.getLocalVariableCollectionsAsync();

  // Collect all deletion promises
  const deletionPromises: Promise<boolean>[] = [];

  for (const col of localCollections) {
    // Check if collection ends with the expected suffixes
    if (col.name.endsWith(`-${BASE_COLLECTION_NAME}`)) {
      // For Theme collection, remove all variables first
      if (Array.isArray(col.variableIds)) {
        // Delete all variables in parallel
        const variableDeletionPromises = col.variableIds.map(async (id) => {
          try {
            const v = await figma.variables.getVariableByIdAsync(id);
            if (v) {
              await v.remove();
              return true;
            }
          } catch (e) {
            log.warn(
              `Could not remove variable with id ${id}`,
              "deleteCollections",
            );
          }
          return false;
        });

        // Wait for all variables to be deleted
        await Promise.all(variableDeletionPromises);
      }

      // Then remove the collection itself
      deletionPromises.push(
        (async () => {
          try {
            await col.remove();
            log.info(`Deleted collection: ${col.name}`, "deleteCollections");
            return true;
          } catch (e) {
            log.warn(
              `Could not remove collection ${col.name}`,
              "deleteCollections",
            );
            return false;
          }
        })(),
      );
    } else if (
      col.name.endsWith(`-${DISPLAY_MODE_COLLECTION_NAME}`) ||
      col.name.endsWith(`-${COLORS_COLLECTION_NAME}`)
    ) {
      // For Mode and Colors collections, remove the entire collection
      deletionPromises.push(
        (async () => {
          try {
            await col.remove();
            log.info(`Deleted collection: ${col.name}`, "deleteCollections");
            return true;
          } catch (e) {
            log.warn(
              `Could not remove collection ${col.name}`,
              "deleteCollections",
            );
            return false;
          }
        })(),
      );
    }
  }

  // Wait for all collections to be deleted in parallel
  const results = await Promise.all(deletionPromises);
  const deletedCount = results.filter((success) => success).length;

  log.success(`Deleted ${deletedCount} collections`, "deleteCollections");
}
