/**
 * Description Editor Tests
 *
 * Tests for the DescriptionEditor which handles:
 * - Formatting descriptions according to templates
 * - Parsing existing descriptions
 * - Validating description data
 * - Updating component descriptions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DescriptionEditor } from "./description-editor.js";
import type { DescriptionData } from "../types/index.js";

describe("DescriptionEditor", () => {
  describe("Functional Icons", () => {
    let editor: DescriptionEditor;

    beforeEach(() => {
      editor = new DescriptionEditor("functional");
    });

    describe("formatDescription", () => {
      it("should format functional icon description with all fields", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "Add item to list",
          enContextual: "Use when adding new items",
          deDefault: "Element zur Liste hinzufügen",
          deContextual: "Verwenden beim Hinzufügen neuer Elemente",
          keywords: "add, plus, new, create",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toBe(
          `EN:\n` +
            `Default: Add item to list\n` +
            `Contextual: Use when adding new items\n` +
            `\n` +
            `DE:\n` +
            `Default: Element zur Liste hinzufügen\n` +
            `Contextual: Verwenden beim Hinzufügen neuer Elemente\n` +
            `\n` +
            `Keywords: add, plus, new, create\n` +
            `#functionalicon #fi #coreicon`,
        );
      });

      it("should format functional icon description with only required fields", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "Add item",
          enContextual: "",
          deDefault: "Element hinzufügen",
          deContextual: "",
          keywords: "",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toBe(
          `EN:\n` +
            `Default: Add item\n` +
            `Contextual: \n` +
            `\n` +
            `DE:\n` +
            `Default: Element hinzufügen\n` +
            `Contextual: \n` +
            `\n` +
            `Keywords: \n` +
            `#functionalicon #fi #coreicon`,
        );
      });

      it("should handle empty contextual fields", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "Save",
          enContextual: undefined as any,
          deDefault: "Speichern",
          deContextual: undefined as any,
          keywords: undefined as any,
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toContain("Contextual: \n");
        expect(mockNode.description).toContain("Keywords: \n");
      });
    });

    describe("parseDescription", () => {
      it("should parse functional icon description with all fields", () => {
        const description =
          `EN:\n` +
          `Default: Add item to list\n` +
          `Contextual: Use when adding new items\n` +
          `\n` +
          `DE:\n` +
          `Default: Element zur Liste hinzufügen\n` +
          `Contextual: Verwenden beim Hinzufügen neuer Elemente\n` +
          `\n` +
          `Keywords: add, plus, new, create\n` +
          `#functionalicon #fi #coreicon`;

        const result = editor.parseDescription(description);

        expect(result).not.toBeNull();
        expect(result!.enDefault).toBe("Add item to list");
        expect(result!.enContextual).toBe("Use when adding new items");
        expect(result!.deDefault).toBe("Element zur Liste hinzufügen");
        expect(result!.deContextual).toBe(
          "Verwenden beim Hinzufügen neuer Elemente",
        );
        expect(result!.keywords).toBe("add, plus, new, create");
      });

      it("should parse functional icon description with only required fields", () => {
        const description =
          `EN:\n` +
          `Default: Save\n` +
          `Contextual: \n` +
          `\n` +
          `DE:\n` +
          `Default: Speichern\n` +
          `Contextual: \n` +
          `\n` +
          `Keywords: \n` +
          `#functionalicon #fi #coreicon`;

        const result = editor.parseDescription(description);

        expect(result).not.toBeNull();
        expect(result!.enDefault).toBe("Save");
        expect(result!.enContextual).toBe("");
        expect(result!.deDefault).toBe("Speichern");
        expect(result!.deContextual).toBe("");
        expect(result!.keywords).toBe("");
      });

      it("should return null for invalid functional description", () => {
        const description = "Invalid description format";

        const result = editor.parseDescription(description);

        expect(result).toBeNull();
      });

      it("should return null if required fields are missing", () => {
        const description =
          `EN:\n` + `Default: Save\n` + `\n` + `DE:\n` + `Contextual: \n`;

        const result = editor.parseDescription(description);

        expect(result).toBeNull();
      });
    });

    describe("validation", () => {
      it("should throw error if EN Default is missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "Speichern",
          deContextual: "",
          keywords: "",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "EN Default is required",
        );
      });

      it("should throw error if DE Default is missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "Save",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "DE Default is required",
        );
      });

      it("should throw error if both required fields are missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "Invalid description data",
        );
      });

      it("should accept whitespace-only fields as empty", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "Save",
          enContextual: "   ",
          deDefault: "Speichern",
          deContextual: "   ",
          keywords: "   ",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toContain("Contextual: \n");
        expect(mockNode.description).toContain("Keywords: \n");
      });
    });
  });

  describe("Illustrative Icons", () => {
    let editor: DescriptionEditor;

    beforeEach(() => {
      editor = new DescriptionEditor("illustrative");
    });

    describe("formatDescription", () => {
      it("should format illustrative icon description with all fields", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "Train station building with platform",
          de: "Bahnhofsgebäude mit Bahnsteig",
          illustrativeKeywords: "train, station, railway, platform",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toBe(
          `EN: Train station building with platform\n` +
            `DE: Bahnhofsgebäude mit Bahnsteig\n` +
            `\n` +
            `Keywords: train, station, railway, platform\n` +
            `#illustrativeicon #ii`,
        );
      });

      it("should format illustrative icon description without keywords", () => {
        const mockNode = {
          description: "",
        } as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "Train station",
          de: "Bahnhof",
          illustrativeKeywords: "",
        };

        editor.updateDescription(mockNode, data);

        expect(mockNode.description).toBe(
          `EN: Train station\n` +
            `DE: Bahnhof\n` +
            `\n` +
            `Keywords: \n` +
            `#illustrativeicon #ii`,
        );
      });
    });

    describe("parseDescription", () => {
      it("should parse illustrative icon description with all fields", () => {
        const description =
          `EN: Train station building with platform\n` +
          `DE: Bahnhofsgebäude mit Bahnsteig\n` +
          `\n` +
          `Keywords: train, station, railway, platform\n` +
          `#illustrativeicon #ii`;

        const result = editor.parseDescription(description);

        expect(result).not.toBeNull();
        expect(result!.en).toBe("Train station building with platform");
        expect(result!.de).toBe("Bahnhofsgebäude mit Bahnsteig");
        expect(result!.illustrativeKeywords).toBe(
          "train, station, railway, platform",
        );
      });

      it("should parse illustrative icon description without keywords", () => {
        const description =
          `EN: Train station\n` +
          `DE: Bahnhof\n` +
          `\n` +
          `Keywords: \n` +
          `#illustrativeicon #ii`;

        const result = editor.parseDescription(description);

        expect(result).not.toBeNull();
        expect(result!.en).toBe("Train station");
        expect(result!.de).toBe("Bahnhof");
        expect(result!.illustrativeKeywords).toBe("");
      });

      it("should return null for invalid illustrative description", () => {
        const description = "Invalid description format";

        const result = editor.parseDescription(description);

        expect(result).toBeNull();
      });

      it("should return null if required fields are missing", () => {
        const description =
          `EN: Train station\n` +
          `\n` +
          `Keywords: \n` +
          `#illustrativeicon #ii`;

        const result = editor.parseDescription(description);

        expect(result).toBeNull();
      });
    });

    describe("validation", () => {
      it("should throw error if EN is missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "",
          de: "Bahnhof",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "EN is required",
        );
      });

      it("should throw error if DE is missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "Train station",
          de: "",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "DE is required",
        );
      });

      it("should throw error if both required fields are missing", () => {
        const mockNode = {} as any;

        const data: DescriptionData = {
          enDefault: "",
          enContextual: "",
          deDefault: "",
          deContextual: "",
          keywords: "",
          en: "",
          de: "",
          illustrativeKeywords: "",
        };

        expect(() => editor.updateDescription(mockNode, data)).toThrow(
          "Invalid description data",
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiline descriptions", () => {
      const editor = new DescriptionEditor("illustrative");
      const mockNode = {
        description: "",
      } as any;

      const data: DescriptionData = {
        enDefault: "",
        enContextual: "",
        deDefault: "",
        deContextual: "",
        keywords: "",
        en: "Train station\nwith multiple lines",
        de: "Bahnhof\nmit mehreren Zeilen",
        illustrativeKeywords: "",
      };

      editor.updateDescription(mockNode, data);

      expect(mockNode.description).toContain(
        "Train station\nwith multiple lines",
      );
      expect(mockNode.description).toContain("Bahnhof\nmit mehreren Zeilen");
    });

    it("should handle special characters in descriptions", () => {
      const editor = new DescriptionEditor("functional");
      const mockNode = {
        description: "",
      } as any;

      const data: DescriptionData = {
        enDefault: "Save & Exit",
        enContextual: "Use when saving (important!)",
        deDefault: "Speichern & Beenden",
        deContextual: "Verwenden beim Speichern (wichtig!)",
        keywords: "save, exit, &, special",
        en: "",
        de: "",
        illustrativeKeywords: "",
      };

      editor.updateDescription(mockNode, data);

      expect(mockNode.description).toContain("Save & Exit");
      expect(mockNode.description).toContain("Use when saving (important!)");
    });

    it("should trim whitespace from field values", () => {
      const editor = new DescriptionEditor("functional");
      const mockNode = {
        description: "",
      } as any;

      const data: DescriptionData = {
        enDefault: "  Save  ",
        enContextual: "  Context  ",
        deDefault: "  Speichern  ",
        deContextual: "  Kontext  ",
        keywords: "  save, exit  ",
        en: "",
        de: "",
        illustrativeKeywords: "",
      };

      // Should not throw validation error
      expect(() => editor.updateDescription(mockNode, data)).not.toThrow();
    });
  });
});
