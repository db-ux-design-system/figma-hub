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
  ValidationInformation,
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
    const information: ValidationInformation[] = [];
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
        information,
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
    if (containerResult.information) {
      information.push(...containerResult.information);
    }
    vectorPositions.push(...containerResult.vectorPositions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      information,
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
    information?: ValidationInformation[];
    vectorPositions: VectorPositionInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const information: ValidationInformation[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    // Check if frame has children
    if (!frame.children || frame.children.length === 0) {
      errors.push({
        message: `Frame is empty<br>Expected: Container frame with icon content`,
        node: frame.name,
      });
      return { errors, warnings, information, vectorPositions };
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
      return { errors, warnings, information, vectorPositions };
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
      return { errors, warnings, information, vectorPositions };
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
    if (contentResult.information) {
      information.push(...contentResult.information);
    }
    vectorPositions.push(...contentResult.vectorPositions);

    return { errors, warnings, information, vectorPositions };
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
    information?: ValidationInformation[];
    vectorPositions: VectorPositionInfo[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const information: ValidationInformation[] = [];
    const vectorPositions: VectorPositionInfo[] = [];

    if (!("children" in container)) {
      return { errors, warnings, information, vectorPositions };
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

    // Check for vectors positioned too close together (0-1px apart)
    const proximityInformation = this.checkVectorProximity(
      container,
      frameName,
    );
    information.push(...proximityInformation);

    // Calculate and check total icon content size
    const sizeResult = this.calculateIconContentSize(
      container,
      frameName,
      containerSize,
    );
    if (sizeResult.error) {
      errors.push(sizeResult.error);
    }
    if (sizeResult.information) {
      information.push(sizeResult.information);
    }

    return { errors, warnings, information, vectorPositions };
  }

  /**
   * Calculate the total size of all icon content (including stroke outer edges)
   * Returns error if icon is too large, information if pixels are uneven
   */
  private calculateIconContentSize(
    container: SceneNode,
    frameName: string,
    containerSize: number,
  ): {
    error?: ValidationError;
    information?: ValidationInformation;
  } {
    const vectors = this.findAllVectorNodesWithPosition(container, container);

    if (vectors.length === 0) {
      return {};
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
    } else if ("x" in container && "y" in container) {
      containerX = container.x;
      containerY = container.y;
    }

    for (const vectorInfo of vectors) {
      const vector = vectorInfo.node;

      // Get vector bounds
      const bounds =
        "absoluteRenderBounds" in vector && vector.absoluteRenderBounds
          ? vector.absoluteRenderBounds
          : "absoluteBoundingBox" in vector && vector.absoluteBoundingBox
            ? vector.absoluteBoundingBox
            : null;

      if (!bounds) {
        // Fallback: calculate from relative position
        if (
          !(
            "x" in vector &&
            "y" in vector &&
            "width" in vector &&
            "height" in vector
          )
        ) {
          continue;
        }

        let x = vector.x;
        let y = vector.y;

        // Add parent positions
        for (const parent of vectorInfo.parentChain) {
          if ("x" in parent && "y" in parent) {
            x += parent.x;
            y += parent.y;
          }
        }

        // Check for stroke
        const strokeWeight =
          "strokes" in vector &&
          vector.strokes &&
          Array.isArray(vector.strokes) &&
          vector.strokes.length > 0 &&
          "strokeWeight" in vector &&
          (vector.strokeWeight as number) > 0
            ? (vector.strokeWeight as number)
            : 0;

        const halfStroke = strokeWeight / 2;

        minX = Math.min(minX, x - halfStroke);
        minY = Math.min(minY, y - halfStroke);
        maxX = Math.max(maxX, x + vector.width + halfStroke);
        maxY = Math.max(maxY, y + vector.height + halfStroke);
      } else {
        // Use absolute bounds (already includes stroke)
        const relX = bounds.x - containerX;
        const relY = bounds.y - containerY;

        minX = Math.min(minX, relX);
        minY = Math.min(minY, relY);
        maxX = Math.max(maxX, relX + bounds.width);
        maxY = Math.max(maxY, relY + bounds.height);
      }
    }

    if (minX === Infinity || minY === Infinity) {
      return {};
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Determine expected size based on container size
    const expectedSize = containerSize - 4; // 2px safety zone on each side

    // Check if icon is too large (exceeds expected size)
    const isWidthTooLarge = width > expectedSize;
    const isHeightTooLarge = height > expectedSize;

    if (isWidthTooLarge || isHeightTooLarge) {
      // Format values, making too large values bold
      const widthFormatted = isWidthTooLarge
        ? `<strong>${width.toFixed(2)}px</strong>`
        : `${width.toFixed(2)}px`;
      const heightFormatted = isHeightTooLarge
        ? `<strong>${height.toFixed(2)}px</strong>`
        : `${height.toFixed(2)}px`;

      return {
        error: {
          message: `<strong>Icon size too large:</strong> ${widthFormatted} × ${heightFormatted}<br>Maximum: ${expectedSize}px × ${expectedSize}px (with 2px safety zone)`,
          node: frameName,
        },
      };
    }

    // Check if width or height are on quarter-pixel grid (.00, .25, .50, .75)
    // We consider these values acceptable
    const isOnQuarterGrid = (value: number): boolean => {
      const decimal = Math.abs(value - Math.floor(value));
      const tolerance = 0.01;
      return (
        Math.abs(decimal - 0.0) < tolerance ||
        Math.abs(decimal - 0.25) < tolerance ||
        Math.abs(decimal - 0.5) < tolerance ||
        Math.abs(decimal - 0.75) < tolerance ||
        Math.abs(decimal - 1.0) < tolerance
      );
    };

    const isWidthUneven = !isOnQuarterGrid(width);
    const isHeightUneven = !isOnQuarterGrid(height);

    // Only show information if width or height is not on quarter-pixel grid
    if (!isWidthUneven && !isHeightUneven) {
      return {};
    }

    // Format width and height, making uneven values bold
    const widthFormatted = isWidthUneven
      ? `<strong>${width.toFixed(2)}px</strong>`
      : `${width.toFixed(2)}px`;
    const heightFormatted = isHeightUneven
      ? `<strong>${height.toFixed(2)}px</strong>`
      : `${height.toFixed(2)}px`;

    return {
      information: {
        message: `<strong>Icon content size:</strong> ${widthFormatted} × ${heightFormatted}<br>(visual outer edge including strokes)`,
        node: frameName,
      },
    };
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

    const vectors = this.findAllVectorNodesWithPosition(container, container);

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
              message: `<strong>Smaller stroke width: "${vector.name}" is ${strokeWeight.toFixed(2)}px.</strong><br>Check if the modified stroke width is necessary.`,
              node: frameName,
              canProceed: true,
            });
          } else {
            errors.push({
              message: `<strong>Incorrect stroke width: "${vector.name}" is ${strokeWeight.toFixed(2)}px</strong>.<br>Use 2px (or 1.75px, 1.5px for the smaller sizes).`,
              node: frameName,
            });
          }
        } else if (iconType === "illustrative") {
          if (strokeWeight !== 2) {
            errors.push({
              message: `<strong>Incorrect stroke width: "${vector.name}" is ${strokeWeight.toFixed(2)}px</strong>. Only use 2px.`,
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
   * Validate safety zone and collect position information
   * Safety zone rules:
   * - Fills: minimum 2px from container edge
   * - Strokes: minimum 3px from container edge
   *
   * Position calculation: Accumulate all parent offsets relative to container
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

    // Use absoluteRenderBounds for accurate visual bounds (includes stroke width)
    // Fall back to absoluteBoundingBox if not available
    const bounds =
      "absoluteRenderBounds" in vector && vector.absoluteRenderBounds
        ? vector.absoluteRenderBounds
        : "absoluteBoundingBox" in vector && vector.absoluteBoundingBox
          ? vector.absoluteBoundingBox
          : null;

    if (!bounds) {
      // If no absolute bounds available, calculate from relative position
      // This happens in tests or when Figma hasn't rendered the node yet
      console.warn(
        `[MasterIconValidator] No absolute bounds available for vector "${vector.name}", using relative position`,
      );

      // Calculate absolute position by traversing parent chain
      let absoluteX = vector.x;
      let absoluteY = vector.y;

      for (const parent of parentChain) {
        if ("x" in parent && "y" in parent) {
          absoluteX += parent.x;
          absoluteY += parent.y;
        }
      }

      // For synthetic bounds from relative position:
      // - vector.x/y is the path center (for center-aligned strokes)
      // - We need to adjust to get the visual outer edge
      // - Subtract half stroke weight to get outer edge position
      const hasStrokes =
        "strokes" in vector &&
        vector.strokes &&
        vector.strokes.length > 0 &&
        strokeWeight > 0;

      const halfStroke = hasStrokes ? strokeWeight / 2 : 0;

      // Create synthetic bounds representing the visual outer edge
      const syntheticBounds = {
        x: absoluteX - halfStroke,
        y: absoluteY - halfStroke,
        width: vector.width + strokeWeight,
        height: vector.height + strokeWeight,
      };

      // Continue with synthetic bounds
      return this.validateSafetyZoneWithBounds(
        vector,
        syntheticBounds,
        strokeWeight,
        containerSize,
        frameName,
        parentChain,
      );
    }

    console.log(
      `[MasterIconValidator] Vector "${vector.name}": bounds x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`,
    );

    return this.validateSafetyZoneWithBounds(
      vector,
      bounds,
      strokeWeight,
      containerSize,
      frameName,
      parentChain,
    );
  }

  /**
   * Validate safety zone with given bounds
   */
  private validateSafetyZoneWithBounds(
    vector: SceneNode,
    bounds: { x: number; y: number; width: number; height: number },
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

    // Calculate absolute position relative to container
    // The container is always named "Container" (case-insensitive)
    let containerAbsoluteX = 0;
    let containerAbsoluteY = 0;

    // Find the container node by traversing up the parent chain
    // The container is the node named "Container"
    let containerNode: SceneNode | null = null;

    if (parentChain.length > 0) {
      // If there's a parent chain, the container is at the root of the chain
      // We need to find it by going up from the first parent
      const firstParent = parentChain[0];
      if ("parent" in firstParent && firstParent.parent) {
        containerNode = firstParent.parent;
      }
    } else {
      // If no parent chain, the vector is directly in the container
      // Get container from vector's parent
      if ("parent" in vector && vector.parent) {
        containerNode = vector.parent;
      }
    }

    // Verify we found the container by checking the name
    if (
      containerNode &&
      "name" in containerNode &&
      !containerNode.name.toLowerCase().includes("container")
    ) {
      console.warn(
        `[MasterIconValidator] Found parent "${containerNode.name}" but it's not named "Container", searching further up...`,
      );
      // Search further up the tree
      let currentNode: SceneNode | null = containerNode;
      while (currentNode && "parent" in currentNode && currentNode.parent) {
        const parent = currentNode.parent;
        if (
          "name" in parent &&
          parent.name.toLowerCase().includes("container")
        ) {
          containerNode = parent;
          break;
        }
        currentNode = parent;
      }
    }

    // Get container's absolute position
    if (containerNode) {
      if (
        "absoluteBoundingBox" in containerNode &&
        containerNode.absoluteBoundingBox
      ) {
        containerAbsoluteX = containerNode.absoluteBoundingBox.x;
        containerAbsoluteY = containerNode.absoluteBoundingBox.y;
        console.log(
          `[MasterIconValidator] Container "${containerNode.name}" absolute position: (${containerAbsoluteX}, ${containerAbsoluteY})`,
        );
      } else if ("x" in containerNode && "y" in containerNode) {
        // Fallback: use relative position if absolute not available
        containerAbsoluteX = containerNode.x;
        containerAbsoluteY = containerNode.y;
        console.log(
          `[MasterIconValidator] Container "${containerNode.name}" relative position (fallback): (${containerAbsoluteX}, ${containerAbsoluteY})`,
        );
      }
    } else {
      console.warn(
        `[MasterIconValidator] Could not find Container node for vector "${vector.name}"`,
      );
    }

    // Calculate position relative to container
    const absoluteX = bounds.x - containerAbsoluteX;
    const absoluteY = bounds.y - containerAbsoluteY;

    // Store relative position (as shown in Figma - relative to immediate parent)
    const relativeX = vector.x;
    const relativeY = vector.y;

    console.log(
      `[MasterIconValidator] Vector "${vector.name}": absolute position relative to container (${absoluteX}, ${absoluteY})`,
    );
    console.log(`[MasterIconValidator] Container size: ${containerSize}`);

    // Calculate distances from container edges using absolute bounds
    // Round to 2 decimal places to avoid floating point precision issues
    let distanceLeft = Math.round(absoluteX * 100) / 100;
    let distanceTop = Math.round(absoluteY * 100) / 100;
    let distanceRight =
      Math.round((containerSize - (absoluteX + bounds.width)) * 100) / 100;
    let distanceBottom =
      Math.round((containerSize - (absoluteY + bounds.height)) * 100) / 100;

    // Determine if vector has strokes or only fills
    const hasStrokes =
      "strokes" in vector &&
      vector.strokes &&
      vector.strokes.length > 0 &&
      strokeWeight > 0;

    // For strokes: absoluteRenderBounds includes the stroke width (outer edge)
    // But safety zone should be measured from the path center
    // So we need to add half the stroke weight to the distances
    if (hasStrokes && strokeWeight > 0) {
      const halfStroke = strokeWeight / 2;
      distanceLeft += halfStroke;
      distanceTop += halfStroke;
      distanceRight += halfStroke;
      distanceBottom += halfStroke;
      console.log(
        `[MasterIconValidator] Adjusted distances for stroke (${strokeWeight}px, +${halfStroke}px): left: ${distanceLeft}, top: ${distanceTop}, right: ${distanceRight}, bottom: ${distanceBottom}`,
      );
    }

    console.log(
      `[MasterIconValidator] Vector "${vector.name}": distances - left: ${distanceLeft}, top: ${distanceTop}, right: ${distanceRight}, bottom: ${distanceBottom}`,
    );

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

    // Create position info
    positionInfo = {
      name: vector.name,
      x: absoluteX,
      y: absoluteY,
      relativeX,
      relativeY,
      width: bounds.width,
      height: bounds.height,
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
    // Fills: 2px minimum from fill edge to container edge
    // Strokes: Measured from path center, so we need:
    //   - Visual outer stroke edge should be 2px from container edge
    //   - Path center distance = 2px + strokeWeight/2
    // Examples: 2px stroke → 3px min, 1.5px stroke → 2.75px min, 1.75px stroke → 2.875px min
    const minDistance = hasStrokes ? 2 + strokeWeight / 2 : 2;
    const vectorType = hasStrokes ? "stroke" : "fill";

    // Check distances from all edges
    // No epsilon needed - we want exact comparison
    const violations: string[] = [];

    if (distanceLeft < minDistance) {
      violations.push(
        `left edge is in safety area (<strong>${distanceLeft.toFixed(2)}px</strong>, min: ${minDistance}px)`,
      );
    }
    if (distanceTop < minDistance) {
      violations.push(
        `top edge is in safety area (<strong>${distanceTop.toFixed(2)}px</strong>, min: ${minDistance}px)`,
      );
    }
    if (distanceRight < minDistance) {
      violations.push(
        `right edge is in safety area (<strong>${distanceRight.toFixed(2)}px</strong>, min: ${minDistance}px)`,
      );
    }
    if (distanceBottom < minDistance) {
      violations.push(
        `bottom edge is in safety area (<strong>${distanceBottom.toFixed(2)}px</strong>, min: ${minDistance}px)`,
      );
    }

    if (violations.length > 0) {
      errors.push({
        message: `<strong>Incorrect position: "${vector.name}" (${vectorType})</strong><br>${violations.join("<br>")}`,
        node: frameName,
      });
    }

    return { errors, warnings, positionInfo };
  }

  /**
   * Find all vector nodes recursively with their parent chain for absolute position calculation
   * The parent chain excludes the container itself (starting point)
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
      // Add current node to parent chain for children (but not the container itself)
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

  /**
   * Check if vectors are positioned too close together (0-1px apart)
   * Overlaps (negative distance) are OK, but distances between 0 and 1px should trigger information
   */
  private checkVectorProximity(
    container: SceneNode,
    frameName: string,
  ): ValidationInformation[] {
    const information: ValidationInformation[] = [];
    const vectors = this.findAllVectorNodesWithPosition(container, container);

    if (vectors.length < 2) {
      return information; // Need at least 2 vectors to check proximity
    }

    // Get bounding boxes for all vectors
    const vectorBounds: Array<{
      name: string;
      bounds: { x: number; y: number; width: number; height: number };
    }> = [];

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
        // Fallback: calculate from relative position
        if (
          !(
            "x" in vector &&
            "y" in vector &&
            "width" in vector &&
            "height" in vector
          )
        ) {
          continue;
        }

        let x = vector.x;
        let y = vector.y;

        // Add parent positions
        for (const parent of vectorInfo.parentChain) {
          if ("x" in parent && "y" in parent) {
            x += parent.x;
            y += parent.y;
          }
        }

        // Check for stroke
        const strokeWeight =
          "strokes" in vector &&
          vector.strokes &&
          Array.isArray(vector.strokes) &&
          vector.strokes.length > 0 &&
          "strokeWeight" in vector &&
          (vector.strokeWeight as number) > 0
            ? (vector.strokeWeight as number)
            : 0;

        const halfStroke = strokeWeight / 2;

        vectorBounds.push({
          name: vector.name,
          bounds: {
            x: x - halfStroke,
            y: y - halfStroke,
            width: vector.width + strokeWeight,
            height: vector.height + strokeWeight,
          },
        });
      } else {
        vectorBounds.push({
          name: vector.name,
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
        });
      }
    }

    // Check all pairs of vectors
    const checkedPairs = new Set<string>();

    for (let i = 0; i < vectorBounds.length; i++) {
      for (let j = i + 1; j < vectorBounds.length; j++) {
        const v1 = vectorBounds[i];
        const v2 = vectorBounds[j];

        // Create a unique key for this pair
        const pairKey = `${v1.name}|${v2.name}`;
        if (checkedPairs.has(pairKey)) {
          continue;
        }
        checkedPairs.add(pairKey);

        // Calculate minimum distance between the two bounding boxes
        const distance = this.calculateBoundingBoxDistance(
          v1.bounds,
          v2.bounds,
        );

        // Show information if distance is between 0 and 1px (exclusive)
        // Negative distance means overlap, which is OK
        if (distance > 0 && distance < 1) {
          information.push({
            message: `<strong>Vector position: "${v1.name}" and "${v2.name}"</strong> are too close <strong>${distance.toFixed(2)}px.</strong> Use spacing of at least 1px.`,
            node: frameName,
          });
        }
      }
    }

    return information;
  }

  /**
   * Calculate the minimum distance between two bounding boxes
   * Returns negative value if boxes overlap
   */
  private calculateBoundingBoxDistance(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number },
  ): number {
    // Calculate edges
    const box1Right = box1.x + box1.width;
    const box1Bottom = box1.y + box1.height;
    const box2Right = box2.x + box2.width;
    const box2Bottom = box2.y + box2.height;

    // Calculate horizontal distance
    let horizontalDistance = 0;
    if (box1Right < box2.x) {
      // box1 is to the left of box2
      horizontalDistance = box2.x - box1Right;
    } else if (box2Right < box1.x) {
      // box2 is to the left of box1
      horizontalDistance = box1.x - box2Right;
    } else {
      // Boxes overlap horizontally
      horizontalDistance = Math.min(
        box1Right - box2.x,
        box2Right - box1.x,
        box1.x - box2.x + box2.width,
        box2.x - box1.x + box1.width,
      );
      horizontalDistance = -Math.abs(horizontalDistance);
    }

    // Calculate vertical distance
    let verticalDistance = 0;
    if (box1Bottom < box2.y) {
      // box1 is above box2
      verticalDistance = box2.y - box1Bottom;
    } else if (box2Bottom < box1.y) {
      // box2 is above box1
      verticalDistance = box1.y - box2Bottom;
    } else {
      // Boxes overlap vertically
      verticalDistance = Math.min(
        box1Bottom - box2.y,
        box2Bottom - box1.y,
        box1.y - box2.y + box2.height,
        box2.y - box1.y + box1.height,
      );
      verticalDistance = -Math.abs(verticalDistance);
    }

    // If both distances are negative, boxes overlap
    if (horizontalDistance < 0 && verticalDistance < 0) {
      // Return the smaller overlap (less negative = smaller overlap)
      return Math.max(horizontalDistance, verticalDistance);
    }

    // If one distance is negative, boxes overlap in that direction
    // Return the positive distance in the other direction
    if (horizontalDistance < 0) {
      return verticalDistance;
    }
    if (verticalDistance < 0) {
      return horizontalDistance;
    }

    // Boxes don't overlap - return minimum distance
    // Use Pythagorean theorem for diagonal distance
    return Math.sqrt(
      horizontalDistance * horizontalDistance +
        verticalDistance * verticalDistance,
    );
  }
}
