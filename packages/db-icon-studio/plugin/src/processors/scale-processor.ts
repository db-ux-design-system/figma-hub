/**
 * Scale Processor
 *
 * Creates scaled variants of icons.
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { ProcessingError } from "../utils/error-handler.js";

/**
 * Scale Processor class
 *
 * Creates all missing size variants from existing ones.
 */
export class ScaleProcessor {
  private readonly targetSizes = [32, 28, 24, 20, 16, 14, 12];
  private readonly variantOrder = ["(Def) Outlined", "Filled"];

  /**
   * Create scaled variants for a component set
   *
   * Requirements:
   * - 7.1: Create all missing size variants
   * - 7.2: Scale proportionally from nearest larger size
   * - 7.3: Set Size property correctly
   * - 7.4: Maintain proper scaling ratios
   * - 7.5: Apply same properties as source variant
   * - 7.6: Order variants correctly
   *
   * @param componentSet - The component set to process
   */
  async scale(componentSet: ComponentSetNode): Promise<void> {
    try {
      console.log(`\n=== Scaling Component Set ===`);

      const variants = Array.from(componentSet.children as ComponentNode[]);

      // Remove fill from all existing container frames
      this.removeContainerFills(variants);

      // Group existing variants by their variant type (Outlined/Filled)
      const variantsByType = this.groupVariantsByType(variants);

      // For each variant type, create missing sizes
      for (const variantType of this.variantOrder) {
        const existingVariants = variantsByType.get(variantType) || [];

        if (existingVariants.length === 0) {
          console.log(`No ${variantType} variants found, skipping`);
          continue;
        }

        console.log(`\nProcessing ${variantType} variants:`);
        console.log(
          `  Existing sizes: ${existingVariants.map((v) => this.getVariantSize(v)).join(", ")}`,
        );

        // Create missing sizes
        for (const targetSize of this.targetSizes) {
          const existing = existingVariants.find(
            (v) => this.getVariantSize(v) === targetSize,
          );

          if (existing) {
            console.log(`  ${targetSize}px already exists`);
            continue;
          }

          // Find nearest larger size to scale from
          const sourceVariant = this.findNearestLargerVariant(
            existingVariants,
            targetSize,
          );

          if (sourceVariant) {
            await this.createScaledVariant(
              sourceVariant,
              targetSize,
              variantType,
              componentSet,
            );
          } else {
            console.warn(`  No source variant found for ${targetSize}px`);
          }
        }
      }

      // Reorder variants
      await this.reorderVariants(componentSet);

      console.log(`\n✓ Scaling complete\n`);
    } catch (error) {
      throw new ProcessingError(
        `Failed to scale variants: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Remove fill from all container frames in variants
   */
  private removeContainerFills(variants: ComponentNode[]): void {
    console.log(`\nRemoving container fills from all variants...`);

    for (const variant of variants) {
      if (variant.children && variant.children.length > 0) {
        const container = variant.children[0];

        // Remove fill from container
        if ("fills" in container && Array.isArray(container.fills)) {
          container.fills = [];
          console.log(`  Removed fill from ${variant.name}`);
        }
      }
    }

    console.log(`✓ Container fills removed`);
  }

  /**
   * Group variants by their variant type (Outlined/Filled)
   */
  private groupVariantsByType(
    variants: ComponentNode[],
  ): Map<string, ComponentNode[]> {
    const grouped = new Map<string, ComponentNode[]>();

    for (const variant of variants) {
      const variantType = this.getVariantType(variant);
      if (!grouped.has(variantType)) {
        grouped.set(variantType, []);
      }
      grouped.get(variantType)!.push(variant);
    }

    return grouped;
  }

  /**
   * Get the variant type (Outlined/Filled) from a variant
   */
  private getVariantType(variant: ComponentNode): string {
    const variantProp = variant.variantProperties?.["Variant"];
    if (variantProp) {
      return variantProp;
    }

    // Fallback: check name
    if (variant.name.includes("Filled")) {
      return "Filled";
    }
    return "(Def) Outlined";
  }

  /**
   * Get the size of a variant
   */
  private getVariantSize(variant: ComponentNode): number {
    // Try to get size from variant properties
    const sizeProperty = variant.variantProperties?.["Size"];
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
   * Find the nearest larger variant to scale from
   */
  private findNearestLargerVariant(
    variants: ComponentNode[],
    targetSize: number,
  ): ComponentNode | null {
    const largerVariants = variants
      .filter((v) => this.getVariantSize(v) > targetSize)
      .sort((a, b) => this.getVariantSize(a) - this.getVariantSize(b));

    return largerVariants[0] || null;
  }

  /**
   * Create a scaled variant from a source variant
   */
  private async createScaledVariant(
    source: ComponentNode,
    targetSize: number,
    variantType: string,
    componentSet: ComponentSetNode,
  ): Promise<void> {
    try {
      const sourceSize = this.getVariantSize(source);
      const scaleFactor = targetSize / sourceSize;

      console.log(
        `  Creating ${targetSize}px from ${sourceSize}px (scale: ${scaleFactor.toFixed(2)})`,
      );

      // Clone source variant
      const clone = source.clone();

      // Resize the clone component
      clone.resize(targetSize, targetSize);

      // Also resize the container (Frame) inside the component
      if (clone.children && clone.children.length > 0) {
        const container = clone.children[0];

        // Check if container has auto-layout
        const hasAutoLayout =
          "layoutMode" in container && container.layoutMode !== "NONE";

        if (hasAutoLayout) {
          // Auto-layout: scale the children directly, container adjusts automatically
          console.log(`    Auto-layout container detected`);

          if ("children" in container && container.children.length > 0) {
            for (const child of container.children) {
              if ("rescale" in child && typeof child.rescale === "function") {
                child.rescale(scaleFactor);
                console.log(
                  `    Rescaled child "${child.name}" by ${scaleFactor.toFixed(2)}`,
                );
              } else if (
                "resize" in child &&
                typeof child.resize === "function"
              ) {
                const childWidth = child.width * scaleFactor;
                const childHeight = child.height * scaleFactor;
                child.resize(childWidth, childHeight);
                console.log(
                  `    Resized child "${child.name}" to ${childWidth.toFixed(1)}x${childHeight.toFixed(1)}`,
                );
              }
            }
          }
        } else {
          // No auto-layout: use rescale() to proportionally scale children
          if (
            "rescale" in container &&
            typeof container.rescale === "function"
          ) {
            container.rescale(scaleFactor);
            console.log(
              `    Rescaled container and children by ${scaleFactor.toFixed(2)}`,
            );
          } else if (
            "resize" in container &&
            typeof container.resize === "function"
          ) {
            // Fallback: resize container and manually scale children
            container.resize(targetSize, targetSize);
            console.log(`    Resized container to ${targetSize}x${targetSize}`);

            // Manually scale children
            if ("children" in container && container.children.length > 0) {
              for (const child of container.children) {
                if ("rescale" in child && typeof child.rescale === "function") {
                  child.rescale(scaleFactor);
                  console.log(
                    `    Rescaled child "${child.name}" by ${scaleFactor.toFixed(2)}`,
                  );
                } else if (
                  "resize" in child &&
                  typeof child.resize === "function"
                ) {
                  const childWidth = child.width * scaleFactor;
                  const childHeight = child.height * scaleFactor;
                  child.resize(childWidth, childHeight);

                  // Also scale position
                  child.x = child.x * scaleFactor;
                  child.y = child.y * scaleFactor;
                  console.log(
                    `    Scaled child "${child.name}" to ${childWidth.toFixed(1)}x${childHeight.toFixed(1)} at (${child.x.toFixed(1)}, ${child.y.toFixed(1)})`,
                  );
                }
              }
            }
          }
        }

        // Remove fill from container
        if ("fills" in container && Array.isArray(container.fills)) {
          container.fills = [];
          console.log(`    Removed fill from container`);
        }
      }

      // Update name to reflect new size and variant
      clone.name = `Size=${targetSize}, Variant=${variantType}`;

      // Add to component set
      componentSet.appendChild(clone);

      console.log(`  ✓ Created ${targetSize}px ${variantType}`);
    } catch (error) {
      console.warn(
        `Could not create scaled variant ${targetSize}px from ${source.name}:`,
        error,
      );
    }
  }

  /**
   * Reorder variants in the component set
   *
   * Order: Outlined (32→12), then Filled (32→12)
   */
  private async reorderVariants(componentSet: ComponentSetNode): Promise<void> {
    console.log(`\nReordering variants...`);

    const variants = Array.from(componentSet.children as ComponentNode[]);

    // Sort variants
    const sorted = variants.sort((a, b) => {
      const aType = this.getVariantType(a);
      const bType = this.getVariantType(b);
      const aSize = this.getVariantSize(a);
      const bSize = this.getVariantSize(b);

      // First by variant type (Outlined before Filled)
      const aTypeIndex = this.variantOrder.indexOf(aType);
      const bTypeIndex = this.variantOrder.indexOf(bType);

      if (aTypeIndex !== bTypeIndex) {
        return aTypeIndex - bTypeIndex;
      }

      // Then by size (descending: 32, 28, 24, ...)
      return bSize - aSize;
    });

    // Reorder in component set
    for (let i = 0; i < sorted.length; i++) {
      componentSet.insertChild(i, sorted[i]);
    }

    console.log(`  ✓ Variants reordered`);
  }
}
