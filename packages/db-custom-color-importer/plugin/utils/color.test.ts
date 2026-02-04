import { describe, it, expect } from "vitest";
import { hexToRgba, areColorsEqual } from "./color";

describe("color utils", () => {
  describe("hexToRgba", () => {
    it("should convert 6-digit hex to rgba", () => {
      const result = hexToRgba("#FF0000");
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    it("should convert black to rgba", () => {
      const result = hexToRgba("#000000");
      expect(result).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });

    it("should convert white to rgba", () => {
      const result = hexToRgba("#FFFFFF");
      expect(result).toEqual({ r: 1, g: 1, b: 1, a: 1 });
    });

    it("should handle 8-digit hex with alpha channel", () => {
      const result = hexToRgba("#FF000080");
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
    });

    it("should handle full opacity with 8-digit hex", () => {
      const result = hexToRgba("#00FF00FF");
      expect(result).toEqual({ r: 0, g: 1, b: 0, a: 1 });
    });

    it("should handle zero opacity with 8-digit hex", () => {
      const result = hexToRgba("#0000FF00");
      expect(result).toEqual({ r: 0, g: 0, b: 1, a: 0 });
    });

    it("should round values to 2 decimal places", () => {
      // #808080 = 128/255 = 0.5019... should round to 0.5
      const result = hexToRgba("#808080");
      expect(result.r).toBeCloseTo(0.5, 2);
      expect(result.g).toBeCloseTo(0.5, 2);
      expect(result.b).toBeCloseTo(0.5, 2);
    });
  });

  describe("areColorsEqual", () => {
    it("should return true for identical colors", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      const color2 = { r: 1, g: 0, b: 0, a: 1 };
      expect(areColorsEqual(color1, color2)).toBe(true);
    });

    it("should return true for colors within tolerance", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      const color2 = { r: 1.0005, g: 0.0005, b: 0.0005, a: 1 };
      expect(areColorsEqual(color1, color2)).toBe(true);
    });

    it("should return false for different colors", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      const color2 = { r: 0, g: 1, b: 0, a: 1 };
      expect(areColorsEqual(color1, color2)).toBe(false);
    });

    it("should return false for colors outside tolerance", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      const color2 = { r: 1.01, g: 0, b: 0, a: 1 };
      expect(areColorsEqual(color1, color2)).toBe(false);
    });

    it("should return false if first color is null", () => {
      const color2 = { r: 1, g: 0, b: 0, a: 1 };
      expect(areColorsEqual(null, color2)).toBe(false);
    });

    it("should return false if second color is null", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      expect(areColorsEqual(color1, null)).toBe(false);
    });

    it("should return false if both colors are null", () => {
      expect(areColorsEqual(null, null)).toBe(false);
    });

    it("should return false if first color is a variable alias", () => {
      const color1 = { type: "VARIABLE_ALIAS", id: "123" };
      const color2 = { r: 1, g: 0, b: 0, a: 1 };
      expect(areColorsEqual(color1, color2)).toBe(false);
    });

    it("should return false if second color is a variable alias", () => {
      const color1 = { r: 1, g: 0, b: 0, a: 1 };
      const color2 = { type: "VARIABLE_ALIAS", id: "123" };
      expect(areColorsEqual(color1, color2)).toBe(false);
    });
  });
});
