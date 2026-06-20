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

      // Store the parent and position of the old component set
      const parent = componentSet.parent;
      const oldX = componentSet.x;
      const oldY = componentSet.y;
      const oldName = componentSet.name;

      console.log(`\nCreating new ComponentSet to ensure correct order...`);

      // Collect all variants to add in the correct order
      const variantsToAdd: ComponentNode[] = [];

      // Process each variant type in order (Outlined first, then Filled)
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

        // Create ALL sizes IN ORDER (32, 28, 24, 20, 16, 14, 12)
        for (const targetSize of this.targetSizes) {
          const existing = existingVariants.find(
            (v) => this.getVariantSize(v) === targetSize,
          );

          let variantToAdd: ComponentNode;

          if (existing) {
            console.log(`  ${targetSize}px exists, cloning...`);
            variantToAdd = existing.clone();
          } else {
            // Find nearest larger size to scale from
            const sourceVariant = this.findNearestLargerVariant(
              existingVariants,
              targetSize,
            );

            if (!sourceVariant) {
              console.warn(`  No source variant found for ${targetSize}px`);
              continue;
            }

            const newVariant = await this.createScaledVariant(
              sourceVariant,
              targetSize,
              variantType,
            );

            if (!newVariant) {
              console.warn(`  Could not create ${targetSize}px`);
              continue;
            }

            variantToAdd = newVariant;
            console.log(`  ✓ Created ${targetSize}px ${variantType}`);
          }

          // Set the correct name
          variantToAdd.name = `Size=${targetSize}, Variant=${variantType}`;

          // Add to parent temporarily
          if (parent && "appendChild" in parent) {
            (parent as PageNode | FrameNode | SectionNode).appendChild(
              variantToAdd,
            );
          }

          variantsToAdd.push(variantToAdd);
          console.log(`  ✓ Prepared ${targetSize}px ${variantType}`);
        }
      }

      // Create new component set from all variants
      console.log(
        `\nCombining ${variantsToAdd.length} variants into ComponentSet...`,
      );
      const newComponentSet = figma.combineAsVariants(
        variantsToAdd,
        parent as PageNode | FrameNode | GroupNode,
      );
      newComponentSet.name = oldName;
      newComponentSet.x = oldX;
      newComponentSet.y = oldY;

      // Copy all settings from old component set to new one
      console.log(`\nCopying settings from old ComponentSet...`);

      // Copy layout settings
      if (componentSet.layoutMode !== "NONE") {
        newComponentSet.layoutMode = componentSet.layoutMode;
        newComponentSet.primaryAxisSizingMode =
          componentSet.primaryAxisSizingMode;
        newComponentSet.counterAxisSizingMode =
          componentSet.counterAxisSizingMode;
        newComponentSet.primaryAxisAlignItems =
          componentSet.primaryAxisAlignItems;
        newComponentSet.counterAxisAlignItems =
          componentSet.counterAxisAlignItems;
        newComponentSet.itemSpacing = componentSet.itemSpacing;
        newComponentSet.paddingLeft = componentSet.paddingLeft;
        newComponentSet.paddingRight = componentSet.paddingRight;
        newComponentSet.paddingTop = componentSet.paddingTop;
        newComponentSet.paddingBottom = componentSet.paddingBottom;
        newComponentSet.layoutWrap = componentSet.layoutWrap;
        console.log(`  ✓ Copied auto layout settings`);
      }

      // Copy appearance settings
      newComponentSet.opacity = componentSet.opacity;
      newComponentSet.clipsContent = componentSet.clipsContent;

      if (
        "cornerRadius" in componentSet &&
        typeof componentSet.cornerRadius === "number"
      ) {
        newComponentSet.cornerRadius = componentSet.cornerRadius;
      }
      console.log(`  ✓ Copied appearance settings`);

      // Copy fills
      if (Array.isArray(componentSet.fills)) {
        newComponentSet.fills = JSON.parse(JSON.stringify(componentSet.fills));
        console.log(`  ✓ Copied fills`);
      }

      // Copy strokes
      if (Array.isArray(componentSet.strokes)) {
        newComponentSet.strokes = JSON.parse(
          JSON.stringify(componentSet.strokes),
        );
        newComponentSet.strokeWeight = componentSet.strokeWeight;
        newComponentSet.strokeAlign = componentSet.strokeAlign;
        console.log(`  ✓ Copied strokes`);
      }

      // Copy effects
      if (Array.isArray(componentSet.effects)) {
        newComponentSet.effects = JSON.parse(
          JSON.stringify(componentSet.effects),
        );
        console.log(`  ✓ Copied effects`);
      }

      // Remove old component set
      componentSet.remove();
      console.log(`\n✓ Replaced old ComponentSet with new one`);

      // Select the new component set so the plugin shows the Edit Icon Set screen
      figma.currentPage.selection = [newComponentSet];
      console.log(`✓ Selected new ComponentSet`);

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
   * Returns the new variant instead of adding it to the component set
   */
  private async createScaledVariant(
    source: ComponentNode,
    targetSize: number,
    variantType: string,
  ): Promise<ComponentNode | null> {
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

        // After flatten step, container should have exactly one "Vector" child
        if ("children" in container && container.children.length > 0) {
          console.log(
            `    Container has ${container.children.length} child(ren)`,
          );

          // Get the vector (should be named "Vector" after flatten)
          const vector = container.children[0];

          // Store original position before scaling
          const originalX = "x" in vector ? (vector.x as number) : 0;
          const originalY = "y" in vector ? (vector.y as number) : 0;

          console.log(
            `    Vector "${vector.name}" original position: (${originalX}, ${originalY})`,
          );

          // Scale the vector using rescale()
          if ("rescale" in vector && typeof vector.rescale === "function") {
            vector.rescale(scaleFactor);
            console.log(
              `    Rescaled vector "${vector.name}" by ${scaleFactor.toFixed(2)}`,
            );

            // Scale the position as well (for non-auto-layout containers)
            if ("x" in vector && "y" in vector) {
              const newX = originalX * scaleFactor;
              const newY = originalY * scaleFactor;
              vector.x = newX;
              vector.y = newY;
              console.log(
                `    Scaled position to (${newX.toFixed(2)}, ${newY.toFixed(2)})`,
              );
            }
          } else {
            console.warn(
              `    Vector "${vector.name}" does not support rescale()`,
            );
          }
        } else {
          console.warn(`    Container has no children to scale`);
        }

        // Resize container to target size
        if ("resize" in container && typeof container.resize === "function") {
          container.resize(targetSize, targetSize);
          console.log(`    Resized container to ${targetSize}x${targetSize}`);
        }

        // Remove fill from container
        if ("fills" in container && Array.isArray(container.fills)) {
          container.fills = [];
          console.log(`    Removed fill from container`);
        }
      }

      // Update name to reflect new size and variant
      clone.name = `Size=${targetSize}, Variant=${variantType}`;

      return clone;
    } catch (error) {
      console.warn(
        `Could not create scaled variant ${targetSize}px from ${source.name}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Find the correct position to insert a new variant
   * Variants should be ordered by: Variant type (Outlined, Filled), then Size (descending)
   */
  private findInsertPosition(
    componentSet: ComponentSetNode,
    targetSize: number,
    variantType: string,
  ): number {
    const variants = Array.from(componentSet.children as ComponentNode[]);

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const vType = this.getVariantType(variant);
      const vSize = this.getVariantSize(variant);

      const targetTypeIndex = this.variantOrder.indexOf(variantType);
      const vTypeIndex = this.variantOrder.indexOf(vType);

      // If we're in a different variant type section
      if (vTypeIndex > targetTypeIndex) {
        // Insert before this variant (we're in the next type section)
        return i;
      }

      // Same variant type - check size
      if (vTypeIndex === targetTypeIndex && vSize < targetSize) {
        // Insert before this variant (sizes are descending)
        return i;
      }
    }

    // Insert at the end
    return variants.length;
  }
}
