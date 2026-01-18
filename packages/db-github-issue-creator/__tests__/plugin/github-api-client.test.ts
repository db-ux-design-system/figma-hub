// Unit Tests for GitHub API Client
// Validates: Requirements 5.1, 5.2, 5.4, 6.1, 6.2, 6.3

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createGitHubIssue } from "../../plugin/utils/github-api";

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe("GitHub API Client - Unit Tests", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful API Response", () => {
    it("should create issue and return URL on successful API response", async () => {
      // Validates: Requirements 5.1, 5.2
      const expectedUrl = "https://github.com/leape/test/issues/42";
      const mockResponse = {
        id: 123456,
        number: 42,
        html_url: expectedUrl,
        title: "Test Issue",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const token = "ghp_test_token";
      const title = "Test Issue";
      const body = "Test body";
      const labels = ["bug"];

      const result = await createGitHubIssue(token, title, body, labels);

      expect(result).toBe(expectedUrl);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should send POST request with correct headers and body", async () => {
      // Validates: Requirements 5.1, 5.2
      const token = "ghp_test_token_12345";
      const title = "Bug Report";
      const body = "## Description\nTest bug";
      const labels = ["bug"];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          number: 1,
          html_url: "https://github.com/leape/test/issues/1",
        }),
      });

      await createGitHubIssue(token, title, body, labels);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/leape/test/issues",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            body,
            labels,
          }),
        }),
      );
    });

    it("should handle feature label correctly", async () => {
      // Validates: Requirements 5.1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          number: 1,
          html_url: "https://github.com/leape/test/issues/1",
        }),
      });

      await createGitHubIssue("token", "Feature Request", "body", ["feature"]);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.labels).toEqual(["feature"]);
    });
  });

  describe("Error Responses - 401 Unauthorized", () => {
    it("should throw specific error for 401 Unauthorized", async () => {
      // Validates: Requirements 5.4, 6.1
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Bad credentials",
      });

      await expect(
        createGitHubIssue("invalid_token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "Ungültiger Token. Bitte überprüfen Sie Ihren GitHub Personal Access Token.",
      );
    });
  });

  describe("Error Responses - 404 Not Found", () => {
    it("should throw specific error for 404 Not Found", async () => {
      // Validates: Requirements 5.4, 6.2
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "Repository nicht gefunden. Bitte überprüfen Sie die Repository-Konfiguration.",
      );
    });
  });

  describe("Error Responses - 422 Unprocessable Entity", () => {
    it("should throw validation error with default message when JSON parsing fails", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => "Validation Failed",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(
        createGitHubIssue("token", "", "body", ["bug"]),
      ).rejects.toThrow("Validierungsfehler");
    });

    it("should throw validation error with API error details", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: "Title is required" }),
      });

      await expect(
        createGitHubIssue("token", "", "body", ["bug"]),
      ).rejects.toThrow("Validierungsfehler: Title is required");
    });

    it("should throw validation error with labels error details", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: "Labels are invalid" }),
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["invalid-label"]),
      ).rejects.toThrow("Validierungsfehler: Labels are invalid");
    });
  });

  describe("Error Responses - 5xx Server Errors", () => {
    it("should throw server error for 500 Internal Server Error", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
      );
    });

    it("should throw server error for 502 Bad Gateway", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bad Gateway",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
      );
    });

    it("should throw server error for 503 Service Unavailable", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service Unavailable",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
      );
    });

    it("should throw server error for 504 Gateway Timeout", async () => {
      // Validates: Requirements 5.4, 6.3
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 504,
        text: async () => "Gateway Timeout",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
      );
    });
  });

  describe("Network Errors", () => {
    it('should throw network error when fetch fails with "Failed to fetch"', async () => {
      // Validates: Requirements 6.3
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.",
      );
    });

    it("should throw network error for connection timeout", async () => {
      // Validates: Requirements 6.3
      mockFetch.mockRejectedValueOnce(new Error("network timeout"));

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.",
      );
    });

    it("should throw network error for fetch-related errors", async () => {
      // Validates: Requirements 6.3
      mockFetch.mockRejectedValueOnce(new Error("fetch error occurred"));

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow(
        "Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.",
      );
    });

    it("should handle generic network errors", async () => {
      // Validates: Requirements 6.3
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow("Netzwerkfehler: Connection refused");
    });

    it("should handle DNS resolution errors", async () => {
      // Validates: Requirements 6.3
      mockFetch.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow("Netzwerkfehler: getaddrinfo ENOTFOUND");
    });

    it("should handle unknown error types", async () => {
      // Validates: Requirements 5.4
      mockFetch.mockRejectedValueOnce("string error");

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow("Ein unbekannter Fehler ist aufgetreten.");
    });
  });

  describe("Other HTTP Error Codes", () => {
    it("should handle 403 Forbidden with generic message", async () => {
      // Validates: Requirements 5.4
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow("GitHub API Fehler: 403 - Forbidden");
    });

    it("should handle 429 Rate Limit Exceeded with generic message", async () => {
      // Validates: Requirements 5.4
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      await expect(
        createGitHubIssue("token", "title", "body", ["bug"]),
      ).rejects.toThrow("GitHub API Fehler: 429 - Rate limit exceeded");
    });
  });
});
