/**
 * Pure functions for reading, writing, and removing stamp markers
 * in Figma component descriptions.
 *
 * These functions have NO Figma API dependencies and satisfy:
 * - Round-Trip: readStampMarker(writeStampMarker(desc, ver)) === ver
 * - Idempotence: writeStampMarker(writeStampMarker(desc, ver), ver) === writeStampMarker(desc, ver)
 * - Reversibility: removeStampMarker(writeStampMarker(desc, ver)) === desc (when desc has no marker)
 */

/** Regex pattern matching a stamp marker like [version: 1.2.3] */
export const STAMP_PATTERN = /\[version:\s*(\d+\.\d+\.\d+)\]/;

/** Regex for validating a semantic version string */
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Extracts the version string from a stamp marker in the description.
 * Returns null if no stamp marker is found.
 */
export function readStampMarker(description: string): string | null {
  const match = description.match(STAMP_PATTERN);
  return match ? match[1] : null;
}

/**
 * Writes or replaces a stamp marker in the description.
 * - If a marker already exists, it is replaced in-place.
 * - If no marker exists and the description is empty, returns just the marker.
 * - If no marker exists and the description is non-empty, appends a newline + marker.
 */
export function writeStampMarker(description: string, version: string): string {
  const marker = `[version: ${version}]`;

  if (STAMP_PATTERN.test(description)) {
    return description.replace(STAMP_PATTERN, marker);
  }

  if (description === "") {
    return marker;
  }

  return `${description}\n${marker}`;
}

/**
 * Removes the stamp marker from the description and cleans up
 * the preceding newline if present.
 * Returns the original content without the marker.
 */
export function removeStampMarker(description: string): string {
  // Remove marker preceded by a newline
  let result = description.replace(/\n\[version:\s*\d+\.\d+\.\d+\]/, "");

  // If that didn't change anything, remove a standalone marker (no preceding newline)
  if (result === description) {
    result = description.replace(STAMP_PATTERN, "");
  }

  return result;
}

/**
 * Validates whether a string is a valid semantic version (MAJOR.MINOR.PATCH).
 */
export function isValidSemver(version: string): boolean {
  return SEMVER_PATTERN.test(version);
}
