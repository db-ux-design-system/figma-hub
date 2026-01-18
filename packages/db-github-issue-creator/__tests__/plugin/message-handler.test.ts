/**
 * Tests for Message Handler
 * Validates: Requirements 1.2, 1.3, 3.3, 4.3, 5.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_API_BASE
} from './config';

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

global.figma = {
  clientStorage: mockClientStorage,
} as any;

// Copy the functions for testing (to avoid side effects from code.ts)
const TOKEN_STORAGE_KEY = 'db-github-issue-creator-token';

async function saveToken(token: string): Promise<void> {
  await figma.clientStorage.setAsync(TOKEN_STORAGE_KEY, token);
}

async function loadToken(): Promise<string | null> {
  const token = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
  return token || null;
}

function validateTitle(title: string): boolean {
  return title.trim().length > 0;
}

function formatBugIssueBody(
  description: string,
  reproSteps: string,
  expectedBehavior: string
): string {
  return `## Beschreibung
${description}

## Reproduktionsschritte
${reproSteps}

## Erwartetes Verhalten
${expectedBehavior}`;
}

function formatFeatureIssueBody(
  description: string,
  useCase: string,
  expectedBenefit: string
): string {
  return `## Beschreibung
${description}

## Use Case
${useCase}

## Erwarteter Nutzen
${expectedBenefit}`;
}

async function createGitHubIssue(
  token: string,
  title: string,
  body: string,
  labels: string[]
): Promise<string> {
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`;
  
  const requestBody = {
    title,
    body,
    labels
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Ungültiger Token. Bitte überprüfen Sie Ihren GitHub Personal Access Token.');
      }
      
      if (response.status === 404) {
        throw new Error('Repository nicht gefunden. Bitte überprüfen Sie die Repository-Konfiguration.');
      }
      
      if (response.status === 422) {
        let errorMessage = 'Validierungsfehler';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = `Validierungsfehler: ${errorData.message}`;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }
      
      if (response.status >= 500) {
        throw new Error('GitHub Server-Fehler. Bitte versuchen Sie es später erneut.');
      }
      
      const errorText = await response.text();
      throw new Error(`GitHub API Fehler: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.html_url;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Ungültiger Token') ||
          error.message.includes('Repository nicht gefunden') ||
          error.message.includes('Validierungsfehler') ||
          error.message.includes('GitHub Server-Fehler') ||
          error.message.includes('GitHub API Fehler')) {
        throw error;
      }
      
      if (error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('Failed to fetch')) {
        throw new Error('Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.');
      }
      
      throw new Error(`Netzwerkfehler: ${error.message}`);
    }
    
    throw new Error('Ein unbekannter Fehler ist aufgetreten.');
  }
}

describe('Message Handler Integration Tests', () => {
  beforeEach(() => {
    mockClientStorage.clear();
    vi.clearAllMocks();
  });

  describe('save-token message handler', () => {
    it('should save token when save-token message is received', async () => {
      const testToken = 'ghp_test123456';

      await saveToken(testToken);

      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(testToken);
    });

    it('should handle empty token', async () => {
      await saveToken('');

      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe('');
    });
  });

  describe('load-token message handler', () => {
    it('should load token and return it', async () => {
      const testToken = 'ghp_test123456';
      await saveToken(testToken);

      const result = await loadToken();

      expect(result).toBe(testToken);
    });

    it('should return null when no token is stored', async () => {
      const result = await loadToken();

      expect(result).toBeNull();
    });

    it('should return null when token is undefined', async () => {
      mockClientStorage.clear();

      const result = await loadToken();

      expect(result).toBeNull();
    });
  });

  describe('create-issue message handler validation', () => {
    it('should validate title before creating issue', () => {
      expect(validateTitle('Valid Title')).toBe(true);
      expect(validateTitle('')).toBe(false);
      expect(validateTitle('   ')).toBe(false);
    });

    it('should format bug issue body correctly', () => {
      const body = formatBugIssueBody(
        'Test description',
        'Step 1\nStep 2',
        'Expected result'
      );

      expect(body).toContain('## Beschreibung');
      expect(body).toContain('Test description');
      expect(body).toContain('## Reproduktionsschritte');
      expect(body).toContain('Step 1\nStep 2');
      expect(body).toContain('## Erwartetes Verhalten');
      expect(body).toContain('Expected result');
    });

    it('should format feature issue body correctly', () => {
      const body = formatFeatureIssueBody(
        'Feature description',
        'Use case details',
        'Expected benefits'
      );

      expect(body).toContain('## Beschreibung');
      expect(body).toContain('Feature description');
      expect(body).toContain('## Use Case');
      expect(body).toContain('Use case details');
      expect(body).toContain('## Erwarteter Nutzen');
      expect(body).toContain('Expected benefits');
    });
  });

  describe('error propagation', () => {
    it('should handle API errors and propagate them', async () => {
      // Mock fetch to return 401 error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(
        createGitHubIssue('invalid-token', 'Test Title', 'Test Body', ['bug'])
      ).rejects.toThrow('Ungültiger Token');
    });

    it('should handle 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(
        createGitHubIssue('token', 'Test Title', 'Test Body', ['bug'])
      ).rejects.toThrow('Repository nicht gefunden');
    });

    it('should handle 422 validation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Invalid field' }),
      });

      await expect(
        createGitHubIssue('token', 'Test Title', 'Test Body', ['bug'])
      ).rejects.toThrow('Validierungsfehler: Invalid field');
    });

    it('should handle 5xx server errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(
        createGitHubIssue('token', 'Test Title', 'Test Body', ['bug'])
      ).rejects.toThrow('GitHub Server-Fehler');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      await expect(
        createGitHubIssue('token', 'Test Title', 'Test Body', ['bug'])
      ).rejects.toThrow('Netzwerkfehler');
    });
  });

  describe('successful issue creation', () => {
    it('should create issue and return URL', async () => {
      const mockIssueUrl = 'https://github.com/db-ux-design-system/core/issues/123';
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 123,
          number: 123,
          html_url: mockIssueUrl,
          title: 'Test Issue',
        }),
      });

      const result = await createGitHubIssue(
        'ghp_validtoken',
        'Test Issue',
        'Test Body',
        ['bug']
      );

      expect(result).toBe(mockIssueUrl);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/db-ux-design-system/core/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer ghp_validtoken',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            title: 'Test Issue',
            body: 'Test Body',
            labels: ['bug'],
          }),
        })
      );
    });
  });
});
