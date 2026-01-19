/**
 * Scale Processor
 *
 * Creates scaled variants of icons.
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { findVectorNodes } from "../utils/selection.js";
import { ProcessingError } from "../utils/error-handler.js";

/**
 * Scale mapping definition
 */
interface ScaleMapping {
  source: number;
  targets: number[];
}

/**
 * Scale Processor class
 *
 * Creates scaled variants from base size variants.
 */
export class ScaleProcessor {
  private scaleMappings: ScaleMapping[] = [
    { source: 32, targets: [28] }, // Requirement 7.1
    { source: 20, targets: [16, 14, 12] }, // Requirement 7.2
  ];

  /**
   * Create scaled variants for a component set
   *
   * Requirements:
   * - 7.1: Create 28px variant from 32px base
   * - 7.2: Create 16px, 14px, 12px variants from 20px base
   * - 7.3: Preserve all existing base size variants
   * - 7.4: Maintain proper scaling ratios
   * - 7.5: Apply same properties as source variant
   * - 7.6: Handle both functional and illustrative icons
   *
   * @param componentSet - The component set to process
   */
  async scale(componentSet: ComponentSetNode): Promise<void> {
    try {
      const variants = componentSet.children as ComponentNode[];

      // Requirement 7.3: Preserve all existing base size variants
      // We only create new variants, never modify existing ones

      for (const mapping of this.scaleMappings) {
        const sourceVariants = variants.filter(
          (v) => this.getVariantSize(v) === mapping.source,
        );

        for (const sourceVariant of sourceVariants) {
          for (const targetSize of mapping.targets) {
            await this.createScaledVariant(
              sourceVariant,
              targetSize,
              componentSet,
            );
          }
        }
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to scale variants: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a scaled variant from a source variant
   *
   * @param source - The source variant to scale from
   * @param targetSize - The target size for the new variant
   * @param componentSet - The parent component set
   */
  private async createScaledVariant(
    source: ComponentNode,
    targetSize: number,
    componentSet: ComponentSetNode,
  ): Promise<void> {
    // Check if variant already exists
    const existingVariant = this.findVariantBySize(componentSet, targetSize);
    if (existingVariant) {
      console.log(`Variant with size ${targetSize}px already exists, skipping`);
      return;
    }

    try {
      // Clone source variant
      const clone = source.clone();

      // Calculate scaling factor
      const sourceSize = this.getVariantSize(source);
      const scaleFactor = targetSize / sourceSize;

      // Requirement 7.4: Maintain proper scaling ratios
      // Resize the clone
      clone.resize(targetSize, targetSize);

      // Scale all vectors within
      const vectors = findVectorNodes(clone);
      for (const vector of vectors) {
        this.scaleVector(vector, scaleFactor);
      }

      // Requirement 7.5: Apply same properties as source variant
      // Update size property
      this.updateSizeProperty(clone, targetSize);

      // Add to component set
      componentSet.appendChild(clone);
    } catch (error) {
      console.warn(
        `Could not create scaled variant ${targetSize}px from ${source.name}:`,
        error,
      );
    }
  }

  /**
   * Get the size of a variant
   *
   * @param variant - The variant to check
   * @returns The size in pixels
   */
  private getVariantSize(variant: ComponentNode): number {
    // Try to get size from variant properties
    const sizeProperty = variant.variantProperties?.["size"];
    if (sizeProperty) {
      const parsed = parseInt(sizeProperty);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    // Fallback to width
    return Math.round(variant.width);
  }

  /**
   * Find a variant by size
   *
   * @param componentSet - The component set to search
   * @param size - The size to find
   * @returns The variant if found, null otherwise
   */
  private findVariantBySize(
    componentSet: ComponentSetNode,
    size: number,
  ): ComponentNode | null {
    for (const variant of componentSet.children as ComponentNode[]) {
      if (this.getVariantSize(variant) === size) {
        return variant;
      }
    }
    return null;
  }

  /**
   * Scale vector properties
   *
   * Requirement 7.4: Maintain proper scaling ratios
   *
   * @param vector - The vector to scale
   * @param factor - The scaling factor
   */
  private scaleVector(vector: VectorNode, factor: number): void {
    // Scale stroke weight
    if (typeof vector.strokeWeight === "number") {
      vector.strokeWeight = vector.strokeWeight * factor;
    }

    // Note: Vector dimensions are already scaled by the resize operation
    // We only need to scale properties like stroke weight
  }

  /**
   * Update the size property of a variant
   *
   * @param variant - The variant to update
   * @param size - The new size
   */
  private updateSizeProperty(variant: ComponentNode, size: number): void {
    if (variant.variantProperties) {
      variant.variantProperties = {
        ...variant.variantProperties,
        size: size.toString(),
      };
    }
  }
}
