/**
 * Description Editor
 *
 * Edits icon descriptions according to templates.
 * Implements Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import type { DescriptionData } from "../types/index.js";
import { ProcessingError } from "../utils/error-handler.js";

/**
 * Description Editor class
 *
 * Formats and updates icon descriptions according to templates.
 */
export class DescriptionEditor {
  private iconType: "functional" | "illustrative";

  constructor(iconType: "functional" | "illustrative") {
    this.iconType = iconType;
  }

  /**
   * Update the description of a component set
   *
   * Requirements:
   * - 8.1: Update the Icon_Description field
   * - 8.3: Format the Icon_Description according to predefined templates
   * - 8.4: Use functional icon description templates
   * - 8.5: Use illustrative icon description templates
   * - 8.6: Validate that all required description fields are provided
   *
   * @param componentSet - The component set to update
   * @param data - The description data
   */
  updateDescription(
    componentSet: ComponentSetNode,
    data: DescriptionData,
  ): void {
    // Requirement 8.6: Validate that all required fields are provided
    this.validateDescriptionData(data);

    // Requirement 8.3: Format according to template
    const description = this.formatDescription(data);

    // Requirement 8.1: Update the Icon_Description field
    componentSet.description = description;
  }

  /**
   * Format description according to the new template
   *
   * Format:
   * EN:
   * Default: [text]
   * Contextual: [text]
   * DE:
   * Default: [text]
   * Contextual: [text]
   * Keywords: [text]
   * #functionalicon #fi #coreicon (or #illustrativeicon #illu)
   *
   * @param data - The description data
   * @returns Formatted description string
   */
  private formatDescription(data: DescriptionData): string {
    const hashtags =
      this.iconType === "functional"
        ? "#functionalicon #fi #coreicon"
        : "#illustrativeicon #ii";

    return (
      `EN:\n` +
      `Default: ${data.enDefault}\n` +
      `Contextual: ${data.enContextual}\n` +
      `\n` +
      `DE:\n` +
      `Default: ${data.deDefault}\n` +
      `Contextual: ${data.deContextual}\n` +
      `\n` +
      `Keywords: ${data.keywords}\n` +
      `${hashtags}`
    );
  }

  /**
   * Parse an existing description back to DescriptionData
   *
   * Requirement 8.3: Parse description format
   *
   * @param description - The description string to parse
   * @returns Parsed description data or null if invalid
   */
  parseDescription(description: string): DescriptionData | null {
    const lines = description.split("\n");
    const data: Partial<DescriptionData> = {};

    let currentSection = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === "EN:") {
        currentSection = "EN";
      } else if (trimmedLine === "DE:") {
        currentSection = "DE";
      } else if (trimmedLine.startsWith("Default:")) {
        const value = trimmedLine.substring("Default:".length).trim();
        if (currentSection === "EN") {
          data.enDefault = value;
        } else if (currentSection === "DE") {
          data.deDefault = value;
        }
      } else if (trimmedLine.startsWith("Contextual:")) {
        const value = trimmedLine.substring("Contextual:".length).trim();
        if (currentSection === "EN") {
          data.enContextual = value;
        } else if (currentSection === "DE") {
          data.deContextual = value;
        }
      } else if (trimmedLine.startsWith("Keywords:")) {
        data.keywords = trimmedLine.substring("Keywords:".length).trim();
      }
    }

    // Validate required fields
    if (
      data.enDefault &&
      data.enContextual &&
      data.deDefault &&
      data.deContextual &&
      data.keywords
    ) {
      return data as DescriptionData;
    }

    return null;
  }

  /**
   * Validate description data
   *
   * Requirement 8.6: Validate that all required description fields are provided
   *
   * @param data - The description data to validate
   * @throws ProcessingError if validation fails
   */
  private validateDescriptionData(data: DescriptionData): void {
    const errors: string[] = [];

    if (!data.enDefault || data.enDefault.trim().length === 0) {
      errors.push("EN Default is required");
    }

    if (!data.enContextual || data.enContextual.trim().length === 0) {
      errors.push("EN Contextual is required");
    }

    if (!data.deDefault || data.deDefault.trim().length === 0) {
      errors.push("DE Default is required");
    }

    if (!data.deContextual || data.deContextual.trim().length === 0) {
      errors.push("DE Contextual is required");
    }

    if (!data.keywords || data.keywords.trim().length === 0) {
      errors.push("Keywords are required");
    }

    if (errors.length > 0) {
      throw new ProcessingError(
        `Invalid description data: ${errors.join(", ")}`,
      );
    }
  }
}
