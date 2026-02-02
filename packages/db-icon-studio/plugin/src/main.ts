/**
 * DB Icon Studio Plugin - Main Entry Point
 *
 * This plugin validates and edits icon component sets according to DB guidelines.
 */

import type {
  UIMessage,
  PluginMessage,
  SelectionInfo,
  DescriptionData,
  ValidationError,
} from "./types/index.js";
import { getSelectionInfo, requireComponentSet } from "./utils/selection.js";
import { ErrorHandler } from "./utils/error-handler.js";
import { WorkflowOrchestrator } from "./utils/workflow-orchestrator.js";
import { VectorValidator } from "./validators/vector-validator.js";
import { NameValidator } from "./validators/name-validator.js";
import { SizeValidator } from "./validators/size-validator.js";
import { IllustrativeSizeValidator } from "./validators/illustrative-size-validator.js";
import { IllustrativeCompletionValidator } from "./validators/illustrative-completion-validator.js";
import { FlattenOutlineValidator } from "./validators/flatten-outline-validator.js";
import { IllustrativeFlattenOutlineValidator } from "./validators/illustrative-flatten-outline-validator.js";
import { MasterIconValidator } from "./validators/master-icon-validator.js";
import { IllustrativeMasterValidator } from "./validators/illustrative-master-validator.js";
import { IllustrativeHandoverValidator } from "./validators/illustrative-handover-validator.js";
import { ComponentReadinessValidator } from "./validators/component-readiness-validator.js";
import { ColorApplicator } from "./processors/color-applicator.js";
import { ScaleProcessor } from "./processors/scale-processor.js";
import { DescriptionEditor } from "./processors/description-editor.js";
import { IllustrativeProcessor } from "./processors/illustrative-processor.js";
import { UnionProcessor } from "./processors/union-processor.js";
import { IllustrativeFlattenProcessor } from "./processors/illustrative-flatten-processor.js";

// Show the plugin UI
figma.showUI(__html__, {
  width: 500,
  height: 700,
  themeColors: true,
});

// Track if we're in the middle of processing to avoid re-validation
let isProcessing = false;

// Listen for selection changes and update UI
figma.on("selectionchange", () => {
  if (!isProcessing) {
    handleGetSelection();
  }
});

