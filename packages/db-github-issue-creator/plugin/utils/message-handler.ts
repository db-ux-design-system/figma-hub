// Message handler for plugin-UI communication
// Validates: Requirements 1.2, 1.3, 3.3, 4.3, 5.4

import { saveToken, loadToken } from "./storage";
import { validateTitle } from "./validation";
import { createGitHubIssue } from "./github-api";

/**
 * Handles messages from the UI
 * @param msg - The message object from the UI
 */
export async function handleMessage(msg: any): Promise<void> {
  console.log("Received message:", msg);

  try {
    switch (msg.type) {
      case "save-token": {
        // Handler for 'save-token' message
        // Validates: Requirements 1.2
        const { token } = msg;
        await saveToken(token);
        // Send success response (no explicit response needed, token is saved)
        break;
      }

      case "load-token": {
        // Handler for 'load-token' message
        // Validates: Requirements 1.3
        const token = await loadToken();
        figma.ui.postMessage({
          type: "token-loaded",
          token,
        });
        break;
      }

      case "create-issue": {
        // Handler for 'create-issue' message
        // Validates: Requirements 3.3, 4.3, 5.4
        const { token, template, title, description } = msg;

        // Validate title
        if (!validateTitle(title)) {
          figma.ui.postMessage({
            type: "error",
            message: "Titel darf nicht leer sein",
          });
          return;
        }

        // Check if token is provided
        if (!token || token.trim().length === 0) {
          figma.ui.postMessage({
            type: "error",
            message: "Bitte konfigurieren Sie zuerst Ihren GitHub Token",
          });
          return;
        }

        // Use the description directly (it's already formatted from the UI)
        let body: string = description || "";
        let labels: string[];

        if (template === "bug") {
          labels = ["bug", "👩‍👧‍👦community feedback"];
        } else if (template === "feature") {
          labels = ["feature", "👩‍👧‍👦community feedback"];
        } else {
          figma.ui.postMessage({
            type: "error",
            message: "Bitte wählen Sie ein Template aus",
          });
          return;
        }

        // Create the GitHub issue
        try {
          const issueUrl = await createGitHubIssue(token, title, body, labels);
          figma.ui.postMessage({
            type: "issue-created",
            issueUrl,
          });
        } catch (error) {
          // Propagate errors to UI
          // Validates: Requirement 5.4
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ein unbekannter Fehler ist aufgetreten.";
          figma.ui.postMessage({
            type: "error",
            message: errorMessage,
          });
        }
        break;
      }

      case "close-plugin": {
        // Handler for 'close-plugin' message
        figma.closePlugin();
        break;
      }

      default:
        console.warn("Unknown message type:", msg.type);
        figma.ui.postMessage({
          type: "error",
          message: "Unbekannter Nachrichtentyp",
        });
    }
  } catch (error) {
    // Catch any unexpected errors and send to UI
    // Validates: Requirement 5.4
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Ein unbekannter Fehler ist aufgetreten.";
    figma.ui.postMessage({
      type: "error",
      message: errorMessage,
    });
  }
}
