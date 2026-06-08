import { describe, it, expect } from "vitest";
import { hexToRgba } from "./color";

describe("color precision with real JSON values", () => {
  it("should preserve exact hex values from RITheme JSON", () => {
    // Test cases from RITheme-figma-custom-colors.json
    const testCases = [
      { hex: "#001110", r: 0, g: 17, b: 16 }, // db-poi-services/0
      { hex: "#010c2c", r: 1, g: 12, b: 44 }, // db-poi-db-services/0
      { hex: "#0C3992", r: 12, g: 57, b: 146 }, // origin-light-default
      { hex: "#1655d100", r: 22, g: 85, b: 209, a: 0 }, // transparent-full-light-default
      { hex: "#1655d13d", r: 22, g: 85, b: 209, a: 61 }, // transparent-full-light-hovered
      { hex: "#00A099", r: 0, g: 160, b: 153 }, // db-poi-services origin
      { hex: "#F39200", r: 243, g: 146, b: 0 }, // db-poi-food origin
      { hex: "#814997", r: 129, g: 73, b: 151 }, // db-poi-shopping origin
    ];

    testCases.forEach(({ hex, r, g, b, a }) => {
      const result = hexToRgba(hex);

      // Convert back to RGB to verify precision
      const resultR = Math.round(result.r * 255);
      const resultG = Math.round(result.g * 255);
      const resultB = Math.round(result.b * 255);

      expect(resultR).toBe(r);
      expect(resultG).toBe(g);
      expect(resultB).toBe(b);

      if (a !== undefined) {
        const resultA = Math.round(result.a * 255);
        expect(resultA).toBe(a);
      }
    });
  });

  it("should handle the problematic #001110 case correctly", () => {
    const result = hexToRgba("#001110");

    // Verify exact floating point values
    expect(result.r).toBe(0 / 255);
    expect(result.g).toBe(17 / 255);
    expect(result.b).toBe(16 / 255);

    // Verify that converting back gives exact values
    expect(Math.round(result.r * 255)).toBe(0);
    expect(Math.round(result.g * 255)).toBe(17);
    expect(Math.round(result.b * 255)).toBe(16);

    // This should NOT be #00120F (0, 18, 15)
    expect(Math.round(result.g * 255)).not.toBe(18);
    expect(Math.round(result.b * 255)).not.toBe(15);
  });

  it("should handle transparent colors with alpha channel", () => {
    // #1655d13d = rgba(22, 85, 209, 61/255)
    const result = hexToRgba("#1655d13d");

    expect(Math.round(result.r * 255)).toBe(22);
    expect(Math.round(result.g * 255)).toBe(85);
    expect(Math.round(result.b * 255)).toBe(209);
    expect(Math.round(result.a * 255)).toBe(61);
  });

  it("should handle fully transparent colors", () => {
    // #1655d100 = rgba(22, 85, 209, 0)
    const result = hexToRgba("#1655d100");

    expect(Math.round(result.r * 255)).toBe(22);
    expect(Math.round(result.g * 255)).toBe(85);
    expect(Math.round(result.b * 255)).toBe(209);
    expect(result.a).toBe(0);
  });
});