// Handle messages from UI
figma.ui.onmessage = async (msg: UIMessage) => {
  try {
    switch (msg.type) {
      case "get-selection":
        await handleGetSelection();
        break;
      case "validate":
        await handleValidation();
        break;
      case "convert-outline":
        await handleOutlineConversion();
        break;
      case "flatten":
        await handleFlatten();
        break;
      case "apply-colors":
        await handleColorApplication();
        break;
      case "scale":
        await handleScaling();
        break;
      case "edit-description":
        await handleDescriptionEdit(msg.payload);
        break;
      case "validate-name":
        await handleNameValidation();
        break;
      case "validate-size":
        await handleSizeValidation();
        break;
      case "update-name":
        await handleNameUpdate(msg.payload);
        break;
      case "create-icon-set":
        await handleCreateIconSet();
        break;
      case "create-illustrative-icon":
        await handleCreateIllustrativeIcon();
        break;
      case "run-all":
        await handleRunAll();
        break;
      default:
        console.warn("Unknown message type:", msg);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendMessage({ type: "error", error: errorMessage });
  }
};

// Helper function to send messages to UI
function sendMessage(msg: PluginMessage): void {
  figma.ui.postMessage(msg);
}

// Placeholder handlers - to be implemented in later tasks
async function handleGetSelection(): Promise<void> {
  try {
    const info = getSelectionInfo();

    let isComplete = false;
    let hasOutlined = false;
    let hasFilled = false;
    let uniqueSizes = 0;

    // Handle Component Set (functional icons)
    if (info.isComponentSet && info.componentSet) {
      const requiredSizes = [32, 28, 24, 20, 16, 14, 12];
      const outlinedVariantName = "(Def) Outlined";
      const filledVariantName = "Filled";

      const hasAllSizes = requiredSizes.every((size) => {
        const variantName = `Size=${size}, Variant=${outlinedVariantName}`;
        return (info.componentSet!.children as ComponentNode[]).some(
          (v) => v.name === variantName,
        );
      });

      // Check if name is valid
      const nameValidator = new NameValidator("functional");
      const nameResult = nameValidator.validate(info.componentSet.name);

      // Check if size is valid
      const sizeValidator = new SizeValidator();
      const sizeResult = sizeValidator.validate(info.componentSet);

      // Icon is only complete if all sizes exist AND name AND size are valid
      isComplete = hasAllSizes && nameResult.isValid && sizeResult.isValid;

      // Check if Outlined variants exist
      hasOutlined = (info.componentSet.children as ComponentNode[]).some((v) =>
        v.name.includes(`Variant=${outlinedVariantName}`),
      );

      // Check if Filled variants exist
      hasFilled = (info.componentSet.children as ComponentNode[]).some((v) =>
        v.name.includes(`Variant=${filledVariantName}`),
      );

      // Count unique sizes
      const sizes = new Set<number>();
      for (const variant of info.componentSet.children as ComponentNode[]) {
        const sizeMatch = variant.name.match(/Size=(\d+)/);
        if (sizeMatch) {
          sizes.add(parseInt(sizeMatch[1]));
        }
      }
      uniqueSizes = sizes.size;
    }

    // Handle single Component (illustrative icons or variant within functional set)
    if (info.isComponent && info.component) {
      if (info.iconType === "illustrative") {
        // For illustrative icons, check if it's complete using the validator
        const completionValidator = new IllustrativeCompletionValidator();
        const completionResult = completionValidator.validate(info.component);

        // Also check if name is valid
        const nameValidator = new NameValidator("illustrative");
        const nameResult = nameValidator.validate(info.component.name);

        // Also check if size is valid
        const sizeValidator = new IllustrativeSizeValidator();
        const sizeResult = sizeValidator.validate(info.component);

        // Also check vector properties (stroke width, etc.)
        const vectorValidator = new VectorValidator("illustrative");
        // Create a temporary component set wrapper for validation
        const tempComponentSet = {
          children: [info.component],
        } as ComponentSetNode;
        const vectorResult = vectorValidator.validate(tempComponentSet);

        // Icon is only complete if structure AND name AND size AND vectors are valid
        isComplete =
          completionResult.isComplete &&
          nameResult.isValid &&
          sizeResult.isValid &&
          vectorResult.isValid;
        uniqueSizes = 1; // Illustrative icons only have one size
      } else if (info.iconType === "functional") {
        // This is a variant within a functional icon set
        // Check if the parent ComponentSet exists and is complete
        const parentNode = info.component.parent;
        if (parentNode && parentNode.type === "COMPONENT_SET") {
          const requiredSizes = [32, 28, 24, 20, 16, 14, 12];
          const outlinedVariantName = "(Def) Outlined";

          const hasAllSizes = requiredSizes.every((size) => {
            const variantName = `Size=${size}, Variant=${outlinedVariantName}`;
            return (parentNode.children as ComponentNode[]).some(
              (v) => v.name === variantName,
            );
          });

          // Check if parent name is valid
          const nameValidator = new NameValidator("functional");
          const nameResult = nameValidator.validate(parentNode.name);

          // Check if parent size is valid
          const sizeValidator = new SizeValidator();
          const sizeResult = sizeValidator.validate(parentNode);

          // Icon is only complete if all sizes exist AND name AND size are valid
          isComplete = hasAllSizes && nameResult.isValid && sizeResult.isValid;

          // Count unique sizes from parent
          const sizes = new Set<number>();
          for (const variant of parentNode.children as ComponentNode[]) {
            const sizeMatch = variant.name.match(/Size=(\d+)/);
            if (sizeMatch) {
              sizes.add(parseInt(sizeMatch[1]));
            }
          }
          uniqueSizes = sizes.size;

          // Check if Outlined variants exist
          hasOutlined = (parentNode.children as ComponentNode[]).some((v) =>
            v.name.includes(`Variant=${outlinedVariantName}`),
          );

          // Check if Filled variants exist
          const filledVariantName = "Filled";
          hasFilled = (parentNode.children as ComponentNode[]).some((v) =>
            v.name.includes(`Variant=${filledVariantName}`),
          );
        }
      }
    }

    // Convert to serializable format for UI
    const selectionInfo: SelectionInfo = {
      isComponentSet: info.isComponentSet,
      isComponent: info.isComponent,
      isMasterIconFrame: info.isMasterIconFrame,
      isHandoverFrame: info.isHandoverFrame,
      iconType: info.iconType,
      componentSet: info.componentSet
        ? {
            name: info.componentSet.name,
            id: info.componentSet.id,
          }
        : null,
      component: info.component
        ? {
            name: info.component.name,
            id: info.component.id,
          }
        : null,
      masterIconFrame: info.masterIconFrame
        ? {
            name: info.masterIconFrame.name,
            id: info.masterIconFrame.id,
            size: Math.round(info.masterIconFrame.width),
          }
        : null,
      variantCount: info.variants.length,
      isComplete,
      hasOutlined,
      hasFilled,
      uniqueSizes,
    };

    // If a functional icon variant is selected, also send parent ComponentSet info
    if (info.isComponent && info.component && info.iconType === "functional") {
      const parentNode = info.component.parent;
      if (parentNode && parentNode.type === "COMPONENT_SET") {
        selectionInfo.componentSet = {
          name: parentNode.name,
          id: parentNode.id,
        };
        selectionInfo.variantCount = parentNode.children.length;
      }
    }

    sendMessage({
      type: "selection-info",
      data: selectionInfo,
    });

    // Parse existing description if available
    if (info.iconType) {
      let node = info.componentSet || info.component;

      // For functional icon variants, use the parent ComponentSet
      if (
        info.isComponent &&
        info.component &&
        info.iconType === "functional"
      ) {
        const parentNode = info.component.parent;
        if (parentNode && parentNode.type === "COMPONENT_SET") {
          node = parentNode;
        }
      }

      if (node && node.description) {
        try {
          const descriptionEditor = new DescriptionEditor(info.iconType);
          const parsedDescription = descriptionEditor.parseDescription(
            node.description,
          );
          if (parsedDescription) {
            sendMessage({
              type: "existing-description",
              data: parsedDescription,
            });
          }
        } catch (error) {
          console.warn("Failed to parse existing description:", error);
        }
      }
    }

    // Automatically run validations in background
    // For handover components, we also need name and size validation to enable the button
    if (info.iconType && !info.isMasterIconFrame) {
      // Run name validation (only for components/component sets, not for frames)
      if (info.isComponent || info.isComponentSet) {
        try {
          const nameValidator = new NameValidator(info.iconType);
          let name = "";

          // For functional icon variants, validate the parent ComponentSet name
          if (
            info.isComponent &&
            info.component &&
            info.iconType === "functional"
          ) {
            const parentNode = info.component.parent;
            if (parentNode && parentNode.type === "COMPONENT_SET") {
              name = parentNode.name;
            } else {
              name = info.component.name;
            }
          } else {
            name = info.componentSet?.name || info.component?.name || "";
          }

          const nameResult = nameValidator.validate(name);
          sendMessage({
            type: "name-validation-result",
            data: nameResult,
          });
        } catch (error) {
          console.warn("Name validation failed:", error);
        }
      }

      // Run size validation
      if (info.isComponentSet && info.componentSet) {
        try {
          const sizeValidator = new SizeValidator();
          const sizeResult = sizeValidator.validate(info.componentSet);

          // Also run vector validation for functional icons
          const vectorValidator = new VectorValidator("functional");
          const vectorResult = vectorValidator.validate(info.componentSet);

          // Note: Flatten/outline validation is now handled by Component Readiness Validator
          // to avoid duplicate error messages

          // Combine size and vector validation results
          const combinedResult = {
            isValid: sizeResult.isValid && vectorResult.isValid,
            errors: [...sizeResult.errors, ...vectorResult.errors],
            warnings: vectorResult.warnings || [],
          };

          sendMessage({
            type: "size-validation-result",
            data: combinedResult,
          });
        } catch (error) {
          console.warn("Size validation failed:", error);
        }
      }

      // Run size validation for illustrative icons (including handover context)
      if (
        info.isComponent &&
        info.component &&
        info.iconType === "illustrative"
      ) {
        try {
          const sizeValidator = new IllustrativeSizeValidator();
          const sizeResult = sizeValidator.validate(info.component);

          // Also run vector validation
          const vectorValidator = new VectorValidator("illustrative");
          const tempComponentSet = {
            children: [info.component],
          } as ComponentSetNode;
          const vectorResult = vectorValidator.validate(tempComponentSet);

          // Also run flatten/outline validation
          const flattenOutlineValidator =
            new IllustrativeFlattenOutlineValidator();
          const flattenOutlineResult = flattenOutlineValidator.validate(
            info.component,
          );

          // Note: Flatten/outline validation is now handled by Component Readiness Validator
          // to avoid duplicate error messages

          // Combine size and vector validation results
          const combinedResult = {
            isValid: sizeResult.isValid && vectorResult.isValid,
            errors: [...sizeResult.errors, ...vectorResult.errors],
            warnings: vectorResult.warnings || [],
          };

          sendMessage({
            type: "size-validation-result",
            data: combinedResult,
          });
        } catch (error) {
          console.warn("Illustrative validation failed:", error);
        }
      }

      // Run size validation for functional icon variants (selected component within a set)
      if (
        info.isComponent &&
        info.component &&
        info.iconType === "functional"
      ) {
        const parentNode = info.component.parent;
        if (parentNode && parentNode.type === "COMPONENT_SET") {
          try {
            const sizeValidator = new SizeValidator();
            const sizeResult = sizeValidator.validate(parentNode);

            // Also run vector validation
            const vectorValidator = new VectorValidator("functional");
            const vectorResult = vectorValidator.validate(parentNode);

            // Note: Flatten/outline validation is now handled by Component Readiness Validator
            // to avoid duplicate error messages

            // Combine size and vector validation results
            const combinedResult = {
              isValid: sizeResult.isValid && vectorResult.isValid,
              errors: [...sizeResult.errors, ...vectorResult.errors],
              warnings: vectorResult.warnings || [],
            };

            sendMessage({
              type: "size-validation-result",
              data: combinedResult,
            });
          } catch (error) {
            console.warn("Functional size validation failed:", error);
          }
        }
      }
    }

    // Automatically run validations for Master Icon Frames
    if (info.isMasterIconFrame && info.masterIconFrame) {
      try {
        // Use IllustrativeMasterValidator for illustrative icons (64px)
        // Use MasterIconValidator for functional icons (32px, 24px, 20px)
        const isIllustrative = info.iconType === "illustrative";
        const validator = isIllustrative
          ? new IllustrativeMasterValidator()
          : new MasterIconValidator();

        const masterIconResult = validator.validate(info.masterIconFrame);

        sendMessage({
          type: "size-validation-result",
          data: masterIconResult,
        });
      } catch (error) {
        console.warn("Master icon validation failed:", error);
      }
    }

    // Automatically run validations for Handover Frames (illustrative icons)
    if (info.isHandoverFrame && info.masterIconFrame) {
      console.log(
        "[handleGetSelection] Handover frame detected, running structured validation...",
      );

      // For frames (not yet components), send dummy name/size validation as valid
      // so the button logic works correctly
      if (!info.isComponent) {
        sendMessage({
          type: "name-validation-result",
          data: { isValid: true, errors: [] },
        });
        sendMessage({
          type: "size-validation-result",
          data: { isValid: true, errors: [], warnings: [] },
        });
      }

      try {
        // Check if the frame contains a component
        const hasComponent =
          info.masterIconFrame.children &&
          info.masterIconFrame.children.some(
            (child) => child.type === "COMPONENT",
          );

        console.log(
          `[handleGetSelection] Handover frame has component: ${hasComponent}`,
        );

        if (!hasComponent) {
          // Frame only - use the new structured validator
          const handoverValidator = new IllustrativeHandoverValidator();
          const handoverResult = handoverValidator.validate(
            info.masterIconFrame,
          );

          console.log(
            "[handleGetSelection] Handover frame validation result:",
            handoverResult,
          );

          sendMessage({
            type: "component-readiness-result",
            data: handoverResult,
          });
        } else {
          console.log(
            "[handleGetSelection] Component found, validating with structured validator",
          );
          // Component exists - use the structured validator
          const component = info.masterIconFrame.children.find(
            (child) => child.type === "COMPONENT",
          ) as ComponentNode | undefined;

          if (component) {
            const handoverValidator = new IllustrativeHandoverValidator();
            const handoverResult = handoverValidator.validate(component);

            console.log(
              "[handleGetSelection] Component validation result:",
              handoverResult,
            );

            sendMessage({
              type: "component-readiness-result",
              data: handoverResult,
            });
          }
        }
      } catch (error) {
        console.warn("Handover frame validation failed:", error);
      }
    }

    // Automatically run validations for Components in Handover context
    if (info.isHandoverFrame && info.isComponent && info.component) {
      console.log(
        "[handleGetSelection] Component in handover context detected, running structured validation...",
      );
      try {
        const handoverValidator = new IllustrativeHandoverValidator();
        const handoverResult = handoverValidator.validate(info.component);

        console.log(
          "[handleGetSelection] Component validation result:",
          handoverResult,
        );

        sendMessage({
          type: "component-readiness-result",
          data: handoverResult,
        });
      } catch (error) {
        console.warn("Handover component validation failed:", error);
      }
    }

    // Automatically run component readiness validation for Component Sets (not Master Icon Frames)
    if (info.isComponentSet && info.componentSet && !info.isMasterIconFrame) {
      try {
        const readinessValidator = new ComponentReadinessValidator();
        const readinessResult = readinessValidator.validateComponentSet(
          info.componentSet,
        );

        // Send as additional validation result
        sendMessage({
          type: "component-readiness-result",
          data: readinessResult,
        });
      } catch (error) {
        console.warn("Component readiness validation failed:", error);
      }
    }

    // Also run for single components (not Master Icon Frames, not Handover context)
    if (
      info.isComponent &&
      info.component &&
      !info.isComponentSet &&
      !info.isMasterIconFrame &&
      !info.isHandoverFrame
    ) {
      try {
        const readinessValidator = new ComponentReadinessValidator();
        const readinessResult = readinessValidator.validate(info.component);

        sendMessage({
          type: "component-readiness-result",
          data: readinessResult,
        });
      } catch (error) {
        console.warn("Component readiness validation failed:", error);
      }
    }
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleGetSelection",
      ),
    );
  }
}

