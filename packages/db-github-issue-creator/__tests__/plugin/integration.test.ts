/**
 * Integration Tests for Message Handler
 * Tests the complete workflow: Token → Template → Issue
 * Validates: Requirements 1.2, 1.3, 3.3, 4.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  SaveTokenMessage,
  LoadTokenMessage,
  CreateIssueMessage,
} from "./types";
import {
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_API_BASE,
  TOKEN_STORAGE_KEY,
} from "./config";

// Mock the Figma API
const mockClientStorage = {
  storage: new Map<string, string>(),
  async setAsync(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  },
  async getAsync(key: string): Promise<string | undefined> {
    return this.storage.get(key);
  },
  clear() {
    this.storage.clear();
  },
};

const mockPostMessage = vi.fn();

global.figma = {
  clientStorage: mockClientStorage,
  ui: {
    postMessage: mockPostMessage,
    onmessage: null as any,
  },
  showUI: vi.fn(),
  closePlugin: vi.fn(),
} as any;

// Import the actual message handler to test
import { handleMessage } from "../../plugin/utils/message-handler";

describe("Integration Tests: Message Handler", () => {
  beforeEach(() => {
    mockClientStorage.clear();
    mockPostMessage.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete Token Workflow", () => {
    it("should complete full token workflow: save → load", async () => {
      // Validates: Requirements 1.2, 1.3
      const testToken = "ghp_test123456789";

      // Step 1: UI sends save-token message
      const saveMessage: SaveTokenMessage = {
        type: "save-token",
        token: testToken,
      };
      await handleMessage(saveMessage);

      // Verify token is saved in storage
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(testToken);

      // Step 2: UI sends load-token message
      const loadMessage: LoadTokenMessage = {
        type: "load-token",
      };
      await handleMessage(loadMessage);

      // Verify plugin responds with token-loaded message
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "token-loaded",
        token: testToken,
      });
    });

    it("should handle loading token when none is saved", async () => {
      // Validates: Requirement 1.3
      // UI sends load-token message without saving first
      const loadMessage: LoadTokenMessage = {
        type: "load-token",
      };
      await handleMessage(loadMessage);

      // Verify plugin responds with null token
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "token-loaded",
        token: null,
      });
    });

    it("should persist token across multiple load operations", async () => {
      // Validates: Requirements 1.2, 1.3
      const testToken = "ghp_persistent_token";

      // Save token
      await handleMessage({ type: "save-token", token: testToken });

      // Load token multiple times
      await handleMessage({ type: "load-token" });
      await handleMessage({ type: "load-token" });
      await handleMessage({ type: "load-token" });

      // Verify all loads return the same token
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
      expect(mockPostMessage).toHaveBeenNthCalledWith(1, {
        type: "token-loaded",
        token: testToken,
      });
      expect(mockPostMessage).toHaveBeenNthCalledWith(2, {
        type: "token-loaded",
        token: testToken,
      });
      expect(mockPostMessage).toHaveBeenNthCalledWith(3, {
        type: "token-loaded",
        token: testToken,
      });
    });
  });

  describe("Complete Bug Issue Creation Workflow", () => {
    it("should complete full bug issue workflow: token → bug template → issue creation", async () => {
      // Validates: Requirements 1.2, 3.3, 4.3
      const testToken = "ghp_validtoken123";
      const mockIssueUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/42`;

      // Step 1: Save token
      await handleMessage({ type: "save-token", token: testToken });

      // Step 2: Mock successful GitHub API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 42,
          number: 42,
          html_url: mockIssueUrl,
          title: "Test Bug",
        }),
      });

      // Step 3: UI sends create-issue message with bug template
      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Test Bug Issue",
        description:
          "## Beschreibung\nThis is a bug description\n\n## Reproduktionsschritte\nStep 1\nStep 2\nStep 3\n\n## Erwartetes Verhalten\nShould work correctly",
      };
      await handleMessage(createMessage);

      // Verify GitHub API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          }),
        }),
      );

      // Verify the request body
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      expect(requestBody.title).toBe("Test Bug Issue");
      expect(requestBody.body).toContain("This is a bug description");
      expect(requestBody.labels).toContain("bug");
      expect(requestBody.labels).toContain("👩‍👧‍👦community feedback");

      // Verify plugin responds with issue-created message
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockIssueUrl,
      });
    });

    it("should handle bug issue creation with minimal data", async () => {
      // Validates: Requirements 3.3, 4.3
      const testToken = "ghp_validtoken123";
      const mockIssueUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/43`;

      await handleMessage({ type: "save-token", token: testToken });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 43,
          number: 43,
          html_url: mockIssueUrl,
          title: "Minimal Bug",
        }),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Minimal Bug Issue",
        description: "",
      };
      await handleMessage(createMessage);

      // Verify issue was created
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockIssueUrl,
      });
    });
  });

  describe("Complete Feature Issue Creation Workflow", () => {
    it("should complete full feature issue workflow: token → feature template → issue creation", async () => {
      // Validates: Requirements 1.2, 3.3, 4.3
      const testToken = "ghp_validtoken456";
      const mockIssueUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/100`;

      // Step 1: Save token
      await handleMessage({ type: "save-token", token: testToken });

      // Step 2: Mock successful GitHub API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 100,
          number: 100,
          html_url: mockIssueUrl,
          title: "Test Feature",
        }),
      });

      // Step 3: UI sends create-issue message with feature template
      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "feature",
        title: "Test Feature Request",
        description:
          "## Beschreibung\nThis is a feature description\n\n## Use Case\nUsers need this feature for X\n\n## Erwarteter Nutzen\nWill improve productivity by 50%",
      };
      await handleMessage(createMessage);

      // Verify GitHub API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          }),
        }),
      );

      // Verify the request body
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      expect(requestBody.title).toBe("Test Feature Request");
      expect(requestBody.body).toContain("This is a feature description");
      expect(requestBody.labels).toContain("feature");
      expect(requestBody.labels).toContain("👩‍👧‍👦community feedback");

      // Verify plugin responds with issue-created message
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockIssueUrl,
      });
    });

    it("should handle feature issue creation with minimal data", async () => {
      // Validates: Requirements 3.3, 4.3
      const testToken = "ghp_validtoken456";
      const mockIssueUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/101`;

      await handleMessage({ type: "save-token", token: testToken });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 101,
          number: 101,
          html_url: mockIssueUrl,
          title: "Minimal Feature",
        }),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "feature",
        title: "Minimal Feature Request",
        description: "",
      };
      await handleMessage(createMessage);

      // Verify issue was created
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockIssueUrl,
      });
    });
  });

  describe("Error Scenarios in Complete Workflow", () => {
    it("should handle empty title validation error", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "   ", // Whitespace only
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "Titel darf nicht leer sein",
      });
    });

    it("should handle missing token error", async () => {
      // Validates: Requirement 4.3
      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: "", // Empty token
        template: "bug",
        title: "Test Bug",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "Bitte konfigurieren Sie zuerst Ihren GitHub Token",
      });
    });

    it("should handle 401 authentication error in workflow", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_invalidtoken";
      await handleMessage({ type: "save-token", token: testToken });

      // Mock 401 error from GitHub API
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Test Bug",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message:
          "Ungültiger Token. Bitte überprüfen Sie Ihren GitHub Personal Access Token.",
      });
    });

    it("should handle 404 repository not found error in workflow", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      // Mock 404 error from GitHub API
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "feature",
        title: "Test Feature",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message:
          "Repository nicht gefunden. Bitte überprüfen Sie die Repository-Konfiguration.",
      });
    });

    it("should handle network error in workflow", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Test Bug",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.",
      });
    });

    it("should handle 422 validation error in workflow", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      // Mock 422 error from GitHub API
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: "Invalid field" }),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Test Bug",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "Validierungsfehler: Invalid field",
      });
    });

    it("should handle 500 server error in workflow", async () => {
      // Validates: Requirement 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      // Mock 500 error from GitHub API
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const createMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "feature",
        title: "Test Feature",
        description: "Test",
      };
      await handleMessage(createMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
      });
    });
  });

  describe("Template Switching Workflow", () => {
    it("should handle switching between bug and feature templates", async () => {
      // Validates: Requirements 3.3, 4.3
      const testToken = "ghp_validtoken";
      await handleMessage({ type: "save-token", token: testToken });

      const mockBugUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/1`;
      const mockFeatureUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues/2`;

      // Create bug issue
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 1,
          number: 1,
          html_url: mockBugUrl,
          title: "Bug",
        }),
      });

      const bugMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "bug",
        title: "Bug Issue",
        description: "Bug desc",
      };
      await handleMessage(bugMessage);

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockBugUrl,
      });

      // Clear mock
      mockPostMessage.mockClear();

      // Create feature issue
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 2,
          number: 2,
          html_url: mockFeatureUrl,
          title: "Feature",
        }),
      });

      const featureMessage: CreateIssueMessage = {
        type: "create-issue",
        token: testToken,
        template: "feature",
        title: "Feature Request",
        description: "Feature desc",
      };
      await handleMessage(featureMessage);

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "issue-created",
        issueUrl: mockFeatureUrl,
      });
    });
  });

  describe("Message Type Validation", () => {
    it("should handle unknown message type", async () => {
      // Validates: Requirement 4.3
      const unknownMessage = {
        type: "unknown-type",
      } as any;
      await handleMessage(unknownMessage);

      // Verify error message is sent to UI
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "error",
        message: "Unbekannter Nachrichtentyp",
      });
    });
  });
});
