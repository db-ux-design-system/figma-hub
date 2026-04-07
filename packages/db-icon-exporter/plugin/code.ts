// code.ts

import {
  scanIcons,
  globalIconData,
  globalIconType,
  lastExportRequest,
} from "./utils/scanner";
import {
  exportFullWithAssets,
  exportInfoOnly,
  exportChangelogOnly,
} from "./utils/exporter";
import { UI_CONFIG, PROPERTY_NAMES } from "./config";
import { getUserFriendlyErrorMessage, logDetailedError } from "./utils/errors";
import { SelectedIconWithStatus } from "./types";

figma.showUI(__html__, {
  width: UI_CONFIG.WINDOW_WIDTH,
  height: UI_CONFIG.WINDOW_HEIGHT,
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === "UI_READY") {
    try {
      await scanIcons();
    } catch (error) {
      logDetailedError(error, "scanIcons");
      const userMessage = getUserFriendlyErrorMessage(error);
      figma.ui.postMessage({
        type: "error",
        message: userMessage,
      });
    }
  } else if (msg.type === "LOG_SELECTED_ICONS") {
    // Logging functionality removed for performance
  } else if (msg.type === "SELECT_FROM_EXPORT_PAGE") {
    if (globalIconData.length === 0) {
      figma.ui.postMessage({
        type: "error",
        message: "Please scan icons first before loading export page.",
      });
      return;
    }

    try {
      const exportPage = figma.root.children.find(
        (page) => page.name === "🚀 Icon Export",
      );

      if (!exportPage) {
        figma.ui.postMessage({
          type: "error",
          message: "No export page found. Please perform an export first.",
        });
        return;
      }

      await exportPage.loadAsync();

      // Find Marketing Frame (contains all icons, not separated by packages)
      const marketingFrame = exportPage.findOne(
        (n) => n.type === "FRAME" && n.name === "Marketingportal",
      ) as FrameNode;

      if (!marketingFrame) {
        figma.ui.postMessage({
          type: "error",
          message: "No marketing frame found on export page.",
        });
        return;
      }

      // Collect all icon IDs from Marketing Frame
      const exportIconSetIds = new Set<string>();
      const exportComponentIds = new Set<string>();

      const instances = marketingFrame.findAll(
        (n) => n.type === "INSTANCE",
      ) as InstanceNode[];

      for (const instance of instances) {
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent) {
          // Functional Icons: Component is part of a Component Set
          if (mainComponent.parent?.type === "COMPONENT_SET") {
            const componentSet = mainComponent.parent as ComponentSetNode;
            const setName = componentSet.name
              .split(",")[0]
              .split("=")[0]
              .trim();

            // Filter out property definitions
            const isProperty =
              (PROPERTY_NAMES as readonly string[]).includes(
                setName.toLowerCase(),
              ) ||
              setName.length === 0 ||
              componentSet.name.trim().startsWith("=") ||
              componentSet.name
                .trim()
                .match(/^(Size|Variant|State|Type|Color)=/i);

            if (!isProperty) {
              exportIconSetIds.add(componentSet.id);
            }
          } else {
            // Illustrative Icons: Component is standalone
            exportComponentIds.add(mainComponent.id);
          }
        }
      }

      // Find all variants of these icon sets in globalIconData
      const iconsWithData: typeof globalIconData = [];

      // Reuse PROPERTY_NAMES from config
      for (const icon of globalIconData) {
        // Filter out property definitions here
        // For functional icons: "SetName/Variant" → check "SetName"
        // For illustrative icons: "ComponentName" → check "ComponentName"
        const iconBaseName = icon.name.split("/")[0].split("=")[0].trim();
        const isProperty =
          (PROPERTY_NAMES as readonly string[]).includes(
            iconBaseName.toLowerCase(),
          ) || iconBaseName.length === 0;

        if (isProperty) {
          continue;
        }

        const node = await figma.getNodeByIdAsync(icon.id);
        if (node) {
          // Functional Icons: Check if Component Set ID is present
          if (
            node.parent?.type === "COMPONENT_SET" &&
            exportIconSetIds.has(node.parent.id)
          ) {
            iconsWithData.push(icon);
          }
          // Illustrative Icons: Check if Component ID is present
          else if (
            node.type === "COMPONENT" &&
            exportComponentIds.has(node.id)
          ) {
            iconsWithData.push(icon);
          }
        }
      }

      figma.ui.postMessage({
        type: "select-export-page-icons",
        icons: iconsWithData,
      });
    } catch (error) {
      console.error("❌ Error loading export page:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Error: ${error}`,
      });
    }
  } else if (msg.type === "EXPORT_FULL") {
    await exportFullWithAssets(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType,
      msg.iconStatuses,
    );
  } else if (msg.type === "EXPORT_INFO_ONLY") {
    await exportInfoOnly(
      msg.selectedIconIds,
      msg.version,
      msg.generateOverview,
      globalIconType,
    );
  } else if (msg.type === "EXPORT_CHANGELOG_ONLY") {
    await exportChangelogOnly(
      msg.selectedIconIds,
      msg.version,
      globalIconType,
      msg.iconStatuses,
    );
  }
};

setTimeout(() => {
  scanIcons();
}, UI_CONFIG.INIT_SCAN_DELAY);