async function handleValidation(): Promise<void> {
  try {
    // Requirement 2.1: Detect Component Set selection
    const info = requireComponentSet();

    // Requirement 3.1: Validate all vectors in the component set
    const validator = new VectorValidator(info.iconType!);
    const result = validator.validate(info.componentSet!);

    sendMessage({
      type: "validation-result",
      data: result,
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleValidation",
      ),
    );
  }
}

async function handleOutlineConversion(): Promise<void> {
  try {
    // Requirement 4.1: Convert all strokes to fills
    const info = requireComponentSet();

    const converter = new OutlineConverter(info.iconType!);
    await converter.convert(info.componentSet!);

    sendMessage({
      type: "success",
      data: { message: "Outline conversion completed successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleOutlineConversion",
      ),
    );
  }
}

async function handleFlatten(): Promise<void> {
  try {
    // Requirement 5.1: Combine all vectors into a single layer
    const info = requireComponentSet();

    const processor = new FlattenProcessor(info.iconType!);
    await processor.flatten(info.componentSet!);

    sendMessage({
      type: "success",
      data: { message: "Flatten operation completed successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleFlatten",
      ),
    );
  }
}

async function handleColorApplication(): Promise<void> {
  try {
    // Requirement 6.1: Apply color variables to the component set
    const info = requireComponentSet();

    // Color variable configuration (using variable keys from library)
    const config = {
      functional: "497497bca9694f6004d1667de59f1a903b3cd3ef",
      illustrative: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    };

    const applicator = new ColorApplicator(info.iconType!, config);
    await applicator.apply(info.componentSet!);

    sendMessage({
      type: "success",
      data: { message: "Color variables applied successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleColorApplication",
      ),
    );
  }
}

async function handleScaling(): Promise<void> {
  try {
    // Requirement 7.1, 7.2: Create scaled variants
    const info = requireComponentSet();

    const processor = new ScaleProcessor();
    await processor.scale(info.componentSet!);

    sendMessage({
      type: "success",
      data: { message: "Scaling completed successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleScaling",
      ),
    );
  }
}

async function handleDescriptionEdit(data: DescriptionData): Promise<void> {
  try {
    // Requirement 8.1: Update the Icon_Description field
    const info = requireComponentSet();

    const editor = new DescriptionEditor(info.iconType!);
    let node = info.componentSet || info.component;

    // For functional icon variants, use the parent ComponentSet
    if (info.isComponent && info.component && info.iconType === "functional") {
      const parentNode = info.component.parent;
      if (parentNode && parentNode.type === "COMPONENT_SET") {
        node = parentNode;
      }
    }

    if (node) {
      // If iconName is provided and the current name is a template name, update it
      if (data.iconName && data.iconName.trim().length > 0) {
        const currentName = node.name;
        const isTemplateName =
          currentName === "icon-name" || currentName === "icon_name";

        if (isTemplateName) {
          node.name = data.iconName;
          console.log(
            `Updated icon name from "${currentName}" to "${data.iconName}"`,
          );
        }
      }

      editor.updateDescription(node, data);
    }

    // Refresh selection info to update the UI with the new name
    await handleGetSelection();

    sendMessage({
      type: "success",
      data: { message: "Description updated successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleDescriptionEdit",
      ),
    );
  }
}

async function handleNameValidation(): Promise<void> {
  try {
    // Requirement 9.1: Validate the Icon_Name
    const info = requireComponentSet();

    const validator = new NameValidator(info.iconType!);
    const result = validator.validate(info.componentSet!.name);

    sendMessage({
      type: "name-validation-result",
      data: result,
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleNameValidation",
      ),
    );
  }
}

async function handleSizeValidation(): Promise<void> {
  try {
    const info = requireComponentSet();

    const validator = new SizeValidator();
    const result = validator.validate(info.componentSet!);

    sendMessage({
      type: "size-validation-result",
      data: result,
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleSizeValidation",
      ),
    );
  }
}

async function handleNameUpdate(newName: string): Promise<void> {
  try {
    const info = getSelectionInfo();

    // Update name for ComponentSet or Component
    if (info.componentSet) {
      info.componentSet.name = newName;
    } else if (info.component) {
      // Check if this is a variant within a ComponentSet
      const parentNode = info.component.parent;
      if (
        parentNode &&
        parentNode.type === "COMPONENT_SET" &&
        info.iconType === "functional"
      ) {
        // Update the parent ComponentSet name instead
        parentNode.name = newName;
      } else {
        // Update the component name (illustrative icon)
        info.component.name = newName;
      }
    } else {
      throw new Error("No component or component set selected");
    }

    // Re-validate after name change
    if (info.iconType) {
      const validator = new NameValidator(info.iconType);
      const result = validator.validate(newName);

      sendMessage({
        type: "name-validation-result",
        data: result,
      });
    }

    // Update selection info to reflect the new name
    await handleGetSelection();

    sendMessage({
      type: "success",
      data: { message: "Name updated successfully" },
    });
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleNameUpdate",
      ),
    );
  }
}

async function handleCreateIconSet(): Promise<void> {
  try {
    isProcessing = true;
    const info = requireComponentSet();

    // Step 0: Clean up structure (remove empty groups)
    sendMessage({
      type: "progress",
      data: "Step 0/4: Cleaning up structure...",
    });
    const flattenOutlineValidator = new FlattenOutlineValidator("functional");
    for (const variant of info.componentSet!.children as ComponentNode[]) {
      flattenOutlineValidator.cleanupStructure(variant);
    }

    // Step 1: Color Application
    sendMessage({
      type: "progress",
      data: "Step 1/4: Applying colors...",
    });
    const config = {
      functional: "497497bca9694f6004d1667de59f1a903b3cd3ef",
      illustrative: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    };
    const applicator = new ColorApplicator(info.iconType!, config);
    await applicator.apply(info.componentSet!);

    // Step 2: Flatten (combine all direct children in container)
    sendMessage({
      type: "progress",
      data: "Step 2/4: Flattening vector paths...",
    });
    const unionProcessor = new UnionProcessor();
    await unionProcessor.union(info.componentSet!);

    // Step 3: Scaling
    sendMessage({
      type: "progress",
      data: "Step 3/4: Creating scaled variants...",
    });
    const processor = new ScaleProcessor();
    await processor.scale(info.componentSet!);

    // Step 4: Open Description Dialog
    sendMessage({
      type: "progress",
      data: "Step 4/4: Opening description editor...",
    });

    // After workflow completes, allow selection changes again
    isProcessing = false;

    // Refresh selection info to update isComplete status
    await handleGetSelection();

    sendMessage({
      type: "open-description-dialog",
      data: null,
    });
  } catch (error) {
    isProcessing = false;
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleCreateIconSet",
      ),
    );
  }
}

async function handleCreateIllustrativeIcon(): Promise<void> {
  try {
    isProcessing = true;
    const info = requireComponentSet();

    if (!info.component) {
      throw new Error("No component selected");
    }

    // Step 0: Clean up structure (remove empty groups)
    sendMessage({
      type: "progress",
      data: "Step 0/3: Cleaning up structure...",
    });
    const flattenOutlineValidator = new FlattenOutlineValidator("functional");
    flattenOutlineValidator.cleanupStructure(info.component);

    // Step 1: Flatten and separate into Base + Pulse
    sendMessage({
      type: "progress",
      data: "Step 1/3: Flattening and separating layers...",
    });
    const flattenProcessor = new IllustrativeFlattenProcessor();
    await flattenProcessor.process(info.component);

    // Step 2: Apply colors to Base and Pulse layers
    sendMessage({
      type: "progress",
      data: "Step 2/3: Applying colors...",
    });
    const processor = new IllustrativeProcessor();
    await processor.process(info.component);

    // Step 3: Open Description Dialog
    sendMessage({
      type: "progress",
      data: "Step 3/3: Opening description editor...",
    });

    // After workflow completes, allow selection changes again
    isProcessing = false;

    // Refresh selection info
    await handleGetSelection();

    sendMessage({
      type: "open-description-dialog",
      data: null,
    });
  } catch (error) {
    isProcessing = false;
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleCreateIllustrativeIcon",
      ),
    );
  }
}

