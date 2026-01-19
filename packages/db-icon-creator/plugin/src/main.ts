/**
 * DB Icon Creator Plugin - Main Entry Point
 *
 * This plugin validates and edits icon component sets according to DB guidelines.
 */

import type {
  UIMessage,
  PluginMessage,
  SelectionInfo,
  DescriptionData,
} from "./types/index.js";
import { getSelectionInfo, requireComponentSet } from "./utils/selection.js";
import { ErrorHandler } from "./utils/error-handler.js";
import { WorkflowOrchestrator } from "./utils/workflow-orchestrator.js";
import { VectorValidator } from "./validators/vector-validator.js";
import { NameValidator } from "./validators/name-validator.js";
import { SizeValidator } from "./validators/size-validator.js";
import { OutlineConverter } from "./processors/outline-converter.js";
import { FlattenProcessor } from "./processors/flatten-processor.js";
import { ColorApplicator } from "./processors/color-applicator.js";
import { ScaleProcessor } from "./processors/scale-processor.js";
import { DescriptionEditor } from "./processors/description-editor.js";

// Show the plugin UI
figma.showUI(__html__, {
  width: 500,
  height: 600,
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

    // Check if all 7 sizes exist for Outlined variant
    let isComplete = false;
    let hasOutlined = false;
    let hasFilled = false;
    let uniqueSizes = 0;

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

      isComplete = hasAllSizes;

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

    // Convert to serializable format for UI
    const selectionInfo: SelectionInfo = {
      isComponentSet: info.isComponentSet,
      iconType: info.iconType,
      componentSet: info.componentSet
        ? {
            name: info.componentSet.name,
            id: info.componentSet.id,
          }
        : null,
      variantCount: info.variants.length,
      isComplete,
      hasOutlined,
      hasFilled,
      uniqueSizes,
    };

    sendMessage({
      type: "selection-info",
      data: selectionInfo,
    });

    // Automatically run validations in background if a component set is selected
    if (info.isComponentSet && info.componentSet && info.iconType) {
      // Run name validation
      try {
        const nameValidator = new NameValidator(info.iconType);
        const nameResult = nameValidator.validate(info.componentSet.name);
        sendMessage({
          type: "name-validation-result",
          data: nameResult,
        });
      } catch (error) {
        console.warn("Name validation failed:", error);
      }

      // Run size validation
      try {
        const sizeValidator = new SizeValidator();
        const sizeResult = sizeValidator.validate(info.componentSet);
        sendMessage({
          type: "size-validation-result",
          data: sizeResult,
        });
      } catch (error) {
        console.warn("Size validation failed:", error);
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
    editor.updateDescription(info.componentSet!, data);

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
    const info = requireComponentSet();

    info.componentSet!.name = newName;

    // Re-validate after name change
    const validator = new NameValidator(info.iconType!);
    const result = validator.validate(newName);

    sendMessage({
      type: "name-validation-result",
      data: result,
    });

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

    // Step 1: Outline Conversion
    sendMessage({
      type: "progress",
      data: "Step 1/4: Converting outlines...",
    });
    const converter = new OutlineConverter(info.iconType!);
    await converter.convert(info.componentSet!);

    // Step 2: Color Application
    sendMessage({
      type: "progress",
      data: "Step 2/4: Applying colors...",
    });
    const config = {
      functional: "497497bca9694f6004d1667de59f1a903b3cd3ef",
      illustrative: "497497bca9694f6004d1667de59f1a903b3cd3ef",
    };
    const applicator = new ColorApplicator(info.iconType!, config);
    await applicator.apply(info.componentSet!);

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
