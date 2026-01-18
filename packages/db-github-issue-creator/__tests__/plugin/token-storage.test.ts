import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveToken, loadToken } from './utils/storage';
import { TOKEN_STORAGE_KEY } from './config';

// Mock Figma API
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

describe('Token Storage Functions', () => {
  beforeEach(() => {
    // Clear storage before each test
    mockClientStorage.clear();
  });

  describe('saveToken', () => {
    it('should save a valid token to client storage', async () => {
      const testToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
      await saveToken(testToken);
      
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(testToken);
    });

    it('should save an empty token', async () => {
      const emptyToken = '';
      await saveToken(emptyToken);
      
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(emptyToken);
    });

    it('should save a very long token', async () => {
      const longToken = 'ghp_' + 'a'.repeat(1000);
      await saveToken(longToken);
      
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(longToken);
    });

    it('should save a token with special characters', async () => {
      const specialToken = 'ghp_!@#$%^&*()_+-=[]{}|;:,.<>?';
      await saveToken(specialToken);
      
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(specialToken);
    });

    it('should overwrite existing token', async () => {
      const firstToken = 'ghp_first_token';
      const secondToken = 'ghp_second_token';
      
      await saveToken(firstToken);
      await saveToken(secondToken);
      
      const stored = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
      expect(stored).toBe(secondToken);
    });
  });

  describe('loadToken', () => {
    it('should load a previously saved token', async () => {
      const testToken = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
      await saveToken(testToken);
      
      const loaded = await loadToken();
      expect(loaded).toBe(testToken);
    });

    it('should return null when no token is stored', async () => {
      const loaded = await loadToken();
      expect(loaded).toBeNull();
    });

    it('should return null when storage is empty', async () => {
      // Explicitly clear storage
      mockClientStorage.clear();
      
      const loaded = await loadToken();
      expect(loaded).toBeNull();
    });

    it('should load an empty string token as null', async () => {
      await saveToken('');
      
      const loaded = await loadToken();
      // Empty string should be treated as null
      expect(loaded).toBeNull();
    });
  });

  describe('Token Storage Round-Trip', () => {
    it('should preserve token value through save and load cycle', async () => {
      const testToken = 'ghp_test_round_trip_token';
      
      await saveToken(testToken);
      const loaded = await loadToken();
      
      expect(loaded).toBe(testToken);
    });

    it('should preserve token with special characters through round-trip', async () => {
      const specialToken = 'ghp_!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      
      await saveToken(specialToken);
      const loaded = await loadToken();
      
      expect(loaded).toBe(specialToken);
    });

    it('should preserve very long token through round-trip', async () => {
      const longToken = 'ghp_' + 'x'.repeat(500);
      
      await saveToken(longToken);
      const loaded = await loadToken();
      
      expect(loaded).toBe(longToken);
    });

    it('should handle multiple save-load cycles', async () => {
      const tokens = [
        'ghp_token_1',
        'ghp_token_2',
        'ghp_token_3',
      ];
      
      for (const token of tokens) {
        await saveToken(token);
        const loaded = await loadToken();
        expect(loaded).toBe(token);
      }
    });
  });
});
