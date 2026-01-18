// Token storage utilities
// Validates: Requirements 1.2, 1.3, 1.4

import { TOKEN_STORAGE_KEY } from '../config';

/**
 * Saves the GitHub Personal Access Token to Figma client storage
 * @param token - The GitHub Personal Access Token to save
 * @returns Promise that resolves when the token is saved
 */
export async function saveToken(token: string): Promise<void> {
  await figma.clientStorage.setAsync(TOKEN_STORAGE_KEY, token);
}

/**
 * Loads the GitHub Personal Access Token from Figma client storage
 * @returns Promise that resolves with the token or null if not found
 */
export async function loadToken(): Promise<string | null> {
  const token = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY);
  return token || null;
}
