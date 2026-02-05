/**
 * Illustrative Icon Size Validator
 *
 * Validates that illustrative icons have the correct size (64x64)
 * and child elements meet size constraints
 */

import type { ValidationResult, ValidationError } from "../types/index.js";

export class IllustrativeSizeValidator {
  // Size constraints for illustrative icons
  private readonly componentSize = 64;
  private readonly fillMaxSize = 56;
  private readonly strokeMaxSize = 54;
  private readonly safetyZoneBase = 4; // Base safety zone: 4px
  private readonly safetyZoneFill = 4; // 4px safety zone for fill-only vectors

  /**
   * Validate that the component has correct size
   */
  validate(component: ComponentNode): ValidationResult {
    const errors: ValidationError[] = [];

    // Check component size
    if (
      component.width !== this.componentSize ||
      component.height !== this.componentSize
    ) {
      errors.push({
        message: `Component has incorrect size: ${component.width}x${component.height}px<br>Expected: ${this.componentSize}x${this.componentSize}px`,
        node: component.name,
      });
    }

    // Check container size (first child should be the container frame)
    if (component.children && component.children.length > 0) {
      const container = component.children[0];

      if ("width" in container && "height" in container) {
        if (
          container.width !== this.componentSize ||
          container.height !== this.componentSize
        ) {
          errors.push({
            message: `Container has incorrect size: ${container.width}x${container.height}px<br>Expected: ${this.componentSize}x${this.componentSize}px`,
            node: component.name,
          });
        }

        // Check child elements inside container
        if (
          "children" in container &&
          container.children &&
          container.children.length > 0
        ) {
          const childErrors = this.validateChildElements(
            container,
            component.name,
          );
          errors.push(...childErrors);

          // Check safety zone for groups/vectors
          const safetyZoneErrors = this.validateSafetyZone(
            container,
            component.name,
          );
          errors.push(...safetyZoneErrors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate child elements inside the container (recursively)
   */
  private validateChildElements(
    container: SceneNode,
    componentName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!("children" in container)) {
      return errors;
    }

    // Recursively check all children (including those in groups)
    const checkNode = (node: SceneNode) => {
      // Check any GROUP or FRAME for size validation
      if (node.type === "GROUP" || node.type === "FRAME") {
        console.log(
          `  Checking group/frame: ${node.name} (${node.width}x${node.height}px)`,
        );

        if ("width" in node && "height" in node) {
          const nodeWidth = Math.ceil(node.width);
          const nodeHeight = Math.ceil(node.height);
          const actualWidth = node.width.toFixed(2);
          const actualHeight = node.height.toFixed(2);

          // Group should be max 60px (same as fill constraint)
          if (nodeWidth > this.fillMaxSize || nodeHeight > this.fillMaxSize) {
            console.log(
              `    ❌ Group too large: ${nodeWidth} or ${nodeHeight} > ${this.fillMaxSize}`,
            );
            errors.push({
              message: `Group "${node.name}" is too large: ${actualWidth}x${actualHeight}px<br>Max size: ${this.fillMaxSize}x${this.fillMaxSize}px`,
              node: componentName,
            });
          } else {
            console.log(`    ✓ Group size OK`);
          }
        }

        // Continue checking children (Base and Pulse)
        if ("children" in node) {
          for (const child of node.children) {
            checkNode(child);
          }
        }
        return;
      }

      // If it's a group or frame (but not checked above), check its children recursively
      if (
        (node.type === "GROUP" || node.type === "FRAME") &&
        "children" in node
      ) {
        console.log(
          `  Checking nested group/frame: ${node.name} (${node.width}x${node.height}px)`,
        );
        for (const child of node.children) {
          checkNode(child);
        }
        return;
      }

      // Only validate actual vector nodes (not groups, frames, etc.)
      const vectorTypes = [
        "VECTOR",
        "STAR",
        "LINE",
        "ELLIPSE",
        "POLYGON",
        "RECTANGLE",
        "BOOLEAN_OPERATION",
      ];

      if (!vectorTypes.includes(node.type)) {
        return;
      }

      // Check if this node has size properties
      if ("width" in node && "height" in node) {
        const nodeWidth = Math.ceil(node.width);
        const nodeHeight = Math.ceil(node.height);
        const actualWidth = node.width.toFixed(2);
        const actualHeight = node.height.toFixed(2);

        console.log(
          `  Checking vector: ${node.name} (${actualWidth}x${actualHeight}px)`,
        );

        // For illustrative icons, vectors are always outlined/flattened before processing
        // (enforced by IllustrativeFlattenOutlineValidator)
        // So we always use fillMaxSize (60px)
        const maxSize = this.fillMaxSize;

        console.log(`    maxSize: ${maxSize}px (fill-only)`);

        if (nodeWidth > maxSize || nodeHeight > maxSize) {
          console.log(
            `    ❌ VALIDATION FAILED: ${nodeWidth} or ${nodeHeight} > ${maxSize}`,
          );
          errors.push({
            message: `Child element "${node.name}" is too large: ${actualWidth}x${actualHeight}px<br>Max size: ${maxSize}x${maxSize}px`,
            node: componentName,
          });
        } else {
          console.log(`    ✓ Size OK`);
        }
      }
    };

    // Start checking from container's children
    for (const child of container.children) {
      checkNode(child);
    }

    return errors;
  }

  /**
   * Validate that the icon frame stays within the safety zone
   * The frame (containing fills and/or strokes groups) must be at least 2px from container edge
   */
  private validateSafetyZone(
    container: SceneNode,
    componentName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (
      !("children" in container) ||
      !("width" in container) ||
      !("height" in container)
    ) {
      return errors;
    }

    const containerWidth = container.width;
    const containerHeight = container.height;
    const safetyZone = 4; // Frame must be 4px from edge

    console.log(`  Checking safety zone...`);
    console.log(`    Container size: ${containerWidth}x${containerHeight}px`);
    console.log(`    Safety zone: ${safetyZone}px`);

    // Find the icon element (frame, group, or vector)
    let iconElement: SceneNode | null = null;

    for (const child of container.children) {
      if (child.type === "FRAME" || child.type === "GROUP") {
        iconElement = child;
        break;
      }
    }

    // If no frame/group found, check for vector (illustrative icons)
    if (!iconElement) {
      const vectorTypes = [
        "VECTOR",
        "STAR",
        "LINE",
        "ELLIPSE",
        "POLYGON",
        "RECTANGLE",
        "BOOLEAN_OPERATION",
      ];

      for (const child of container.children) {
        if (vectorTypes.includes(child.type)) {
          iconElement = child;
          break;
        }
      }
    }

    if (!iconElement) {
      console.log(`    No frame, group, or vector found in container`);
      return errors;
    }

    if (
      !("x" in iconElement) ||
      !("y" in iconElement) ||
      !("width" in iconElement) ||
      !("height" in iconElement)
    ) {
      return errors;
    }

    // Calculate element bounds
    const elementLeft = iconElement.x;
    const elementTop = iconElement.y;
    const elementRight = iconElement.x + iconElement.width;
    const elementBottom = iconElement.y + iconElement.height;

    console.log(
      `    Element "${iconElement.name}" bounds: [${elementLeft.toFixed(2)}, ${elementTop.toFixed(2)}, ${elementRight.toFixed(2)}, ${elementBottom.toFixed(2)}]`,
    );

    // Check if frame is within safety zone
    const minAllowed = safetyZone;
    const maxAllowedX = containerWidth - safetyZone;
    const maxAllowedY = containerHeight - safetyZone;
    const epsilon = 0.1; // Tolerance for floating point comparison

    const violations: string[] = [];

    if (elementLeft < minAllowed - epsilon) {
      violations.push(
        `left edge at ${elementLeft.toFixed(2)}px (min: ${minAllowed}px)`,
      );
    }
    if (elementTop < minAllowed - epsilon) {
      violations.push(
        `top edge at ${elementTop.toFixed(2)}px (min: ${minAllowed}px)`,
      );
    }
    if (elementRight > maxAllowedX + epsilon) {
      violations.push(
        `right edge at ${elementRight.toFixed(2)}px (max: ${maxAllowedX}px)`,
      );
    }
    if (elementBottom > maxAllowedY + epsilon) {
      violations.push(
        `bottom edge at ${elementBottom.toFixed(2)}px (max: ${maxAllowedY}px)`,
      );
    }

    if (violations.length > 0) {
      console.log(
        `    ❌ Element violates safety zone: ${violations.join(", ")}`,
      );
      errors.push({
        message: `Icon element is too close to container edge:<br>${violations.join("<br>")}<br>Element must be at least ${safetyZone}px from all edges`,
        node: componentName,
      });
    } else {
      console.log(`    ✓ Element is within safety zone`);
    }

    return errors;
  }
}
