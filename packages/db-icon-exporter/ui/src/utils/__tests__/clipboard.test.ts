import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard, copyToClipboardWithFeedback } from "../clipboard";

describe("clipboard utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("copyToClipboard", () => {
    it("should use execCommand fallback when clipboard API not available", async () => {
      // In jsdom, window.isSecureContext is false, so it will use fallback
      const execCommandMock = vi.fn(() => true);
      document.execCommand = execCommandMock;

      const result = await copyToClipboard("test content", "Test");

      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith("copy");
    });

    it("should return false when copy fails", async () => {
      const execCommandMock = vi.fn(() => false);
      document.execCommand = execCommandMock;

      const result = await copyToClipboard("test content", "Test");

      expect(result).toBe(false);
    });
  });

  describe("copyToClipboardWithFeedback", () => {
    it("should show success alert on successful copy", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const execCommandMock = vi.fn(() => true);
      document.execCommand = execCommandMock;

      await copyToClipboardWithFeedback("test content", "Test");

      expect(alertMock).toHaveBeenCalledWith(
        "Test has been copied to clipboard!",
      );
      alertMock.mockRestore();
    });

    it("should show error alert on failed copy", async () => {
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
      const execCommandMock = vi.fn(() => false);
      document.execCommand = execCommandMock;

      await copyToClipboardWithFeedback("test content", "Test");

      expect(alertMock).toHaveBeenCalledWith(
        "Error copying Test. Please copy manually.",
      );
      alertMock.mockRestore();
    });
  });
});
