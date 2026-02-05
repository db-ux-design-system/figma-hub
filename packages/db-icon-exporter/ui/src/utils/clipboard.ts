// utils/clipboard.ts

/**
 * Copies text to clipboard using the legacy execCommand method
 * (required for Figma plugin environment)
 */
export function copyToClipboard(text: string, label: string): void {
  // Erstelle ein temporäres Textarea-Element
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    // Selektiere den Text
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    // Kopiere mit dem alten execCommand (funktioniert in Figma)
    const successful = document.execCommand("copy");

    if (successful) {
      console.log(`✅ ${label} in Zwischenablage kopiert`);
      alert(`${label} wurde in die Zwischenablage kopiert!`);
    } else {
      console.error(`❌ Kopieren fehlgeschlagen`);
      alert(`Fehler beim Kopieren. Bitte manuell kopieren.`);
    }
  } catch (err) {
    console.error(`❌ Fehler beim Kopieren von ${label}:`, err);
    alert(`Fehler beim Kopieren: ${err}`);
  } finally {
    // Entferne das temporäre Element
    document.body.removeChild(textarea);
  }
}
