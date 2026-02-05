// utils/spatial.ts
// Spatial utility functions for package detection

import { Bounds, PackageFrame, PACKAGE_NAMES } from "../types";

/**
 * Calculates the intersection area between two bounding boxes.
 *
 * @param iconBounds - The bounding box of the icon
 * @param frameBounds - The bounding box of the package frame
 * @returns The area of intersection in square pixels, or 0 if no overlap
 *
 * Algorithm:
 * 1. Calculate the intersection rectangle by finding:
 *    - Left edge: max of the two left edges
 *    - Right edge: min of the two right edges
 *    - Top edge: max of the two top edges
 *    - Bottom edge: min of the two bottom edges
 * 2. If right <= left or bottom <= top, rectangles don't overlap (return 0)
 * 3. Otherwise, return width * height of intersection rectangle
 *
 * Edge cases handled:
 * - Touching edges (no actual overlap): returns 0
 * - Fully contained rectangles: returns area of smaller rectangle
 * - Partial overlaps: returns intersection area
 * - No overlap: returns 0
 */
export function calculateOverlap(
  iconBounds: Bounds,
  frameBounds: Bounds,
): number {
  // Calculate the boundaries of the intersection rectangle
  const intersectionLeft = Math.max(iconBounds.x, frameBounds.x);
  const intersectionRight = Math.min(
    iconBounds.x + iconBounds.width,
    frameBounds.x + frameBounds.width,
  );
  const intersectionTop = Math.max(iconBounds.y, frameBounds.y);
  const intersectionBottom = Math.min(
    iconBounds.y + iconBounds.height,
    frameBounds.y + frameBounds.height,
  );

  // Check if there's actual overlap
  // If right edge is at or before left edge, or bottom is at or before top, no overlap
  if (
    intersectionRight <= intersectionLeft ||
    intersectionBottom <= intersectionTop
  ) {
    return 0;
  }

  // Calculate and return the intersection area
  const intersectionWidth = intersectionRight - intersectionLeft;
  const intersectionHeight = intersectionBottom - intersectionTop;

  return intersectionWidth * intersectionHeight;
}

/**
 * Detects package frames on a Figma page.
 *
 * Scans all direct children of the page for FrameNodes whose names exactly match
 * one of the predefined package names ("Core", "RI", "InfraGO", "Movas").
 *
 * @param page - The Figma PageNode to scan for package frames
 * @returns Array of PackageFrame objects containing name and spatial bounds
 *
 * Algorithm:
 * 1. Iterate through all direct children of the page
 * 2. Filter for nodes of type "FRAME"
 * 3. Check if frame name exactly matches one of PACKAGE_NAMES
 * 4. Extract x, y, width, height from matching frames
 * 5. Return array of PackageFrame objects
 *
 * Requirements:
 * - Validates: Requirements 1.1, 1.2, 1.3
 * - Detects all FrameNodes with names matching PACKAGE_NAMES
 * - Stores complete spatial bounds (x, y, width, height)
 * - Returns empty array if no package frames found
 */
export function detectPackageFrames(page: PageNode): PackageFrame[] {
  const packageFrames: PackageFrame[] = [];

  // Iterate through all direct children of the page
  for (const child of page.children) {
    // Check if the node is a FrameNode
    if (child.type === "FRAME") {
      const frame = child as FrameNode;

      // Check if the frame name exactly matches one of the package names
      if (PACKAGE_NAMES.includes(frame.name as any)) {
        // Extract spatial bounds
        const packageFrame: PackageFrame = {
          name: frame.name,
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
        };

        packageFrames.push(packageFrame);
      }
    }
  }

  return packageFrames;
}

