/**
 * Workflow Orchestrator
 *
 * Orchestrates the execution of multiple operations in sequence with progress reporting.
 * Implements Requirements 12.1, 12.2, 12.3, 12.4
 *
 * @example
 * ```typescript
 * // Example usage in main.ts handleRunAll function:
 * async function handleRunAll(): Promise<void> {
 *   const orchestrator = new WorkflowOrchestrator();
 *
 *   // Add steps in the correct order (Requirement 12.2)
 *   orchestrator.addStep("Validation", async () => {
 *     await handleValidation();
 *   });
 *   orchestrator.addStep("Outline Conversion", async () => {
 *     await handleOutlineConversion();
 *   });
 *   orchestrator.addStep("Flatten", async () => {
 *     await handleFlatten();
 *   });
 *   orchestrator.addStep("Color Application", async () => {
 *     await handleColorApplication();
 *   });
 *   orchestrator.addStep("Scaling", async () => {
 *     await handleScaling();
 *   });
 *   orchestrator.addStep("Description Editing", async () => {
 *     await handleDescriptionEdit();
 *   });
 *
 *   // Run workflow with progress reporting (Requirement 12.4)
 *   const result = await orchestrator.run((step, index, total) => {
 *     sendMessage({
 *       type: "progress",
 *       data: `Step ${index}/${total}: ${step}`
 *     });
 *   });
 *
 *   // Handle result (Requirement 12.3 - stop on failure)
 *   if (result.success) {
 *     sendMessage({
 *       type: "success",
 *       data: {
 *         message: "All operations completed successfully",
 *         completedSteps: result.completedSteps
 *       }
 *     });
 *   } else {
 *     sendMessage({
 *       type: "error",
 *       error: `Workflow failed at step "${result.failedStep}": ${result.error}`
 *     });
 *   }
 * }
 * ```
 */

import type { WorkflowResult } from "../types";

/**
 * Represents a single step in a workflow
 */
export interface WorkflowStep {
  name: string;
  execute: () => Promise<void>;
}

/**
 * Orchestrates the execution of workflow steps with progress reporting
 *
 * Requirements:
 * - 12.1: Provide a "Run All" option to execute all operations in sequence
 * - 12.2: Execute operations in the correct order
 * - 12.3: Stop the workflow if any operation fails
 * - 12.4: Report progress for each step in the workflow
 */
export class WorkflowOrchestrator {
  private steps: WorkflowStep[] = [];

  /**
   * Add a step to the workflow
   *
   * @param name - The name of the step (for progress reporting)
   * @param execute - The async function to execute for this step
   */
  addStep(name: string, execute: () => Promise<void>): void {
    this.steps.push({ name, execute });
  }

  /**
   * Run all workflow steps in sequence
   *
   * Executes each step in the order they were added. If any step fails,
   * execution stops and the error is reported.
   *
   * @param onProgress - Optional callback for progress updates
   * @returns WorkflowResult indicating success/failure and completed steps
   */
  async run(
    onProgress?: (step: string, index: number, total: number) => void,
  ): Promise<WorkflowResult> {
    const completedSteps: string[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      // Report progress before executing step (Requirement 12.4)
      if (onProgress) {
        onProgress(step.name, i + 1, this.steps.length);
      }

      try {
        // Execute step (Requirement 12.2 - in order)
        await step.execute();
        completedSteps.push(step.name);
      } catch (error) {
        // Stop workflow on failure (Requirement 12.3)
        return {
          success: false,
          completedSteps,
          failedStep: step.name,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // All steps completed successfully
    return {
      success: true,
      completedSteps,
    };
  }

  /**
   * Clear all steps from the workflow
   */
  clear(): void {
    this.steps = [];
  }

  /**
   * Get the number of steps in the workflow
   */
  getStepCount(): number {
    return this.steps.length;
  }

  /**
   * Get the names of all steps in the workflow
   */
  getStepNames(): string[] {
    return this.steps.map((step) => step.name);
  }
}
