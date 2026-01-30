import { handleImportJson } from "./utils/variables";

figma.showUI(__html__, { width: 500, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "check-existing-prefix") {
    await checkExistingPrefix(msg);
  } else if (msg.type === "import-json") {
    await handleImportJson(msg);
  }
};

async function checkExistingPrefix(msg: { proposedPrefix: string }) {
  try {
    const localCollections =
      await figma.variables.getLocalVariableCollectionsAsync();

    // Look for existing Theme, Mode, or Colors collections
    const existingCollections = localCollections.filter(
      (c) =>
        c.name.endsWith("-Theme") ||
        c.name.endsWith("-Mode") ||
        c.name.endsWith("-Colors"),
    );

    if (existingCollections.length > 0) {
      // Extract prefix from first existing collection
      const firstCollection = existingCollections[0];
      const existingPrefix = firstCollection.name.split("-")[0].toLowerCase();
      const proposedPrefix = msg.proposedPrefix.toLowerCase();

      // If prefixes are different, send warning
      if (existingPrefix !== proposedPrefix && existingPrefix !== "custom") {
        figma.ui.postMessage({
          existingPrefix: existingPrefix,
        });
      }
    }
  } catch (e) {
    console.error("Error checking existing prefix:", e);
  }
}
