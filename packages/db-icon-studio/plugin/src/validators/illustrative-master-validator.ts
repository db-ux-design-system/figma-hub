/**
 * Illustrative Master Icon Validator
 *
 * Validates illustrative master icon templates (64px) with specific requirements:
 * - Safety zone: 4px (vectors must be at least 5px from edge for strokes)
 * - Stroke width: All strokes must be exactly 2px
 * - Colors: Must have both black (dark gray) and red vectors
 * - No validation for Outline Stroke, Flatten, or Union (master can have open paths)
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from "../types/index.js";

export class IllustrativeMasterValidator {
  private readonly illustrativeSize = 64;
  private readonly safetyZone = 4; // 4px safety zone
  private readonly requiredStrokeWidth = 2; // All strokes must be 2px

  /**
   * Validate an illustrative master icon template frame
   */
  validate(frame: FrameNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    console.log(`[IllustrativeMasterValidator] Validating: ${frame.name}`);

    // Validate frame size
    const sizeErrors = this.validateFrameSize(frame);
    errors.push(...sizeErrors);

    if (sizeErrors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Validate container exists and has correct structure
    const containerResult = this.validateContainer(frame);
    errors.push(...containerResult.errors);
    warnings.push(...containerResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate that the frame has the correct size (64x64px)
   */
  private validateFrameSize(frame: FrameNode): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if width and height match
    if (frame.width !== frame.height) {
      errors.push({
        message: `Frame must be square: ${frame.width}x${frame.height}px<br>Expected: 64x64px`,
        node: frame.name,
      });
    }

    // Check if size is 64px
    const size = Math.round(frame.width);
    if (size !== this.illustrativeSize) {
      errors.push({
        message: `Invalid frame size: ${frame.width}x${frame.height}px<br>Expected: 64x64px for illustrative icons`,
        node: frame.name,
      });
    }

    return errors;
  }

  /**
   * Validate that the frame contains a Container frame with proper structure
   */
  private validateContainer(frame: FrameNode): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if frame has children
    if (!frame.children || frame.children.length === 0) {
      errors.push({
        message: `Frame is empty<br>Expected: Container frame with icon content`,
        node: frame.name,
      });
      return { errors, warnings };
    }

    // Find Container frame
    let container: SceneNode | null = null;

    for (const child of frame.children) {
      if (
        child.type === "FRAME" &&
        child.name.toLowerCase().includes("container")
      ) {
        container = child;
        break;
      }
    }

    if (!container) {
      errors.push({
        message: `No Container frame found<br>Expected: A frame named "Container" with icon content`,
        node: frame.name,
      });
      return { errors, warnings };
    }

    // Check container name
    if (container.name !== "Container") {
      errors.push({
        message: `Container frame should be named "Container"<br>Found: "${container.name}"`,
        node: frame.name,
      });
    }

    // Check container size matches parent frame
    if (
      "width" in container &&
      "height" in container &&
      (container.width !== frame.width || container.height !== frame.height)
    ) {
      errors.push({
        message: `Container size mismatch: ${container.width}x${container.height}px<br>Expected: ${frame.width}x${frame.height}px (same as parent frame)`,
        node: frame.name,
      });
    }

    // Check if container has content
    if (
      !("children" in container) ||
      !container.children ||
      container.children.length === 0
    ) {
      errors.push({
        message: `Container is empty<br>Expected: Vector paths or shapes`,
        node: frame.name,
      });
      return { errors, warnings };
    }

    // Validate container content
    const contentResult = this.validateContainerContent(container, frame.name);
    errors.push(...contentResult.errors);
    warnings.push(...contentResult.warnings);

    return { errors, warnings };
  }

  /**
   * Validate the content inside the Container frame
   */
  private validateContainerContent(
    container: SceneNode,
    frameName: string,
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!("children" in container)) {
      return { errors, warnings };
    }

    // Check for vector content
    const hasVectorContent = this.hasVectorNodes(container);

    if (!hasVectorContent) {
      errors.push({
        message: `Container has no vector content<br>Expected: Vector paths, shapes, or groups containing vectors`,
        node: frameName,
      });
      return { errors, warnings };
    }

    // Validate stroke widths (all must be 2px)
    const strokeErrors = this.validateStrokeWidths(container, frameName);
    errors.push(...strokeErrors);

    // Validate colors (must have both black/dark gray and red)
    const colorErrors = this.validateColors(container, frameName);
    errors.push(...colorErrors);

    // Validate safety zone (4px, so strokes must be at least 5px from edge)
    const safetyZoneErrors = this.validateSafetyZone(container, frameName);

    // Validate total icon size (must fit within safety zone)
    const sizeError = this.validateIconSize(container, frameName);

    // If there are position or size errors, add a note at the beginning
    if (safetyZoneErrors.length > 0 || sizeError) {
      errors.push({
        message: `<p>Note: For strokes, position is measured from path center, not visual edge. Size includes visual outer edge.</p>`,
        node: frameName,
      });
    }

    errors.push(...safetyZoneErrors);
    if (sizeError) {
      errors.push(sizeError);
    }

    return { errors, warnings };
  }

  /**
   * Check if a node or its children contain vector nodes
   */
  private hasVectorNodes(node: SceneNode): boolean {
    const vectorTypes = [
      "VECTOR",
      "ELLIPSE",
      "LINE",
      "RECTANGLE",
      "POLYGON",
      "STAR",
      "BOOLEAN_OPERATION",
    ];

    if (vectorTypes.includes(node.type)) {
      return true;
    }

    if ("children" in node && node.children) {
      for (const child of node.children) {
        if (this.hasVectorNodes(child)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate that all strokes are exactly 2px
   */
  private validateStrokeWidths(
    container: SceneNode,
    frameName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const vectors = this.findAllVectorNodes(container);

    for (const vector of vectors) {
      // Check if vector has strokes
      const hasStrokes =
        "strokes" in vector &&
        vector.strokes &&
        Array.isArray(vector.strokes) &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        (vector.strokeWeight as number) > 0;

      if (hasStrokes) {
        const strokeWeight = vector.strokeWeight as number;

        if (strokeWeight !== this.requiredStrokeWidth) {
          errors.push({
            message: `<strong>Incorrect stroke width: "${vector.name}" is ${strokeWeight.toFixed(2)}px</strong><br>All strokes must be exactly 2px`,
            node: frameName,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate that the icon contains both black (dark gray) and red vectors
   */
  private validateColors(
    container: SceneNode,
    frameName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const vectors = this.findAllVectorNodes(container);

    let hasBlack = false;
    let hasRed = false;

    for (const vector of vectors) {
      // Check fills
      if ("fills" in vector && vector.fills && Array.isArray(vector.fills)) {
        for (const fill of vector.fills) {
          if (fill.type === "SOLID" && fill.color) {
            if (this.isBlackOrDarkGray(fill.color)) {
              hasBlack = true;
            }
            if (this.isRed(fill.color)) {
              hasRed = true;
            }
          }
        }
      }

      // Check strokes
      if (
        "strokes" in vector &&
        vector.strokes &&
        Array.isArray(vector.strokes)
      ) {
        for (const stroke of vector.strokes) {
          if (stroke.type === "SOLID" && stroke.color) {
            if (this.isBlackOrDarkGray(stroke.color)) {
              hasBlack = true;
            }
            if (this.isRed(stroke.color)) {
              hasRed = true;
            }
          }
        }
      }

      if (hasBlack && hasRed) {
        break; // Found both colors, no need to continue
      }
    }

    if (!hasBlack) {
      errors.push({
        message: `<strong>Missing black color</strong><br>Illustrative icons must contain both black and red vectors`,
        node: frameName,
      });
    }

    if (!hasRed) {
      errors.push({
        message: `<strong>Missing red color</strong><br>Illustrative icons must contain both black (or dark gray) and red vectors`,
        node: frameName,
      });
    }

    return errors;
  }

  /**
   * Check if a color is black or dark gray (r, g, b < 0.2)
   */
  private isBlackOrDarkGray(color: RGB): boolean {
    return color.r < 0.2 && color.g < 0.2 && color.b < 0.2;
  }

  /**
   * Check if a color is red (r > 0.7, g < 0.3, b < 0.3)
   */
  private isRed(color: RGB): boolean {
    return color.r > 0.7 && color.g < 0.3 && color.b < 0.3;
  }

  /**
   * Validate safety zone (4px, so strokes must be at least 5px from edge)
   * For strokes: path center must be at least (4px + strokeWidth/2) from edge
   * For fills: fill edge must be at least 4px from edge
   */
  private validateSafetyZone(
    container: SceneNode,
    frameName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const vectors = this.findAllVectorNodesWithPosition(container, container);

    console.log(
      `[IllustrativeMasterValidator] Found ${vectors.length} vectors to check`,
    );

    for (const vectorInfo of vectors) {
      const vector = vectorInfo.node;

      console.log(
        `[IllustrativeMasterValidator] Checking vector: ${vector.name}`,
      );

      // Check if vector has strokes
      const hasStrokes =
        "strokes" in vector &&
        vector.strokes &&
        Array.isArray(vector.strokes) &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        (vector.strokeWeight as number) > 0;

      const strokeWeight = hasStrokes ? (vector.strokeWeight as number) : 0;

      console.log(
        `[IllustrativeMasterValidator] Vector "${vector.name}" has strokes: ${hasStrokes}, strokeWeight: ${strokeWeight}`,
      );

      // Get vector bounds
      const bounds =
        "absoluteRenderBounds" in vector && vector.absoluteRenderBounds
          ? vector.absoluteRenderBounds
          : "absoluteBoundingBox" in vector && vector.absoluteBoundingBox
            ? vector.absoluteBoundingBox
            : null;

      if (!bounds) {
        console.log(
          `[IllustrativeMasterValidator] No bounds available for vector "${vector.name}"`,
        );
        continue;
      }

      // Get container's absolute position
      let containerX = 0;
      let containerY = 0;

      if ("absoluteBoundingBox" in container && container.absoluteBoundingBox) {
        containerX = container.absoluteBoundingBox.x;
        containerY = container.absoluteBoundingBox.y;
      }

      // Calculate position relative to container
      const relX = bounds.x - containerX;
      const relY = bounds.y - containerY;

      console.log(
        `[IllustrativeMasterValidator] Vector "${vector.name}" bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`,
      );
      console.log(
        `[IllustrativeMasterValidator] Container position: x=${containerX}, y=${containerY}`,
      );
      console.log(
        `[IllustrativeMasterValidator] Relative position: x=${relX}, y=${relY}`,
      );

      // Calculate distances from edges
      // absoluteRenderBounds includes the outer edge of strokes
      let distanceLeft = relX;
      let distanceTop = relY;
      let distanceRight = this.illustrativeSize - (relX + bounds.width);
      let distanceBottom = this.illustrativeSize - (relY + bounds.height);

      console.log(
        `[IllustrativeMasterValidator] Distances from outer edge - left: ${distanceLeft}, top: ${distanceTop}, right: ${distanceRight}, bottom: ${distanceBottom}`,
      );

      // For strokes: adjust to measure from path center (add half stroke width)
      // This matches the behavior of functional icons
      if (hasStrokes && strokeWeight > 0) {
        const halfStroke = strokeWeight / 2;
        distanceLeft += halfStroke;
        distanceTop += halfStroke;
        distanceRight += halfStroke;
        distanceBottom += halfStroke;
        console.log(
          `[IllustrativeMasterValidator] Adjusted for stroke (${strokeWeight}px, +${halfStroke}px) - left: ${distanceLeft}, top: ${distanceTop}, right: ${distanceRight}, bottom: ${distanceBottom}`,
        );
      }

      // Minimum distance from path center to container edge
      // For strokes: 4px safety zone + strokeWeight/2
      // For fills: 4px safety zone
      // Examples: 2px stroke → 5px min
      const minDistance = hasStrokes
        ? this.safetyZone + strokeWeight / 2
        : this.safetyZone;

      console.log(
        `[IllustrativeMasterValidator] Minimum distance required: ${minDistance}px`,
      );

      const vectorType = hasStrokes ? "stroke" : "fill";
      const violations: string[] = [];

      if (distanceLeft < minDistance) {
        violations.push(
          `left edge is in safety area (<strong>${distanceLeft.toFixed(2)}px</strong>, min: ${minDistance.toFixed(2)}px)`,
        );
      }
      if (distanceTop < minDistance) {
        violations.push(
          `top edge is in safety area (<strong>${distanceTop.toFixed(2)}px</strong>, min: ${minDistance.toFixed(2)}px)`,
        );
      }
      if (distanceRight < minDistance) {
        violations.push(
          `right edge is in safety area (<strong>${distanceRight.toFixed(2)}px</strong>, min: ${minDistance.toFixed(2)}px)`,
        );
      }
      if (distanceBottom < minDistance) {
        violations.push(
          `bottom edge is in safety area (<strong>${distanceBottom.toFixed(2)}px</strong>, min: ${minDistance.toFixed(2)}px)`,
        );
      }

      if (violations.length > 0) {
        console.log(
          `[IllustrativeMasterValidator] Vector "${vector.name}" violates safety zone: ${violations.join(", ")}`,
        );
        errors.push({
          message: `<strong>Incorrect position: "${vector.name}" (${vectorType})</strong><br>${violations.join("<br>")}<br>Safety zone: ${this.safetyZone}px`,
          node: frameName,
        });
      } else {
        console.log(
          `[IllustrativeMasterValidator] Vector "${vector.name}" is OK`,
        );
      }
    }

    return errors;
  }

  /**
   * Validate that the total icon size fits within the safety zone
   * Maximum size: 60px × 60px (64px - 4px safety zone on each side)
   */
  private validateIconSize(
    container: SceneNode,
    frameName: string,
  ): ValidationError | null {
    const vectors = this.findAllVectorNodesWithPosition(container, container);

    if (vectors.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Get container's absolute position
    let containerX = 0;
    let containerY = 0;

    if ("absoluteBoundingBox" in container && container.absoluteBoundingBox) {
      containerX = container.absoluteBoundingBox.x;
      containerY = container.absoluteBoundingBox.y;
    }

    for (const vectorInfo of vectors) {
      const vector = vectorInfo.node;

      // Get vector bounds (including stroke outer edge)
      const bounds =
        "absoluteRenderBounds" in vector && vector.absoluteRenderBounds
          ? vector.absoluteRenderBounds
          : "absoluteBoundingBox" in vector && vector.absoluteBoundingBox
            ? vector.absoluteBoundingBox
            : null;

      if (!bounds) {
        continue;
      }

      // Calculate position relative to container
      const relX = bounds.x - containerX;
      const relY = bounds.y - containerY;

      minX = Math.min(minX, relX);
      minY = Math.min(minY, relY);
      maxX = Math.max(maxX, relX + bounds.width);
      maxY = Math.max(maxY, relY + bounds.height);
    }

    if (minX === Infinity || minY === Infinity) {
      return null;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Maximum size with safety zone: 64px - 4px on each side = 56px
    const maxSize = this.illustrativeSize - this.safetyZone * 2;

    // Check if icon exceeds maximum size
    const isWidthTooLarge = width > maxSize;
    const isHeightTooLarge = height > maxSize;

    if (isWidthTooLarge || isHeightTooLarge) {
      const widthFormatted = isWidthTooLarge
        ? `<strong>${width.toFixed(2)}px</strong>`
        : `${width.toFixed(2)}px`;
      const heightFormatted = isHeightTooLarge
        ? `<strong>${height.toFixed(2)}px</strong>`
        : `${height.toFixed(2)}px`;

      return {
        message: `<strong>Icon size too large:</strong> ${widthFormatted} × ${heightFormatted}<br>Maximum: ${maxSize}px × ${maxSize}px (with ${this.safetyZone}px safety zone)`,
        node: frameName,
      };
    }

    return null;
  }

  /**
   * Find all vector nodes recursively
   */
  private findAllVectorNodes(node: SceneNode): SceneNode[] {
    const vectors: SceneNode[] = [];
    const vectorTypes = [
      "VECTOR",
      "ELLIPSE",
      "LINE",
      "RECTANGLE",
      "POLYGON",
      "STAR",
      "BOOLEAN_OPERATION",
    ];

    if (vectorTypes.includes(node.type)) {
      vectors.push(node);
    }

    if ("children" in node && node.children) {
      for (const child of node.children) {
        vectors.push(...this.findAllVectorNodes(child));
      }
    }

    return vectors;
  }

  /**
   * Find all vector nodes recursively with their parent chain
   */
  private findAllVectorNodesWithPosition(
    node: SceneNode,
    containerNode: SceneNode,
    parentChain: SceneNode[] = [],
  ): Array<{ node: SceneNode; parentChain: SceneNode[] }> {
    const vectors: Array<{ node: SceneNode; parentChain: SceneNode[] }> = [];
    const vectorTypes = [
      "VECTOR",
      "ELLIPSE",
      "LINE",
      "RECTANGLE",
      "POLYGON",
      "STAR",
      "BOOLEAN_OPERATION",
    ];

    if (vectorTypes.includes(node.type)) {
      vectors.push({ node, parentChain: [...parentChain] });
    }

    if ("children" in node && node.children) {
      const newParentChain =
        node === containerNode ? [] : [...parentChain, node];

      for (const child of node.children) {
        vectors.push(
          ...this.findAllVectorNodesWithPosition(
            child,
            containerNode,
            newParentChain,
          ),
        );
      }
    }

    return vectors;
  }
}
