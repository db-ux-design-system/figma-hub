import { describe, it, expect } from "vitest";
import { getScopesForMapping, SCOPES, MODE_NAMES, MESSAGES } from "./config";

describe("config", () => {
  describe("getScopesForMapping", () => {
    it("should return BACKGROUND scopes for bg/ prefix", () => {
      const result = getScopesForMapping("bg/basic/level-1/default");
      expect(result).toEqual(SCOPES.BACKGROUND);
    });

    it("should return BACKGROUND scopes for origin/ prefix", () => {
      const result = getScopesForMapping("origin/default");
      expect(result).toEqual(SCOPES.BACKGROUND);
    });

    it("should return FOREGROUND scopes for on-bg/ prefix", () => {
      const result = getScopesForMapping("on-bg/basic/emphasis-100/default");
      expect(result).toEqual(SCOPES.FOREGROUND);
    });

    it("should return FOREGROUND scopes for on-origin/ prefix", () => {
      const result = getScopesForMapping("on-origin/default");
      expect(result).toEqual(SCOPES.FOREGROUND);
    });

    it("should return NONE scopes for unknown prefix", () => {
      const result = getScopesForMapping("unknown/path");
      expect(result).toEqual(SCOPES.NONE);
    });

    it("should return NONE scopes for empty string", () => {
      const result = getScopesForMapping("");
      expect(result).toEqual(SCOPES.NONE);
    });
  });

  describe("SCOPES", () => {
    it("should have BACKGROUND scopes", () => {
      expect(SCOPES.BACKGROUND).toEqual(["FRAME_FILL", "SHAPE_FILL"]);
    });

    it("should have FOREGROUND scopes", () => {
      expect(SCOPES.FOREGROUND).toEqual([
        "SHAPE_FILL",
        "TEXT_FILL",
        "STROKE_COLOR",
        "EFFECT_COLOR",
      ]);
    });

    it("should have NONE scopes as empty array", () => {
      expect(SCOPES.NONE).toEqual([]);
    });
  });

  describe("MODE_NAMES", () => {
    it("should have correct mode names", () => {
      expect(MODE_NAMES.BASE).toBe("Value");
      expect(MODE_NAMES.LIGHT).toBe("Light Mode");
      expect(MODE_NAMES.DARK).toBe("Dark Mode");
      expect(MODE_NAMES.DB_ADAPTIVE).toBe("db-adaptive");
    });
  });

  describe("MESSAGES", () => {
    it("should have success messages", () => {
      expect(MESSAGES.SUCCESS_CREATED).toBe("All collections newly created");
      expect(MESSAGES.SUCCESS_SYNCED).toBe("Variables synchronized");
    });

    it("should have error prefix", () => {
      expect(MESSAGES.ERROR_PREFIX).toBe("Error: ");
    });

    it("should generate warning message for key not found", () => {
      const message = MESSAGES.WARNING_KEY_NOT_FOUND("abc123", "test-variable");
      expect(message).toBe("Key abc123 for test-variable not found.");
    });
  });
});
