// utils/scanner.ts

import { IconData, ExportRequest, PackageFrame } from "../types";
import { EXCLUDED_PAGES, isPropertyName } from "../config";
import { parseDescription } from "./parser";
import {
  detectPackageFrames,
  assignPackage,
  assignPackageWithDetails,
} from "./spatial";
import { IconScanError, logDetailedError } from "./errors";

/**
 * Global state: Current icon library type (functional or illustrative)
 */
export let globalIconType = "unknown";

/**
 * Global state: Array of all scanned icon data
 */
export let globalIconData: IconData[] = [];

/**
 * Global state: Last export request made by the user
 */
export let lastExportRequest: ExportRequest | null = null;

/**
 * Updates the last export request in global state.
 * Used to track export history and enable re-export functionality.
 *
 * @param request - The export request to store, or null to clear
 */
export function setLastExportRequest(request: ExportRequest | null) {
  lastExportRequest = request;
}

/**
 * Scans all pages in the Figma document for icon components.
 *
 * This function:
 * 1. Detects icon library type (functional vs illustrative) from file name or component structure
 * 2. Scans all non-excluded pages for icon components
 * 3. Extracts icon metadata (name, category, description)
 * 4. Parses descriptions into structured data
 * 5. Sends results to UI for display
 *
 * Functional icons use Component Sets with variants.
 * Illustrative icons use individual Components.
 *
 * @returns Promise that resolves when scan is complete and UI is updated
 *
 * @example
 * ```typescript
 * await scanIcons();
 * console.log(`Found ${globalIconData.length} icons`);
 * console.log(`Library type: ${globalIconType}`);
 * ```
 */
export async function scanIcons() {
  const fileName = figma.root.name;

  // Send initial progress
  figma.ui.postMessage({
    type: "scan-progress",
    message: "Detecting icon type...",
  });

  let iconType = "unknown";

  // Check file name
  if (fileName.toLowerCase().includes("illustrative")) {
    iconType = "illustrative";
  } else if (
    fileName.toLowerCase().includes("db theme icons") ||
    fileName.toLowerCase().includes("functional")
  ) {
    iconType = "functional";
  } else {
    // Fallback: Analyze first component
    for (const page of figma.root.children) {
      await page.loadAsync();
      const componentSets = page.findAll(
        (node) => node.type === "COMPONENT_SET",
      );

      // If Component Sets are found, it's functional
      if (componentSets.length > 0) {
        iconType = "functional";
        break;
      }

      // Otherwise check for individual Components (= Illustrative)
      const components = page.findAll((node) => node.type === "COMPONENT");

      if (components.length > 0) {
        iconType = "illustrative";
        break;
      }
    }

    if (iconType === "unknown") {
      iconType = "illustrative";
    }
  }

  globalIconType = iconType;

  const iconData: IconData[] = [];
  const totalPages = figma.root.children.length;

  let scannedPages = 0;
  let skippedPages = 0;

  for (const page of figma.root.children) {
    const pageName = page.name;

    const shouldExclude = EXCLUDED_PAGES.some((term) =>
      pageName.toLowerCase().includes(term.toLowerCase()),
    );

    if (shouldExclude) {
      skippedPages++;
      continue;
    }

    scannedPages++;

    // Send progress update
    figma.ui.postMessage({
      type: "scan-progress",
      message: `Scanning page ${scannedPages} of ${totalPages - skippedPages}: ${pageName}`,
      current: scannedPages,
      total: totalPages - skippedPages,
    });

    await page.loadAsync();

    // Detect package frames on this page
    const packageFrames: PackageFrame[] = detectPackageFrames(page);

    const components = page.findAll(
      (node) => node.type === "COMPONENT_SET" || node.type === "COMPONENT",
    );

    for (const comp of components) {
      if (comp.type === "COMPONENT_SET") {
        const componentSet = comp as ComponentSetNode;
        let setName = componentSet.name;

        // Clean set name from Size/Variant suffixes (shouldn't occur, but for safety)
        setName = setName.split(",")[0].trim();
        setName = setName.split("=")[0].trim();

        // Filter out property names (e.g. "Size", "Variant", etc.)
        // These are not real icons, just property definitions
        if (isPropertyName(setName.toLowerCase())) {
          continue;
        }

        // Additional check: If set name is empty or consists only of properties
        if (!setName || setName.length === 0) {
          continue;
        }

        // Check if Component Set name starts with "=" (property without icon name)
        if (
          componentSet.name.trim().startsWith("=") ||
          componentSet.name.trim().match(/^(Size|Variant|State|Type|Color)=/i)
        ) {
          continue;
        }

        // Assign package based on spatial overlap with detailed information
        const packageDetails = assignPackageWithDetails(
          componentSet,
          packageFrames,
        );
        const assignedPackage = packageDetails.package;

        const rawDescription = componentSet.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const variantComponents = componentSet.children.filter(
          (child) => child.type === "COMPONENT",
        ) as ComponentNode[];

        variantComponents.forEach((variant) => {
          const fullName = `${setName}/${variant.name}`;

          const iconEntry: IconData = {
            name: fullName,
            id: variant.id,
            category: pageName,
            description: rawDescription,
            parsedDescription: parsedDescription,
            package: assignedPackage,
          };

          iconData.push(iconEntry);
        });
      } else if (comp.type === "COMPONENT") {
        // Individual component without set
        const component = comp as ComponentNode;
        let componentName = component.name;

        // Clean component name from Size/Variant suffixes (shouldn't occur for illustrative icons)
        componentName = componentName.split(",")[0].trim();
        componentName = componentName.split("=")[0].trim();

        // Assign package based on spatial overlap with detailed information
        const packageDetails = assignPackageWithDetails(
          component,
          packageFrames,
        );
        const assignedPackage = packageDetails.package;

        const rawDescription = component.description || "";
        const parsedDescription = parseDescription(rawDescription, iconType);

        const iconEntry: IconData = {
          name: componentName,
          id: component.id,
          category: pageName,
          description: rawDescription,
          parsedDescription: parsedDescription,
          package: assignedPackage,
        };

        iconData.push(iconEntry);
      }
    }
  }

  globalIconData = iconData;

  figma.ui.postMessage({
    type: "scan-result",
    icons: iconData,
    iconType: iconType,
  });
}
