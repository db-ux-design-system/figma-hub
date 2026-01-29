/**
 * Size Validator
 *
 * Validates that icon variants and their children have the correct sizes
 */

import type { ValidationResult, ValidationError } from "../types/index.js";

export class SizeValidator {
  // Size constraints for child elements
  private readonly sizeConstraints = {
    32: { stroke: 26, fill: 28 },
    28: { stroke: 22, fill: 24 },
    24: { stroke: 18, fill: 20 },
    20: { stroke: 14, fill: 16 },
    16: { stroke: 10, fill: 12 },
    14: { stroke: 8, fill: 10 },
    12: { stroke: 6, fill: 8 },
  };
  private readonly safetyZoneBase = 2; // Base safety zone: 2px
  private readonly safetyZoneFill = 2; // 2px safety zone for fill-only vectors

  /**
   * Validate that all variants have correct sizes
   * @param skipChildValidation - If true, only checks if all sizes exist, not child constraints
   */
  validate(
    componentSet: ComponentSetNode,
    skipChildValidation = false,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Only validate the 3 original sizes that should exist before scaling
    const originalSizes = [32, 24, 20];
    const allowedSizes = [32, 28, 24, 20, 16, 14, 12];
    const outlinedVariantType = "(Def) Outlined";
    const filledVariantType = "Filled";
    const allowedVariantTypes = [outlinedVariantType, filledVariantType];

    // If we're only checking completeness, skip validation
    if (skipChildValidation) {
      return {
        isValid: true,
        errors: [],
      };
    }

    // Check for invalid variant names or sizes
    const invalidSizes = new Set<number>();
    const invalidVariantTypes = new Set<string>();

    for (const variant of componentSet.children as ComponentNode[]) {
      const sizeMatch = variant.name.match(/Size=(\d+)/);
      const variantMatch = variant.name.match(/Variant=(.+)/);

      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]);
        if (!allowedSizes.includes(size)) {
          invalidSizes.add(size);
        }
      }

      if (variantMatch) {
        const variantType = variantMatch[1];
        if (!allowedVariantTypes.includes(variantType)) {
          invalidVariantTypes.add(variantType);
        }
      }
    }

    // Report invalid sizes (consolidated)
    if (invalidSizes.size > 0) {
      const sizesList = Array.from(invalidSizes)
        .sort((a, b) => b - a)
        .map((s) => `${s}px`)
        .join(", ");
      errors.push({
        message: `Invalid size(s): <strong>${sizesList}</strong><br>Only sizes 32, 28, 24, 20, 16, 14, 12 are allowed`,
        node: componentSet.name,
      });
    }

    // Report invalid variant names (consolidated)
    if (invalidVariantTypes.size > 0) {
      const variantsList = Array.from(invalidVariantTypes)
        .map((v) => `<strong>${v}</strong>`)
        .join(", ");
      errors.push({
        message: `Invalid variant name(s): ${variantsList}<br>Only "<strong>${outlinedVariantType}</strong>" and "<strong>${filledVariantType}</strong>" are allowed`,
        node: componentSet.name,
      });
    }

    // Check if any (Def) Outlined variants exist
    const hasAnyOutlined = (componentSet.children as ComponentNode[]).some(
      (v) => v.name.includes(`Variant=${outlinedVariantType}`),
    );

    if (!hasAnyOutlined) {
      errors.push({
        message: `No <strong>${outlinedVariantType}</strong> variants found<br>Please add the required sizes (32px, 24px, 20px) for the ${outlinedVariantType} variant`,
        node: componentSet.name,
      });

      // Check if there are Filled variants and report missing sizes for those too
      const hasAnyFilled = (componentSet.children as ComponentNode[]).some(
        (v) => v.name.includes(`Variant=${filledVariantType}`),
      );

      if (hasAnyFilled) {
        // Check which Filled sizes are missing
        const missingFilledSizes: number[] = [];
        for (const size of originalSizes) {
          const variantName = `Size=${size}, Variant=${filledVariantType}`;
          const variant = (componentSet.children as ComponentNode[]).find(
            (v) => v.name === variantName,
          );
          if (!variant) {
            missingFilledSizes.push(size);
          }
        }

        if (missingFilledSizes.length > 0) {
          const sizesList = missingFilledSizes.map((s) => `${s}px`).join(", ");
          errors.push({
            message: `Missing <strong>${filledVariantType}</strong> sizes: ${sizesList}<br>Please add these sizes for the ${filledVariantType} variant`,
            node: componentSet.name,
          });
        }
      }

      // Return early as we can't validate further without any Outlined variants
      return {
        isValid: false,
        errors,
      };
    }

    // Check if any Filled variants exist
    const hasAnyFilled = (componentSet.children as ComponentNode[]).some((v) =>
      v.name.includes(`Variant=${filledVariantType}`),
    );

    // Determine which variant types to validate
    const variantTypesToValidate = [outlinedVariantType];
    if (hasAnyFilled) {
      variantTypesToValidate.push(filledVariantType);
    }

    // Check for missing or empty variants
    for (const variantType of variantTypesToValidate) {
      for (const size of originalSizes) {
        const variantName = `Size=${size}, Variant=${variantType}`;
        const displayName = `${variantType}, ${size}px`;
        const variant = (componentSet.children as ComponentNode[]).find(
          (v) => v.name === variantName,
        );

        if (!variant) {
          errors.push({
            message: `Missing variant: <strong>${displayName}</strong><br>Please create this variant and add content`,
            node: componentSet.name,
          });
        } else {
          // Check if variant has a container with children
          if (!variant.children || variant.children.length === 0) {
            errors.push({
              message: `Empty variant: <strong>${displayName}</strong><br>Please add vector content to this variant`,
              node: variantName,
            });
          } else {
            const container = variant.children[0];
            if (
              "children" in container &&
              (!container.children || container.children.length === 0)
            ) {
              errors.push({
                message: `Empty container in variant: <strong>${displayName}</strong><br>Please add vector content to this variant`,
                node: variantName,
              });
            }
          }
        }
      }
    }

    // Full validation including child constraints - only for original sizes that exist and have content
    for (const variant of componentSet.children as ComponentNode[]) {
      // Extract expected size and variant type from variant name
      const sizeMatch = variant.name.match(/Size=(\d+)/);
      const variantMatch = variant.name.match(/Variant=(.+)/);

      if (!sizeMatch) {
        errors.push({
          message: `Variant "${variant.name}" has no Size property in name`,
          node: variant.name,
        });
        continue;
      }

      const expectedSize = parseInt(sizeMatch[1]);
      const variantType = variantMatch ? variantMatch[1] : "Unknown";
      const displayName = `${variantType}, ${expectedSize}px`;

      // Only validate original sizes (32, 24, 20)
      if (!originalSizes.includes(expectedSize)) {
        continue;
      }

      // Skip if variant is empty (already reported above)
      if (!variant.children || variant.children.length === 0) {
        continue;
      }

      // Check if this is a valid size
      if (!(expectedSize in this.sizeConstraints)) {
        errors.push({
          message: `${displayName} has invalid size: ${expectedSize}px (must be one of: 32, 28, 24, 20, 16, 14, 12)`,
          node: variant.name,
        });
        continue;
      }

      // Check variant size
      if (variant.width !== expectedSize || variant.height !== expectedSize) {
        errors.push({
          message: `${displayName} has incorrect size: ${variant.width}x${variant.height}px (expected: ${expectedSize}x${expectedSize}px)`,
          node: variant.name,
        });
      }

      // Check container size (first child should be the container frame)
      if (variant.children && variant.children.length > 0) {
        const container = variant.children[0];
        if ("width" in container && "height" in container) {
          if (
            container.width !== expectedSize ||
            container.height !== expectedSize
          ) {
            errors.push({
              message: `Container in ${displayName} has incorrect size: ${container.width}x${container.height}px (expected: ${expectedSize}x${expectedSize}px)`,
              node: variant.name,
            });
          }

          // Check child elements inside container (skip if empty)
          if (
            "children" in container &&
            container.children &&
            container.children.length > 0
          ) {
            const childErrors = this.validateChildElements(
              container,
              expectedSize,
              displayName,
            );
            errors.push(...childErrors);

            // Check safety zone for groups/vectors
            const safetyZoneErrors = this.validateSafetyZone(
              container,
              expectedSize,
              displayName,
            );
            errors.push(...safetyZoneErrors);
          }
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
    variantSize: number,
    displayName: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!("children" in container)) {
      return errors;
    }

    const constraints =
      this.sizeConstraints[variantSize as keyof typeof this.sizeConstraints];
    if (!constraints) {
      return errors;
    }

    // Recursively check all children (including those in groups)
    const checkNode = (node: SceneNode) => {
      // If it's a group, check its children recursively (but don't validate the group itself)
      if (node.type === "GROUP" && "children" in node) {
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
        // Round to 2 decimal places to avoid floating point precision issues
        const nodeWidth = Math.round(node.width * 100) / 100;
        const nodeHeight = Math.round(node.height * 100) / 100;
        const actualWidth = node.width.toFixed(2);
        const actualHeight = node.height.toFixed(2);

        // Determine if this node has stroke or fill
        const hasStroke =
          "strokes" in node &&
          Array.isArray(node.strokes) &&
          node.strokes.length > 0 &&
          "strokeWeight" in node &&
          (node.strokeWeight as number) > 0;
        const hasFill =
          "fills" in node && Array.isArray(node.fills) && node.fills.length > 0;

        // Use fill constraints if it has fill, otherwise stroke constraints
        const maxSize =
          hasFill && !hasStroke ? constraints.fill : constraints.stroke;
        const elementType = hasFill && !hasStroke ? "Fill" : "Stroke";

        // Debug logging
        console.log(`[SizeValidator] Node: ${node.name}`);
        console.log(`  Raw size: ${node.width}x${node.height}`);
        console.log(`  Rounded size: ${nodeWidth}x${nodeHeight}`);
        console.log(`  hasStroke: ${hasStroke}, hasFill: ${hasFill}`);
        console.log(`  maxSize: ${maxSize}, elementType: ${elementType}`);
        console.log(
          `  Comparison: ${nodeWidth} > ${maxSize} = ${nodeWidth > maxSize}`,
        );

        if (nodeWidth > maxSize || nodeHeight > maxSize) {
          errors.push({
            message: `Child element in ${displayName} is too large: ${actualWidth}x${actualHeight}px (max for ${elementType} at ${variantSize}px: ${maxSize}x${maxSize}px)`,
            node: displayName,
          });
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
    variantSize: number,
    displayName: string,
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
    const safetyZone = 2; // Frame must be 2px from edge

    console.log(`  Checking safety zone for ${displayName}...`);
    console.log(`    Container size: ${containerWidth}x${containerHeight}px`);
    console.log(`    Safety zone: ${safetyZone}px`);

    // Find the icon frame (should be the only/first child of container)
    let iconFrame: SceneNode | null = null;

    for (const child of container.children) {
      if (child.type === "FRAME" || child.type === "GROUP") {
        iconFrame = child;
        break;
      }
    }

    if (!iconFrame) {
      console.log(`    No frame found in container`);
      return errors;
    }

    if (
      !("x" in iconFrame) ||
      !("y" in iconFrame) ||
      !("width" in iconFrame) ||
      !("height" in iconFrame)
    ) {
      return errors;
    }

    // Calculate frame bounds
    const frameLeft = iconFrame.x;
    const frameTop = iconFrame.y;
    const frameRight = iconFrame.x + iconFrame.width;
    const frameBottom = iconFrame.y + iconFrame.height;

    console.log(
      `    Frame "${iconFrame.name}" bounds: [${frameLeft.toFixed(2)}, ${frameTop.toFixed(2)}, ${frameRight.toFixed(2)}, ${frameBottom.toFixed(2)}]`,
    );

    // Check if frame is within safety zone
    const minAllowed = safetyZone;
    const maxAllowedX = containerWidth - safetyZone;
    const maxAllowedY = containerHeight - safetyZone;
    const epsilon = 0.1; // Tolerance for floating point comparison

    const violations: string[] = [];

    if (frameLeft < minAllowed - epsilon) {
      violations.push(
        `left edge at ${frameLeft.toFixed(2)}px (min: ${minAllowed}px)`,
      );
    }
    if (frameTop < minAllowed - epsilon) {
      violations.push(
        `top edge at ${frameTop.toFixed(2)}px (min: ${minAllowed}px)`,
      );
    }
    if (frameRight > maxAllowedX + epsilon) {
      violations.push(
        `right edge at ${frameRight.toFixed(2)}px (max: ${maxAllowedX}px)`,
      );
    }
    if (frameBottom > maxAllowedY + epsilon) {
      violations.push(
        `bottom edge at ${frameBottom.toFixed(2)}px (max: ${maxAllowedY}px)`,
      );
    }

    if (violations.length > 0) {
      console.log(
        `    ❌ Frame violates safety zone: ${violations.join(", ")}`,
      );
      errors.push({
        message: `Icon frame in ${displayName} is too close to container edge:<br>${violations.join("<br>")}<br>Frame must be at least ${safetyZone}px from all edges`,
        node: displayName,
      });
    } else {
      console.log(`    ✓ Frame is within safety zone`);
    }

    return errors;
  }
}
