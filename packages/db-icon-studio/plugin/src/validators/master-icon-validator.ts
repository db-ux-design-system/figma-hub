/**
 * Master Icon Template Validator
 *
 * Validates master icon templates in "Icon templates (open paths)"
 * These are frames with specific sizes (32px, 24px, 20px for functional, 64px for illustrative)
 * that contain a Container frame with the icon content
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  VectorPositionInfo,
} from "../types/index.js";

export class MasterIconValidator {
  // Valid frame sizes for master icons
  private readonly functionalSizes = [32, 24, 20];
  private readonly illustrativeSizes = [64];

  /**
   * Validate a master icon template frame
   */
  validate(frame: FrameNode): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    // Determine icon type based on frame size
    const iconType = this.detectIconType(frame);

    if (!iconType) {
      errors.push({
        message: `Frame size ${frame.width}x${frame.height}px is not a valid master icon size<br>Valid sizes: 32px, 24px, 20px (functional) or 64px (illustrative)`,
        node: frame.name,
      });
      return {
        isValid: false,
        errors,
        warnings,
        vectorPositions,
      };
    }

    // Validate frame size matches expected dimensions
    const sizeErrors = this.validateFrameSize(frame, iconType);
    errors.push(...sizeErrors);

    // Validate container exists and has correct structure
    const containerResult = this.validateContainer(frame, iconType);
    errors.push(...containerResult.errors);
    warnings.push(...containerResult.warnings);
    vectorPositions.push(...containerResult.vectorPositions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      vectorPositions,
    };
  }

  /**
   * Detect icon type based on frame size
   */
  private detectIconType(
    frame: FrameNode,
  ): "functional" | "illustrative" | null {
    const size = Math.round(frame.width);

    if (this.functionalSizes.includes(size)) {
      return "functional";
    }

    if (this.illustrativeSizes.includes(size)) {
      return "illustrative";
    }

    return null;
  }

  /**
   * Validate that the frame has the correct size
   */
  private validateFrameSize(
    frame: FrameNode,
    iconType: "functional" | "illustrative",
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const expectedSizes =
      iconType === "functional" ? this.functionalSizes : this.illustrativeSizes;

    // Check if width and height match
    if (frame.width !== frame.height) {
      errors.push({
        message: `Frame must be square: ${frame.width}x${frame.height}px<br>Expected: ${frame.width}x${frame.width}px`,
        node: frame.name,
      });
    }

    // Check if size is valid
    const size = Math.round(frame.width);
    if (!expectedSizes.includes(size)) {
      errors.push({
        message: `Invalid frame size: ${frame.width}x${frame.height}px<br>Expected sizes for ${iconType}: ${expectedSizes.join("px, ")}px`,
        node: frame.name,
      });
    }

    return errors;
  }

  /**
   * Validate that the frame contains a Container frame with proper structure
   * Note: Ignores helper frames (guidelines, basic shapes, angles, save area)
   */
  private validateContainer(
    frame: FrameNode,
    iconType: "functional" | "illustrative",
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    vectorPositions: VectorPositionInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    // Check if frame has children
    if (!frame.children || frame.children.length === 0) {
      errors.push({
        message: `Frame is empty<br>Expected: Container frame with icon content`,
        node: frame.name,
      });
      return { errors, warnings, vectorPositions };
    }

    // Find Container frame (ignore helper frames like guidelines, basic shapes, etc.)
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
      return { errors, warnings, vectorPositions };
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
      return { errors, warnings, vectorPositions };
    }

    // Validate container content based on icon type
    const contentResult = this.validateContainerContent(
      container,
      frame.name,
      iconType,
      frame.width,
    );
    errors.push(...contentResult.errors);
    warnings.push(...contentResult.warnings);
    vectorPositions.push(...contentResult.vectorPositions);

    return { errors, warnings, vectorPositions };
  }

  /**
   * Validate the content inside the Container frame
   */
  private validateContainerContent(
    container: SceneNode,
    frameName: string,
    iconType: "functional" | "illustrative",
    containerSize: number,
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    vectorPositions: VectorPositionInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    if (!("children" in container)) {
      return { errors, warnings, vectorPositions };
    }

    // Check for vector content (including fills and strokes)
    const hasVectorContent = this.hasVectorNodes(container);

    if (!hasVectorContent) {
      errors.push({
        message: `Container has no vector content<br>Expected: Vector paths, shapes, or groups containing vectors`,
        node: frameName,
      });
    }

    // Validate stroke properties based on icon type and collect position info
    const strokeResult = this.validateStrokes(
      container,
      frameName,
      iconType,
      containerSize,
    );
    errors.push(...strokeResult.errors);
    warnings.push(...strokeResult.warnings);
    vectorPositions.push(...strokeResult.vectorPositions);

    return { errors, warnings, vectorPositions };
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
   * Validate stroke properties for all vectors
   * - Functional icons: 2px (preferred), 1.75px or 1.5px (warning), other values (error)
   * - Illustrative icons: 2px only (error for other values)
   * - Safety zone: Vectors must be at least 3px from container edge (considering stroke width)
   * - Also validates fill-only vectors (without strokes)
   */
  private validateStrokes(
    container: SceneNode,
    frameName: string,
    iconType: "functional" | "illustrative",
    containerSize: number,
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    vectorPositions: VectorPositionInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    const vectors = this.findAllVectorNodesWithPosition(container);

    for (const vectorInfo of vectors) {
      const vector = vectorInfo.node;
      const parentChain = vectorInfo.parentChain;

      // Check if vector has strokes (with strokeWeight > 0)
      const hasStrokes =
        "strokes" in vector &&
        vector.strokes &&
        vector.strokes.length > 0 &&
        "strokeWeight" in vector &&
        (vector.strokeWeight as number) > 0;

      // Check if vector has fills
      const hasFills =
        "fills" in vector && vector.fills && vector.fills.length > 0;

      // Skip vectors that have neither strokes nor fills
      if (!hasStrokes && !hasFills) {
        continue;
      }

      let strokeWeight = 0;

      if (hasStrokes) {
        strokeWeight = vector.strokeWeight as number;

        // Validate stroke width based on icon type
        if (iconType === "functional") {
          if (strokeWeight === 2) {
            // Perfect - no message needed
          } else if (strokeWeight === 1.75 || strokeWeight === 1.5) {
            warnings.push({
              message: `Vector "${vector.name}" has stroke width ${strokeWeight}px. Check if the modified stroke width is necessary.`,
              node: frameName,
              canProceed: true,
            });
          } else {
            errors.push({
              message: `Vector "${vector.name}" has incorrect stroke width: ${strokeWeight}px<br>Expected: 2px (or 1.75px, 1.5px with warning) for functional icons`,
              node: frameName,
            });
          }
        } else if (iconType === "illustrative") {
          if (strokeWeight !== 2) {
            errors.push({
              message: `Vector "${vector.name}" has incorrect stroke width: ${strokeWeight}px<br>Expected: 2px for illustrative icons`,
              node: frameName,
            });
          }
        }
      }

      // Validate safety zone and collect position info for all vectors (stroke or fill)
      const safetyZoneResult = this.validateSafetyZoneAndCollectPosition(
        vector,
        strokeWeight,
        containerSize,
        frameName,
        parentChain,
      );
      errors.push(...safetyZoneResult.errors);
      warnings.push(...safetyZoneResult.warnings);
      if (safetyZoneResult.positionInfo) {
        vectorPositions.push(safetyZoneResult.positionInfo);
      }
    }

    return { errors, warnings, vectorPositions };
  }

  /**
   * Validate that strokes are not in the safety zone AND collect position information
   * Safety zone rules:
   * - Fills: minimum 2px from container edge
   * - Strokes: minimum 3px from container edge
   */
  private validateSafetyZoneAndCollectPosition(
    vector: SceneNode,
    strokeWeight: number,
    containerSize: number,
    frameName: string,
    parentChain: SceneNode[],
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    positionInfo: VectorPositionInfo | null;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let positionInfo: VectorPositionInfo | null = null;

    if (
      !("x" in vector) ||
      !("y" in vector) ||
      !("width" in vector) ||
      !("height" in vector)
    ) {
      return { errors, warnings, positionInfo };
    }

    // Calculate absolute position by adding up all parent offsets
    let absoluteX = vector.x;
    let absoluteY = vector.y;

    for (const parent of parentChain) {
      if ("x" in parent && "y" in parent) {
        absoluteX += parent.x;
        absoluteY += parent.y;
      }
    }

    // Store relative position (as shown in Figma)
    const relativeX = vector.x;
    const relativeY = vector.y;

    // Calculate distances from edges
    // Round to 2 decimal places to avoid floating point precision issues
    const distanceLeft = Math.round(absoluteX * 100) / 100;
    const distanceTop = Math.round(absoluteY * 100) / 100;
    const distanceRight =
      Math.round((containerSize - (absoluteX + vector.width)) * 100) / 100;
    const distanceBottom =
      Math.round((containerSize - (absoluteY + vector.height)) * 100) / 100;

    // Find the direct parent frame (if any) - but exclude the Container itself
    const directParentFrame =
      parentChain.length > 0 &&
      parentChain[parentChain.length - 1].type === "FRAME" &&
      !parentChain[parentChain.length - 1].name
        .toLowerCase()
        .includes("container")
        ? parentChain[parentChain.length - 1]
        : null;

    // Build layer path (names of all parent layers)
    const layerPath = parentChain.map((parent) => parent.name);

    // Determine if vector has strokes or only fills
    const hasStrokes =
      "strokes" in vector &&
      vector.strokes &&
      vector.strokes.length > 0 &&
      strokeWeight > 0;

    // Create position info
    positionInfo = {
      name: vector.name,
      x: absoluteX,
      y: absoluteY,
      relativeX,
      relativeY,
      width: vector.width,
      height: vector.height,
      distanceFromEdges: {
        left: distanceLeft,
        top: distanceTop,
        right: distanceRight,
        bottom: distanceBottom,
      },
      strokeWeight:
        "strokeWeight" in vector ? (vector.strokeWeight as number) : undefined,
      isInFrame: directParentFrame !== null,
      parentFrameName: directParentFrame ? directParentFrame.name : undefined,
      layerPath,
    };

    // Validate safety zone based on vector type
    // Fills: 2px minimum, Strokes: 3px minimum
    const minDistance = hasStrokes ? 3 : 2;
    const vectorType = hasStrokes ? "stroke" : "fill";

    // Check distances from all edges
    // No epsilon needed - we want exact comparison
    const violations: string[] = [];

    if (distanceLeft < minDistance) {
      violations.push(
        `left edge is in safety area (${distanceLeft.toFixed(2)}px, min: ${minDistance}px)`,
      );
    }
    if (distanceTop < minDistance) {
      violations.push(
        `top edge is in safety area (${distanceTop.toFixed(2)}px, min: ${minDistance}px)`,
      );
    }
    if (distanceRight < minDistance) {
      violations.push(
        `right edge is in safety area (${distanceRight.toFixed(2)}px, min: ${minDistance}px)`,
      );
    }
    if (distanceBottom < minDistance) {
      violations.push(
        `bottom edge is in safety area (${distanceBottom.toFixed(2)}px, min: ${minDistance}px)`,
      );
    }

    if (violations.length > 0) {
      errors.push({
        message: `Check position of "${vector.name}" (${vectorType}):<br>${violations.join("<br>")}`,
        node: frameName,
      });
    }

    return { errors, warnings, positionInfo };
  }

  /**
   * Find all vector nodes recursively with their parent chain for absolute position calculation
   */
  private findAllVectorNodesWithPosition(
    node: SceneNode,
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
      // Add current node to parent chain for children
      const newParentChain = [...parentChain, node];

      for (const child of node.children) {
        vectors.push(
          ...this.findAllVectorNodesWithPosition(child, newParentChain),
        );
      }
    }

    return vectors;
  }
}