/**
 * Assigns an icon to a package based on spatial overlap with package frames.
 *
 * Calculates the overlap area between the icon and each package frame, then assigns
 * the icon to the package with the maximum overlap. If no overlap exists with any
 * package frame, returns "unknown".
 *
 * @param icon - The Figma ComponentSetNode or ComponentNode representing the icon
 * @param packageFrames - Array of PackageFrame objects to check for overlap
 * @returns The name of the assigned package, or "unknown" if no overlap
 *
 * Algorithm:
 * 1. Extract icon bounds (x, y, width, height)
 * 2. For each package frame:
 *    a. Calculate overlap area using calculateOverlap
 *    b. Track package with maximum overlap area
 * 3. If multiple packages have equal maximum overlap, use alphabetical tiebreaker
 * 4. If no overlap found (maxOverlap === 0), return "unknown"
 * 5. Otherwise, return the package name with maximum overlap
 *
 * Tiebreaker:
 * - When multiple packages have equal overlap areas, the package name that comes
 *   first alphabetically is selected
 * - This ensures deterministic behavior for edge cases
 *
 * Requirements:
 * - Validates: Requirements 2.2, 2.3, 2.4
 * - Assigns icon to package with largest overlap area
 * - Returns "unknown" for icons with no overlap
 * - Implements alphabetical tiebreaker for equal overlaps
 */
export function assignPackage(
  icon: ComponentSetNode | ComponentNode,
  packageFrames: PackageFrame[],
): string {
  // If no package frames exist, return "unknown"
  if (packageFrames.length === 0) {
    return "unknown";
  }

  // Extract icon bounds
  const iconBounds: Bounds = {
    x: icon.x,
    y: icon.y,
    width: icon.width,
    height: icon.height,
  };

  // Track the package with maximum overlap
  let maxOverlap = 0;
  let assignedPackage = "unknown";

  // Calculate overlap with each package frame
  for (const packageFrame of packageFrames) {
    const frameBounds: Bounds = {
      x: packageFrame.x,
      y: packageFrame.y,
      width: packageFrame.width,
      height: packageFrame.height,
    };

    const overlap = calculateOverlap(iconBounds, frameBounds);

    // Update assigned package if this overlap is greater
    // Or if overlap is equal but package name comes first alphabetically (tiebreaker)
    if (
      overlap > maxOverlap ||
      (overlap === maxOverlap &&
        overlap > 0 &&
        packageFrame.name < assignedPackage)
    ) {
      maxOverlap = overlap;
      assignedPackage = packageFrame.name;
    }
  }

  return assignedPackage;
}

/**
 * Extended version of assignPackage that returns detailed overlap information.
 *
 * This function provides additional information about multiple overlaps for logging purposes.
 *
 * @param icon - The Figma ComponentSetNode or ComponentNode representing the icon
 * @param packageFrames - Array of PackageFrame objects to check for overlap
 * @returns Object containing assigned package, overlap area, and list of all overlapping packages
 */
export function assignPackageWithDetails(
  icon: ComponentSetNode | ComponentNode,
  packageFrames: PackageFrame[],
): {
  package: string;
  maxOverlap: number;
  overlappingPackages: Array<{ name: string; overlap: number }>;
} {
  // If no package frames exist, return "unknown"
  if (packageFrames.length === 0) {
    return {
      package: "unknown",
      maxOverlap: 0,
      overlappingPackages: [],
    };
  }

  // Extract icon bounds
  const iconBounds: Bounds = {
    x: icon.x,
    y: icon.y,
    width: icon.width,
    height: icon.height,
  };

  // Track all overlaps
  const overlappingPackages: Array<{ name: string; overlap: number }> = [];
  let maxOverlap = 0;
  let assignedPackage = "unknown";

  // Calculate overlap with each package frame
  for (const packageFrame of packageFrames) {
    const frameBounds: Bounds = {
      x: packageFrame.x,
      y: packageFrame.y,
      width: packageFrame.width,
      height: packageFrame.height,
    };

    const overlap = calculateOverlap(iconBounds, frameBounds);

    // Track all packages with non-zero overlap
    if (overlap > 0) {
      overlappingPackages.push({ name: packageFrame.name, overlap });
    }

    // Update assigned package if this overlap is greater
    // Or if overlap is equal but package name comes first alphabetically (tiebreaker)
    if (
      overlap > maxOverlap ||
      (overlap === maxOverlap &&
        overlap > 0 &&
        packageFrame.name < assignedPackage)
    ) {
      maxOverlap = overlap;
      assignedPackage = packageFrame.name;
    }
  }

  return {
    package: assignedPackage,
    maxOverlap,
    overlappingPackages,
  };
}
