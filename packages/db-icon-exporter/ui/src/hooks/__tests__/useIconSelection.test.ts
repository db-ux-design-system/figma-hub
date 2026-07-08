import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIconSelection } from "../useIconSelection";
import { createMockIcon } from "../../test/test-utils";

describe("useIconSelection", () => {
  describe("getIconSetName", () => {
    it("should extract icon set name by splitting on special characters", () => {
      const { result } = renderHook(() => useIconSelection());

      // The actual implementation splits by "/" and "="
      expect(result.current.getIconSetName("icon-name/variant")).toBe(
        "icon-name",
      );
      expect(result.current.getIconSetName("icon-name=value")).toBe(
        "icon-name",
      );
    });

    it("should handle icon names without special characters", () => {
      const { result } = renderHook(() => useIconSelection());

      expect(result.current.getIconSetName("icon-name")).toBe("icon-name");
      expect(result.current.getIconSetName("test-icon")).toBe("test-icon");
    });
  });

  describe("isPropertyDefinition", () => {
    it("should identify property definition names", () => {
      const { result } = renderHook(() => useIconSelection());

      expect(result.current.isPropertyDefinition("size")).toBe(true);
      expect(result.current.isPropertyDefinition("variant")).toBe(true);
      expect(result.current.isPropertyDefinition("state")).toBe(true);
      expect(result.current.isPropertyDefinition("type")).toBe(true);
      expect(result.current.isPropertyDefinition("color")).toBe(true);
    });

    it("should not identify regular icon names as properties", () => {
      const { result } = renderHook(() => useIconSelection());

      expect(result.current.isPropertyDefinition("icon-name")).toBe(false);
      expect(result.current.isPropertyDefinition("test-icon")).toBe(false);
    });
  });

  describe("toggleIconSet", () => {
    it("should select an icon set when not selected", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon = createMockIcon({ name: "test-icon", category: "Test" });

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.isIconSetSelected("test-icon")).toBe(true);
      expect(result.current.selectedIcons).toHaveLength(1);
    });

    it("should deselect an icon set when already selected", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon = createMockIcon({ name: "test-icon", category: "Test" });

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.isIconSetSelected("test-icon")).toBe(true);

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.isIconSetSelected("test-icon")).toBe(false);
      expect(result.current.selectedIcons).toHaveLength(0);
    });

    it("should set default status to feat when selecting", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon = createMockIcon({ name: "test-icon", category: "Test" });

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.selectedIcons[0].status).toBe("feat");
    });
  });

  describe("updateIconStatus", () => {
    it("should update status of selected icon by icon id", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon = createMockIcon({
        name: "test-icon",
        id: "test-id-123",
        category: "Test",
      });

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.selectedIcons[0].status).toBe("feat");

      act(() => {
        // updateIconStatus uses icon.id, not set name
        result.current.updateIconStatus("test-id-123", "fix");
      });

      expect(result.current.selectedIcons[0].status).toBe("fix");
    });
  });

  describe("setAllIconsToStatus", () => {
    it("should update status of all selected icons", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon1 = createMockIcon({ name: "icon-1", category: "Test" });
      const icon2 = createMockIcon({ name: "icon-2", category: "Test" });

      act(() => {
        result.current.toggleIconSet("icon-1", [icon1]);
        result.current.toggleIconSet("icon-2", [icon2]);
      });

      expect(result.current.selectedIcons).toHaveLength(2);

      act(() => {
        result.current.setAllIconsToStatus("refactor");
      });

      expect(result.current.selectedIcons[0].status).toBe("refactor");
      expect(result.current.selectedIcons[1].status).toBe("refactor");
    });
  });

  describe("selectCategory", () => {
    it("should select all icon sets in a category", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon1 = createMockIcon({ name: "icon-1", category: "Test" });
      const icon2 = createMockIcon({ name: "icon-2", category: "Test" });
      const iconSets = new Map([
        ["icon-1", [icon1]],
        ["icon-2", [icon2]],
      ]);

      act(() => {
        result.current.selectCategory("Test", iconSets);
      });

      expect(result.current.selectedIcons).toHaveLength(2);
      expect(result.current.selectedCategories).toContain("Test");
    });

    it("should deselect all icon sets in a category when already selected", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon1 = createMockIcon({ name: "icon-1", category: "Test" });
      const icon2 = createMockIcon({ name: "icon-2", category: "Test" });
      const iconSets = new Map([
        ["icon-1", [icon1]],
        ["icon-2", [icon2]],
      ]);

      act(() => {
        result.current.selectCategory("Test", iconSets);
      });

      expect(result.current.selectedIcons).toHaveLength(2);

      act(() => {
        result.current.selectCategory("Test", iconSets);
      });

      expect(result.current.selectedIcons).toHaveLength(0);
      expect(result.current.selectedCategories).not.toContain("Test");
    });
  });

  describe("selectAllIconSets", () => {
    it("should select all icon sets", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon1 = createMockIcon({ name: "icon-1", category: "Cat1" });
      const icon2 = createMockIcon({ name: "icon-2", category: "Cat2" });
      const iconSets = new Map([
        ["icon-1", [icon1]],
        ["icon-2", [icon2]],
      ]);

      act(() => {
        result.current.selectAllIconSets(iconSets, ["Cat1", "Cat2"]);
      });

      expect(result.current.selectedIcons).toHaveLength(2);
      expect(result.current.selectedCategories).toContain("Cat1");
      expect(result.current.selectedCategories).toContain("Cat2");
    });
  });

  describe("clearSelection", () => {
    it("should clear all selections", () => {
      const { result } = renderHook(() => useIconSelection());
      const icon = createMockIcon({ name: "test-icon", category: "Test" });

      act(() => {
        result.current.toggleIconSet("test-icon", [icon]);
      });

      expect(result.current.selectedIcons).toHaveLength(1);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIcons).toHaveLength(0);
      expect(result.current.selectedCategories).toHaveLength(0);
    });
  });
});
