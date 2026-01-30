import React, { useState, useEffect } from "react";
import {
  DBButton,
  DBInput,
  DBStack,
  DBInfotext,
  DBCheckbox,
} from "@db-ux/react-core-components";

function App() {
  const [jsonInput, setJsonInput] = useState("");
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [inputKey, setInputKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrefixDialog, setShowPrefixDialog] = useState(false);
  const [detectedPrefix, setDetectedPrefix] = useState("");
  const [prefixInput, setPrefixInput] = useState("");
  const [showPrefixWarning, setShowPrefixWarning] = useState(false);
  const [existingPrefix, setExistingPrefix] = useState("");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { pluginMessage } = event.data;
      if (pluginMessage?.feedback) {
        setFeedback(pluginMessage.feedback);
        setIsLoading(false);
        setDeleteMissing(false);
        setJsonInput("");
        setInputKey((k) => k + 1);
      }
      if (pluginMessage?.existingPrefix) {
        setExistingPrefix(pluginMessage.existingPrefix);
        setShowPrefixWarning(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const [fileName, setFileName] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFeedback("");

    if (!selectedFile) {
      setJsonInput("");
      setFileName("");
      return;
    }

    setFileName(selectedFile.name);

    const reader = new FileReader();
    reader.onload = (e) => setJsonInput(e.target?.result as string);
    reader.onerror = () => setFeedback("Error reading file.");
    reader.readAsText(selectedFile);
  };

  const extractPrefixFromJson = (data: any): string | null => {
    // Extract prefix from color family names
    // Example: "dibe-br-color-01" -> "dibe"
    const colors = data?.colors || {};
    const colorFamilies = Object.keys(colors);

    if (colorFamilies.length === 0) return null;

    // Extract prefixes from all color family names
    // Expected format: "prefix-something-color-number" or "prefix-color-number"
    const prefixes = colorFamilies
      .map((familyName) => {
        // Extract the first part before the first dash
        const match = familyName.match(/^([a-zA-Z0-9]+)(?:-|$)/);
        return match ? match[1].toLowerCase() : null;
      })
      .filter((p) => p !== null);

    if (prefixes.length === 0) return null;

    // Check if all prefixes are the same
    const firstPrefix = prefixes[0];
    const allSame = prefixes.every((p) => p === firstPrefix);

    return allSame ? firstPrefix : null;
  };

  const extractPrefixFromFilename = (filename: string): string => {
    if (!filename) return "";

    // Remove .json extension
    const nameWithoutExt = filename.replace(/\.json$/i, "");

    // Known prefixes at the start that should be ignored
    const knownPrefixes = ["DB", "Whitelabel", "S-Bahn", "sab", "SAB"];

    // Try to match pattern: [KnownPrefix][-\s][Something]Theme-figma
    // or: [KnownPrefix][-\s]Theme-figma
    const regexWithMiddle = new RegExp(
      `^(${knownPrefixes.join("|")})[-\\s]+(.+?)Theme-figma`,
      "i",
    );
    const regexDirect = new RegExp(
      `^(${knownPrefixes.join("|")})[-\\s]+Theme-figma`,
      "i",
    );

    const matchWithMiddle = nameWithoutExt.match(regexWithMiddle);
    const matchDirect = nameWithoutExt.match(regexDirect);

    let prefixOriginal = "";
    if (matchWithMiddle && matchWithMiddle[2]) {
      prefixOriginal = matchWithMiddle[2].trim();
    } else if (matchDirect && matchDirect[1]) {
      // Direct match with known prefix - ignore it
      prefixOriginal = "";
    }

    // Remove special characters and convert to lowercase
    const prefix = prefixOriginal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return prefix;
  };

  const handleImport = () => {
    if (!jsonInput) {
      setFeedback(
        "Please select the exported JSON file to import (utils folder, *-figma-custom-colors.json).",
      );
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);

      // Extract prefix from JSON variables (color family names)
      const jsonPrefix = extractPrefixFromJson(parsed);

      // Extract prefix from filename
      const filenamePrefix = extractPrefixFromFilename(fileName);

      // Determine which prefix to use
      let finalPrefix = "custom";

      if (jsonPrefix) {
        // JSON has a prefix - use it (color families already have it)
        finalPrefix = jsonPrefix;
      } else if (filenamePrefix) {
        // No JSON prefix, but filename has one - use it
        finalPrefix = filenamePrefix;
      }

      // Show prefix confirmation dialog
      setDetectedPrefix(finalPrefix);
      setPrefixInput(finalPrefix);
      setShowPrefixDialog(true);
      setFeedback("");

      // Check for existing collections with different prefix
      parent.postMessage(
        {
          pluginMessage: {
            type: "check-existing-prefix",
            proposedPrefix: finalPrefix,
          },
        },
        "*",
      );
    } catch (e) {
      setFeedback("The selected file does not appear to be a valid JSON.");
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setIsLoading(true);
      setShowPrefixDialog(false);
      setShowPrefixWarning(false);
      setFeedback("");

      parent.postMessage(
        {
          pluginMessage: {
            type: "import-json",
            data: parsed,
            deleteMissing,
            fileName,
            customPrefix: prefixInput.trim() || "custom",
          },
        },
        "*",
      );
    } catch (e) {
      setFeedback("The selected file does not appear to be a valid JSON.");
      setIsLoading(false);
      setShowPrefixDialog(false);
      setShowPrefixWarning(false);
    }
  };

  const handleCancelImport = () => {
    setShowPrefixDialog(false);
    setShowPrefixWarning(false);
    setPrefixInput("");
    setDetectedPrefix("");
    setExistingPrefix("");
  };

  const handleProceedWithWarning = () => {
    setShowPrefixWarning(false);
    // Continue with the import
    handleConfirmImport();
  };

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* Header area */}
      <header>
        <h1 className="text-2xl">DB Custom Color Importer</h1>
        {!showPrefixDialog && (
          <p className="text-sm">
            Select the JSON file with custom colors that you created and
            exported in the{" "}
            <a
              href="https://design-system.deutschebahn.com/theme-builder/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              DB UX Theme Builder
            </a>{" "}
            (utils folder, *-figma-custom-colors.json).
          </p>
        )}
      </header>

      {!showPrefixDialog ? (
        <>
          <DBStack gap="medium">
            <DBInput
              key={inputKey}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              label="select file"
              showLabel={false}
            />

            <DBCheckbox
              checked={deleteMissing}
              onChange={(e) => setDeleteMissing(e.target.checked)}
              size="small"
            >
              Delete existing color variables
            </DBCheckbox>
            <DBButton
              icon="upload"
              variant="brand"
              onClick={handleImport}
              disabled={isLoading}
            >
              Import variables
            </DBButton>
          </DBStack>
          {/* Feedback / Status */}
          {feedback && (
            <DBInfotext
              semantic={
                feedback.includes("Success") ? "successful" : "critical"
              }
            >
              {feedback}
            </DBInfotext>
          )}
        </>
      ) : showPrefixWarning ? (
        <DBStack gap="medium">
          <DBInfotext semantic="warning">
            Collections with prefix "{existingPrefix}" already exist in this
            file. Your new colors with prefix "{prefixInput}" will be added to
            the existing collections. This means both color families will be
            available in the same collections.
          </DBInfotext>

          <div className="flex gap-fix-sm">
            <DBButton variant="brand" onClick={handleProceedWithWarning}>
              Proceed with Import
            </DBButton>
            <DBButton variant="secondary" onClick={handleCancelImport}>
              Cancel
            </DBButton>
          </div>
        </DBStack>
      ) : (
        <DBStack gap="medium">
          <DBInfotext semantic="informational">
            The following prefix was detected for your collections, variables,
            and modes. Please confirm or adjust it before importing.
          </DBInfotext>

          <DBInput
            label="Prefix"
            value={prefixInput}
            onChange={(e) => setPrefixInput(e.target.value)}
            placeholder="Enter prefix"
          />

          <div className="flex gap-fix-sm">
            <DBButton
              variant="brand"
              onClick={handleConfirmImport}
              disabled={!prefixInput.trim()}
            >
              Confirm and Import
            </DBButton>
            <DBButton variant="secondary" onClick={handleCancelImport}>
              Cancel
            </DBButton>
          </div>
        </DBStack>
      )}
    </div>
  );
}

export default App;
