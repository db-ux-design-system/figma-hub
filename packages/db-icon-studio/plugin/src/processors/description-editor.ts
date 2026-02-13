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
   * Update the description of a component set or component
   *
   * Requirements:
   * - 8.1: Update the Icon_Description field
   * - 8.3: Format the Icon_Description according to predefined templates
   * - 8.4: Use functional icon description templates
   * - 8.5: Use illustrative icon description templates
   * - 8.6: Validate that all required description fields are provided
   *
   * @param node - The component set or component to update
   * @param data - The description data
   */
  updateDescription(
    node: ComponentSetNode | ComponentNode,
    data: DescriptionData,
  ): void {
    // Requirement 8.6: Validate that all required fields are provided
    this.validateDescriptionData(data);

    // Requirement 8.3: Format according to template
    const description = this.formatDescription(data);

    // Requirement 8.1: Update the Icon_Description field
    node.description = description;
  }

  /**
   * Format description according to the template
   *
   * Functional format:
   * EN:
   * Default: [text]
   * Contextual: [text or empty]
   * DE:
   * Default: [text]
   * Contextual: [text or empty]
   * Keywords: [text or empty]
   * #functionalicon #fi #coreicon
   *
   * Illustrative format:
   * EN: [text]
   * DE: [text]
   * Keywords: [text or empty]
   * #illustrativeicon #ii
   *
   * @param data - The description data
   * @returns Formatted description string
   */
  private formatDescription(data: DescriptionData): string {
    if (this.iconType === "functional") {
      const enContextual =
        data.enContextual && data.enContextual.trim().length > 0
          ? data.enContextual
          : "";
      const deContextual =
        data.deContextual && data.deContextual.trim().length > 0
          ? data.deContextual
          : "";
      const keywords =
        data.keywords && data.keywords.trim().length > 0 ? data.keywords : "";

      return (
        `EN:\n` +
        `Default: ${data.enDefault}\n` +
        `Contextual: ${enContextual}\n` +
        `\n` +
        `DE:\n` +
        `Default: ${data.deDefault}\n` +
        `Contextual: ${deContextual}\n` +
        `\n` +
        `Keywords: ${keywords}\n` +
        `#functionalicon #fi #coreicon`
      );
    } else {
      // illustrative
      const keywords =
        data.illustrativeKeywords && data.illustrativeKeywords.trim().length > 0
          ? data.illustrativeKeywords
          : "";

      return (
        `EN: ${data.en}\n` +
        `DE: ${data.de}\n` +
        `\n` +
        `Keywords: ${keywords}\n` +
        `#illustrativeicon #ii`
      );
    }
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
    if (this.iconType === "functional") {
      return this.parseFunctionalDescription(description);
    } else {
      return this.parseIllustrativeDescription(description);
    }
  }

  /**
   * Parse functional icon description
   */
  private parseFunctionalDescription(
    description: string,
  ): DescriptionData | null {
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

    // Validate required fields (only Default fields are required)
    if (data.enDefault && data.deDefault) {
      return {
        enDefault: data.enDefault,
        enContextual: data.enContextual || "",
        deDefault: data.deDefault,
        deContextual: data.deContextual || "",
        keywords: data.keywords || "",
        en: "",
        de: "",
        illustrativeKeywords: "",
      } as DescriptionData;
    }

    return null;
  }

  /**
   * Parse illustrative icon description
   */
  private parseIllustrativeDescription(
    description: string,
  ): DescriptionData | null {
    const lines = description.split("\n");
    const data: Partial<DescriptionData> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("EN:")) {
        data.en = trimmedLine.substring("EN:".length).trim();
      } else if (trimmedLine.startsWith("DE:")) {
        data.de = trimmedLine.substring("DE:".length).trim();
      } else if (trimmedLine.startsWith("Keywords:")) {
        data.illustrativeKeywords = trimmedLine
          .substring("Keywords:".length)
          .trim();
      }
    }

    // Validate required fields
    if (data.en && data.de) {
      return {
        enDefault: "",
        enContextual: "",
        deDefault: "",
        deContextual: "",
        keywords: "",
        en: data.en,
        de: data.de,
        illustrativeKeywords: data.illustrativeKeywords || "",
      } as DescriptionData;
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

    if (this.iconType === "functional") {
      // Functional icons: Only Default fields are required
      if (!data.enDefault || data.enDefault.trim().length === 0) {
        errors.push("EN Default is required");
      }

      if (!data.deDefault || data.deDefault.trim().length === 0) {
        errors.push("DE Default is required");
      }
    } else {
      // Illustrative icons: EN and DE are required
      if (!data.en || data.en.trim().length === 0) {
        errors.push("EN is required");
      }

      if (!data.de || data.de.trim().length === 0) {
        errors.push("DE is required");
      }
    }

    if (errors.length > 0) {
      throw new ProcessingError(
        `Invalid description data: ${errors.join(", ")}`,
      );
    }
  }
}
