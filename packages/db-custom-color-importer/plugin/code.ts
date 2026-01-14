import { handleImportJson } from "./utils/variables";

figma.showUI(__html__, { width: 500, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "import-json") {
    await handleImportJson(msg);
  }
};
