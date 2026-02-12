/**
 * Clipboard utility for copying text to clipboard.
 * Uses modern Clipboard API with fallback to execCommand for Figma plugin environment.
 */

/**
 * Copies text to clipboard using modern API with fallback.
 *
 * @param text - The text to copy to clipboard
 * @param label - A label for logging and user feedback
 * @returns Promise<boolean> - True if copy was successful
 *
 * @example
 * ```typescript
 * const success = await copyToClipboard(jsonData, "GitLab JSON");
 * if (success) {
 * }
 * ```
 */
export async function copyToClipboard(
  text: string,
  label: string,
): Promise<boolean> {
  try {
    // Try modern Clipboard API first (if available and in secure context)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback to execCommand for Figma plugin environment
    return copyWithExecCommand(text, label);
  } catch (err) {
    console.error(`❌ Modern API failed for ${label}:`, err);
    // Try fallback on error
    return copyWithExecCommand(text, label);
  }
}

/**
 * Fallback copy method using deprecated execCommand.
 * Used when modern Clipboard API is not available (e.g., in Figma plugins).
 *
 * @param text - The text to copy
 * @param label - A label for logging
 * @returns boolean - True if copy was successful
 */
function copyWithExecCommand(text: string, label: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);

  try {
    // Select the text
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    // Copy with the old execCommand (works in Figma)
    const successful = document.execCommand("copy");

    if (successful) {
      return true;
    } else {
      console.error(`❌ Copy failed for ${label}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error copying ${label}:`, err);
    return false;
  } finally {
    // Remove the temporary element
    document.body.removeChild(textarea);
  }
}

/**
 * Copies text to clipboard and shows user feedback via alert.
 * This is a convenience wrapper around copyToClipboard for UI components.
 *
 * @param text - The text to copy
 * @param label - A label for user feedback
 *
 * @example
 * ```typescript
 * copyToClipboardWithFeedback(jsonData, "GitLab JSON");
 * // Shows alert: "GitLab JSON has been copied to clipboard!"
 * ```
 */
export async function copyToClipboardWithFeedback(
  text: string,
  label: string,
): Promise<void> {
  const success = await copyToClipboard(text, label);

  if (success) {
    alert(`${label} has been copied to clipboard!`);
  } else {
    alert(`Error copying ${label}. Please copy manually.`);
  }
}
