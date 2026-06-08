import type { MigrationDefinition, VersionCheckResult } from "./types";

/**
 * Extracts a version string from a component name or description.
 * Common pattern: component name contains version like "Button/v4.2.0"
 * or description contains "v4.2.0" or "4.2.0".
 */
function extractVersion(text: string): string | null {
  const match = text.match(/v?(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Parses the major version from a semver string.
 * Returns NaN if the string is not a valid version.
 */
function parseMajor(version: string): number {
  const parts = version.split(".");
  return parseInt(parts[0], 10);
}

/**
 * VersionChecker verifies the compatibility of component versions
 * used in the document with the supported source versions.
 */
export class VersionChecker {
  /**
   * Checks component versions against supportedSourceVersions.
   * Calculates majorVersionGap between the current version and the target release version.
   */
  async checkCompatibility(
    definition: MigrationDefinition<unknown>,
    nodes: SceneNode[],
  ): Promise<VersionCheckResult[]> {
    const supportedVersions = definition.supportedSourceVersions ?? [];
    const targetMajor = parseMajor(definition.releaseVersion);
    const results: VersionCheckResult[] = [];

    for (const node of nodes) {
      let currentVersion: string | null = null;

      if (node.type === "INSTANCE") {
        const instanceNode = node as InstanceNode;
        const mainComponent = await instanceNode.getMainComponentAsync();

        if (mainComponent) {
          // Try extracting version from component name first, then description
          currentVersion =
            extractVersion(mainComponent.name) ??
            extractVersion(mainComponent.description ?? "");
        }
      }

      const compatible =
        currentVersion !== null && supportedVersions.includes(currentVersion);

      let majorVersionGap = 0;
      if (currentVersion !== null) {
        const currentMajor = parseMajor(currentVersion);
        if (!isNaN(currentMajor) && !isNaN(targetMajor)) {
          majorVersionGap = Math.abs(targetMajor - currentMajor);
        }
      }

      results.push({
        nodeId: node.id,
        nodeName: node.name,
        currentVersion,
        supportedVersions,
        compatible,
        majorVersionGap,
      });
    }

    return results;
  }
}
