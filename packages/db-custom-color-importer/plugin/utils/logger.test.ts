import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, LogLevel, log } from "./logger";

describe("logger", () => {
  // Mock console methods
  const originalConsole = {
    log: console.log,
    debug: console.debug,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    console.log = vi.fn();
    console.debug = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    logger.setLevel(LogLevel.DEBUG); // Enable all logs for testing
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.debug = originalConsole.debug;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe("log levels", () => {
    it("should log debug messages when level is DEBUG", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug("test message");
      expect(console.debug).toHaveBeenCalled();
    });

    it("should not log debug messages when level is INFO", () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug("test message");
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should log info messages when level is INFO", () => {
      logger.setLevel(LogLevel.INFO);
      logger.info("test message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should not log info messages when level is WARN", () => {
      logger.setLevel(LogLevel.WARN);
      logger.info("test message");
      expect(console.log).not.toHaveBeenCalled();
    });

    it("should log warn messages when level is WARN", () => {
      logger.setLevel(LogLevel.WARN);
      logger.warn("test message");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should log error messages at any level", () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error("test message");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("message formatting", () => {
    it("should include context in log message", () => {
      logger.info("test message", "testContext");
      const call = (console.log as any).mock.calls[0][0];
      expect(call).toContain("[testContext]");
      expect(call).toContain("test message");
    });

    it("should include log level in message", () => {
      logger.info("test message");
      const call = (console.log as any).mock.calls[0][0];
      expect(call).toContain("[INFO]");
    });

    it("should include timestamp in message", () => {
      logger.info("test message");
      const call = (console.log as any).mock.calls[0][0];
      // Check for time format HH:MM:SS
      expect(call).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("error logging", () => {
    it("should log error message with Error object", () => {
      const error = new Error("test error");
      logger.error("Something failed", error);
      const call = (console.error as any).mock.calls[0][0];
      expect(call).toContain("Something failed");
      expect(call).toContain("test error");
    });

    it("should log stack trace for Error objects", () => {
      const error = new Error("test error");
      logger.error("Something failed", error);
      expect(console.error).toHaveBeenCalledTimes(2); // Message + stack trace
    });

    it("should handle non-Error objects", () => {
      logger.error("Something failed", "string error");
      const call = (console.error as any).mock.calls[0][0];
      expect(call).toContain("Something failed");
      expect(call).toContain("string error");
    });
  });

  describe("convenience methods", () => {
    it("should log section headers", () => {
      logger.section("Test Section");
      expect(console.log).toHaveBeenCalled();
      const calls = (console.log as any).mock.calls;
      expect(calls.some((call: any) => call[0].includes("Test Section"))).toBe(
        true,
      );
    });

    it("should log subsection headers", () => {
      logger.subsection("Test Subsection");
      expect(console.log).toHaveBeenCalled();
      const calls = (console.log as any).mock.calls;
      expect(
        calls.some((call: any) => call[0].includes("Test Subsection")),
      ).toBe(true);
    });

    it("should log success messages", () => {
      logger.success("Operation completed");
      const call = (console.log as any).mock.calls[0][0];
      expect(call).toContain("✓ SUCCESS");
      expect(call).toContain("Operation completed");
    });

    it("should log step messages", () => {
      logger.step(2, 5, "Processing item");
      const call = (console.log as any).mock.calls[0][0];
      expect(call).toContain("[2/5]");
      expect(call).toContain("Processing item");
    });
  });

  describe("convenience log object", () => {
    it("should provide debug method", () => {
      log.debug("test");
      expect(console.debug).toHaveBeenCalled();
    });

    it("should provide info method", () => {
      log.info("test");
      expect(console.log).toHaveBeenCalled();
    });

    it("should provide warn method", () => {
      log.warn("test");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should provide error method", () => {
      log.error("test");
      expect(console.error).toHaveBeenCalled();
    });

    it("should provide section method", () => {
      log.section("test");
      expect(console.log).toHaveBeenCalled();
    });

    it("should provide subsection method", () => {
      log.subsection("test");
      expect(console.log).toHaveBeenCalled();
    });

    it("should provide success method", () => {
      log.success("test");
      expect(console.log).toHaveBeenCalled();
    });

    it("should provide step method", () => {
      log.step(1, 3, "test");
      expect(console.log).toHaveBeenCalled();
    });
  });
});
