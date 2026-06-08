// utils/generators/gitlab.ts

import { IconData } from "../../types";
import { extractIconBaseName, toHyphenatedKey } from "../helpers";

/**
 * Groups icons by their package field.
 *
 * @param icons - Array of IconData to group
 * @returns Map where keys are package names and values are arrays of icons belonging to that package
 *
 * Requirements: 3.2
 */
export function groupByPackage(icons: IconData[]): Map<string, IconData[]> {
  const packageMap = new Map<string, IconData[]>();

  icons.forEach((icon) => {
    const packageName = icon.package || "unknown";

    if (!packageMap.has(packageName)) {
      packageMap.set(packageName, []);
    }

    packageMap.get(packageName)!.push(icon);
  });

  return packageMap;
}

/**
 * Generates GitLab description JSON files grouped by package.
 *
 * @param icons - Array of IconData to generate descriptions for
 * @param iconType - Type of icons ("functional" or "illustrative")
 * @returns Map where keys are filenames (e.g., "core.json") and values are JSON content strings
 *
 * Requirements: 3.1, 3.2, 3.3, 3.5, 3.6
 */
export function generateGitLabDescriptions(
  icons: IconData[],
  iconType: string,
): Map<string, string> {
  // Group icons by package
  const packageGroups = groupByPackage(icons);
  const result = new Map<string, string>();

  // For each package, generate JSON content
  packageGroups.forEach((packageIcons, packageName) => {
    const descriptionsMap: Record<string, any> = {};

    // Property names to filter out
    const propertyNames = ["size", "variant", "state", "type", "color"];

    // Process each icon in the package
    packageIcons.forEach((iconData) => {
      const baseName = extractIconBaseName(iconData.name);
      const key = toHyphenatedKey(baseName, iconType);

      // Filter out property definitions
      if (
        propertyNames.includes(baseName.toLowerCase()) ||
        baseName.length === 0
      ) {
        console.log(
          `🚫 GitLab Generator: Filtere Property-Definition aus: "${baseName}"`,
        );
        return;
      }

      // Skip duplicates
      if (descriptionsMap[key]) {
        return;
      }

      const parsed = iconData.parsedDescription;

      // Generate description based on icon type
      if (iconType === "functional") {
        descriptionsMap[key] = {
          en: {
            default: parsed.enDefault
              ? parsed.enDefault.split(",").map((s: string) => s.trim())
              : [],
            contextual: parsed.enContextual
              ? parsed.enContextual.split(",").map((s: string) => s.trim())
              : [],
          },
          de: {
            default: parsed.deDefault
              ? parsed.deDefault.split(",").map((s: string) => s.trim())
              : [],
            contextual: parsed.deContextual
              ? parsed.deContextual.split(",").map((s: string) => s.trim())
              : [],
          },
        };
      } else {
        descriptionsMap[key] = {
          en: parsed.en
            ? parsed.en.split(",").map((s: string) => s.trim())
            : [],
          de: parsed.de
            ? parsed.de.split(",").map((s: string) => s.trim())
            : [],
        };
      }
    });

    // Sort icons alphabetically by name
    const sortedKeys = Object.keys(descriptionsMap).sort();
    const sortedDescriptions: Record<string, any> = {};
    sortedKeys.forEach((key) => {
      sortedDescriptions[key] = descriptionsMap[key];
    });

    // Map package name to lowercase filename
    const filename = `${packageName.toLowerCase()}.json`;
    const jsonContent = JSON.stringify(sortedDescriptions, null, "\t");

    result.set(filename, jsonContent);
  });

  return result;
}
