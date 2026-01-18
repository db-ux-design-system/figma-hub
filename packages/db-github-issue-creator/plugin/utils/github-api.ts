// GitHub API utilities
// Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4

import {
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
  GITHUB_API_BASE,
} from "../config";

/**
 * Creates a GitHub issue via the GitHub REST API
 * @param token - GitHub Personal Access Token for authentication
 * @param title - The issue title
 * @param body - The formatted issue body (markdown)
 * @param labels - Array of label strings to apply to the issue
 * @returns Promise that resolves with the issue URL
 * @throws Error with specific error messages based on the failure type
 */
export async function createGitHubIssue(
  token: string,
  title: string,
  body: string,
  labels: string[],
): Promise<string> {
  const finalBody = body;

  const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`;

  const requestBody = {
    title,
    body: finalBody,
    labels,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Handle different HTTP error status codes
      // Validates: Requirements 6.1, 6.2, 6.3, 6.4

      if (response.status === 401) {
        // Requirement 6.1: 401 Unauthorized - Invalid token
        throw new Error(
          "Ungültiger Token. Bitte überprüfen Sie Ihren GitHub Personal Access Token.",
        );
      }

      if (response.status === 404) {
        // Requirement 6.2: 404 Not Found - Repository not found
        throw new Error(
          "Repository nicht gefunden. Bitte überprüfen Sie die Repository-Konfiguration.",
        );
      }

      if (response.status === 422) {
        // Requirement 6.3: 422 Unprocessable Entity - Validation error
        let errorMessage = "Validierungsfehler";
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
        // Requirement 6.4: 5xx Server Error
        throw new Error(
          "GitHub Server-Fehler. Bitte versuchen Sie es später erneut.",
        );
      }

      // For any other HTTP error codes
      const errorText = await response.text();
      throw new Error(`GitHub API Fehler: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.html_url;
  } catch (error) {
    // Handle network errors (connection failures, timeouts, etc.)
    // Validates: Requirement 6.3 (Netzwerkfehler behandeln)

    if (error instanceof Error) {
      // If it's already an Error we threw, re-throw it
      if (
        error.message.includes("Ungültiger Token") ||
        error.message.includes("Repository nicht gefunden") ||
        error.message.includes("Validierungsfehler") ||
        error.message.includes("GitHub Server-Fehler") ||
        error.message.includes("GitHub API Fehler")
      ) {
        throw error;
      }

      // Network errors (fetch failures, connection issues, etc.)
      if (
        error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Netzwerkfehler: Verbindung zum GitHub Server fehlgeschlagen.",
        );
      }

      // Any other error
      throw new Error(`Netzwerkfehler: ${error.message}`);
    }

    // Unknown error type
    throw new Error("Ein unbekannter Fehler ist aufgetreten.");
  }
}