async function handleRunAll(): Promise<void> {
  try {
    // Requirement 12.1: Execute all operations in sequence
    const info = requireComponentSet();

    const orchestrator = new WorkflowOrchestrator();

    // Requirement 12.2: Execute operations in the correct order
    orchestrator.addStep("Validation", async () => {
      const validator = new VectorValidator(info.iconType!);
      const result = validator.validate(info.componentSet!);
      if (!result.isValid) {
        throw new Error(
          `Validation failed: ${result.errors.map((e) => e.message).join(", ")}`,
        );
      }
    });

    orchestrator.addStep("Outline Conversion", async () => {
      const converter = new OutlineConverter(info.iconType!);
      await converter.convert(info.componentSet!);
    });

    orchestrator.addStep("Flatten", async () => {
      const processor = new FlattenProcessor(info.iconType!);
      await processor.flatten(info.componentSet!);
    });

    orchestrator.addStep("Color Application", async () => {
      const config = {
        functional: "VariableID:functional-icon-color",
        illustrative: "VariableID:illustrative-icon-color",
      };
      const applicator = new ColorApplicator(info.iconType!, config);
      await applicator.apply(info.componentSet!);
    });

    orchestrator.addStep("Scaling", async () => {
      const processor = new ScaleProcessor();
      await processor.scale(info.componentSet!);
    });

    // Note: Description editing is skipped in "Run All" as it requires user input

    // Requirement 12.4: Report progress for each step
    const result = await orchestrator.run((step, index, total) => {
      sendMessage({
        type: "progress",
        data: `Step ${index}/${total}: ${step}`,
      });
    });

    // Requirement 12.3: Stop workflow if any operation fails
    if (result.success) {
      sendMessage({
        type: "success",
        data: {
          message: "All operations completed successfully",
          completedSteps: result.completedSteps,
        },
      });
    } else {
      sendMessage({
        type: "error",
        error: `Workflow failed at step "${result.failedStep}": ${result.error}`,
      });
    }
  } catch (error) {
    sendMessage(
      ErrorHandler.handle(
        error instanceof Error ? error : new Error(String(error)),
        "handleRunAll",
      ),
    );
  }
}
