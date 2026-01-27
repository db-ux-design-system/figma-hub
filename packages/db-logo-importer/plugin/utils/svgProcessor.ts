/**
 * Validates if the provided text contains valid SVG markup
 *
 * @param svgText - The text to validate
 * @returns true if valid SVG markup is detected
 */
export function isValidSVG(svgText: string | null | undefined): boolean {
  return Boolean(svgText && svgText.includes("<svg"));
}

/**
 * Cleans a filename by removing the file extension
 *
 * @param filename - The filename to clean
 * @param fallback - Fallback name if filename is not provided
 * @returns Cleaned filename without extension
 */
export function cleanFilename(
  filename: string | undefined,
  fallback = "Imported Logo"
): string {
  return (filename || fallback).replace(/\.[^/.]+$/, "");
}

/**
 * Processes and flattens vector layers within an SVG frame
 * Renames specific layers according to DB branding conventions:
 * - Multiple "Vector" children → "Logo Addition"
 * - GROUP children → "DB Logo"
 *
 * @param svgNode - The SVG frame node to process
 */
export function processAndFlattenLayers(svgNode: FrameNode): void {
  if (svgNode.type !== "FRAME") {
    return;
  }

  // Flatten and rename vector children
  const vectors = svgNode.children.filter(
    (child) => child.type === "VECTOR" && child.name === "Vector"
  ) as VectorNode[];

  if (vectors.length > 0) {
    const flattened = figma.flatten(vectors, svgNode);
    flattened.name = "Logo Addition";
  }

  // Flatten and rename group children
  const group = svgNode.children.find((child) => child.type === "GROUP") as
    | GroupNode
    | undefined;

  if (group) {
    const flattenedGroup = figma.flatten([group], svgNode);
    flattenedGroup.name = "DB Logo";
  }
}
