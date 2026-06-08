/**
 * Selection Manager Tests
 *
 * Tests for icon type detection when selecting variants within a ComponentSet
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import {
  getSelectionInfo,
  detectIconType,
  detectIconTypeFromComponent,
} from "./selection.js";
import { setupFigmaMock, cleanupFigmaMock } from "../test-utils/figma-mock.js";

describe("Selection Manager", () => {
  beforeAll(() => {
    setupFigmaMock();
  });

  afterAll(() => {
    cleanupFigmaMock();
  });

  beforeEach(() => {
    // Reset Figma mock state
    figma.currentPage.selection = [];
  });

  describe("detectIconType", () => {
    it("should detect functional icons from ComponentSet name", () => {
      const componentSet = {
        type: "COMPONENT_SET",
        name: "ic-functional-icon",
        children: [],
      } as ComponentSetNode;

      expect(detectIconType(componentSet)).toBe("functional");
    });

    it("should detect illustrative icons from ComponentSet name", () => {
      const componentSet = {
        type: "COMPONENT_SET",
        name: "illustrative-icon",
        children: [],
      } as ComponentSetNode;

      expect(detectIconType(componentSet)).toBe("illustrative");
    });

    it("should default to functional for ComponentSet without clear indicator", () => {
      const componentSet = {
        type: "COMPONENT_SET",
        name: "some-icon",
        children: [],
      } as ComponentSetNode;

      expect(detectIconType(componentSet)).toBe("functional");
    });
  });

  describe("detectIconTypeFromComponent", () => {
    it("should detect illustrative icons from Component name", () => {
      const component = {
        type: "COMPONENT",
        name: "ii-illustrative-icon",
      } as ComponentNode;

      expect(detectIconTypeFromComponent(component)).toBe("illustrative");
    });

    it("should detect functional icons from Component name", () => {
      const component = {
        type: "COMPONENT",
        name: "ic-functional-icon",
      } as ComponentNode;

      expect(detectIconTypeFromComponent(component)).toBe("functional");
    });

    it("should default to illustrative for Component without clear indicator", () => {
      const component = {
        type: "COMPONENT",
        name: "some-icon",
      } as ComponentNode;

      expect(detectIconTypeFromComponent(component)).toBe("illustrative");
    });
  });

  describe("getSelectionInfo - Variant within ComponentSet", () => {
    it("should detect functional icon type when selecting a variant within a functional ComponentSet", () => {
      // Create a functional ComponentSet
      const componentSet = {
        type: "COMPONENT_SET",
        name: "ic-functional-icon",
        children: [],
      } as ComponentSetNode;

      // Create a variant within the ComponentSet
      const variant = {
        type: "COMPONENT",
        name: "Size=32, Variant=(Def) Outlined",
        parent: componentSet,
      } as ComponentNode;

      // Select the variant
      figma.currentPage.selection = [variant];

      const info = getSelectionInfo();

      expect(info.isComponent).toBe(true);
      expect(info.isComponentSet).toBe(false);
      expect(info.iconType).toBe("functional");
      expect(info.component).toBe(variant);
    });

    it("should detect illustrative icon type when selecting a standalone component", () => {
      // Create a standalone illustrative component (no parent ComponentSet)
      const component = {
        type: "COMPONENT",
        name: "ii-illustrative-icon",
        parent: null,
      } as ComponentNode;

      // Select the component
      figma.currentPage.selection = [component];

      const info = getSelectionInfo();

      expect(info.isComponent).toBe(true);
      expect(info.isComponentSet).toBe(false);
      expect(info.iconType).toBe("illustrative");
      expect(info.component).toBe(component);
    });

    it("should detect functional icon type even when variant name doesn't contain 'ic-'", () => {
      // Create a functional ComponentSet
      const componentSet = {
        type: "COMPONENT_SET",
        name: "ic-arrow",
        children: [],
      } as ComponentSetNode;

      // Create a variant with a generic name (no 'ic-' prefix)
      const variant = {
        type: "COMPONENT",
        name: "Size=24, Variant=(Def) Outlined",
        parent: componentSet,
      } as ComponentNode;

      // Select the variant
      figma.currentPage.selection = [variant];

      const info = getSelectionInfo();

      expect(info.isComponent).toBe(true);
      expect(info.iconType).toBe("functional");
    });

    it("should handle variant with parent that is not a ComponentSet", () => {
      // Create a frame (not a ComponentSet)
      const frame = {
        type: "FRAME",
        name: "some-frame",
      } as FrameNode;

      // Create a component within the frame
      const component = {
        type: "COMPONENT",
        name: "some-component",
        parent: frame,
      } as ComponentNode;

      // Select the component
      figma.currentPage.selection = [component];

      const info = getSelectionInfo();

      expect(info.isComponent).toBe(true);
      expect(info.iconType).toBe("illustrative"); // Should default to illustrative
    });
  });

  describe("getSelectionInfo - ComponentSet selection", () => {
    it("should detect functional icon type when selecting a ComponentSet", () => {
      const componentSet = {
        type: "COMPONENT_SET",
        name: "ic-functional-icon",
        children: [],
      } as ComponentSetNode;

      figma.currentPage.selection = [componentSet];

      const info = getSelectionInfo();

      expect(info.isComponentSet).toBe(true);
      expect(info.isComponent).toBe(false);
      expect(info.iconType).toBe("functional");
      expect(info.componentSet).toBe(componentSet);
    });
  });

  describe("getSelectionInfo - No selection", () => {
    it("should return null values when nothing is selected", () => {
      figma.currentPage.selection = [];

      const info = getSelectionInfo();

      expect(info.isComponentSet).toBe(false);
      expect(info.isComponent).toBe(false);
      expect(info.iconType).toBe(null);
      expect(info.componentSet).toBe(null);
      expect(info.component).toBe(null);
    });
  });
});
