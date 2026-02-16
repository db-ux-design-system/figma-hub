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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrefixDialog, setShowPrefixDialog] = useState(false);
  const [prefixInput, setPrefixInput] = useState("");
  const [showPrefixWarning, setShowPrefixWarning] = useState(false);
  const [existingPrefix, setExistingPrefix] = useState("");
  const [detectedPrefixes, setDetectedPrefixes] = useState<
    Array<{ value: string; source: string }>
  >([]);
  const [showPrefixButtons, setShowPrefixButtons] = useState(true);
  const [showThemeBuilderInfo, setShowThemeBuilderInfo] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { pluginMessage } = event.data;
      if (pluginMessage?.feedback) {
        setFeedback(pluginMessage.feedback);
        setIsLoading(false);
        setIsProcessing(false);
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

    // Known prefixes at the start that should be ignored (only DB in this case)
    const knownPrefixes = ["DB", "Whitelabel", "S-Bahn", "sab", "SAB"];

    // Try to match pattern: [KnownPrefix][-\s][Something]Theme-figma
    // Example: "DB-RITheme-figma" -> extract "RI"
    const regexWithMiddle = new RegExp(
      `^(${knownPrefixes.join("|")})[-\\s]+(.+?)Theme-figma`,
      "i",
    );

    // Try to match pattern: [Something]Theme-figma (without known prefix)
    // Example: "RITheme-figma" -> extract "RI"
    const regexDirect = /^(.+?)Theme-figma/i;

    const matchWithMiddle = nameWithoutExt.match(regexWithMiddle);

    let prefixOriginal = "";
    if (matchWithMiddle && matchWithMiddle[2]) {
      // Found pattern with known prefix in front
      prefixOriginal = matchWithMiddle[2].trim();
    } else {
      // Try direct pattern without known prefix
      const matchDirect = nameWithoutExt.match(regexDirect);
      if (matchDirect && matchDirect[1]) {
        prefixOriginal = matchDirect[1].trim();
      }
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

      // Extract prefix from filename (theme prefix)
      const filenamePrefix = extractPrefixFromFilename(fileName);

      // DEBUG: Log the detected prefixes
      console.log("DEBUG - Filename:", fileName);
      console.log("DEBUG - Filename prefix:", filenamePrefix);
      console.log("DEBUG - JSON prefix:", jsonPrefix);

      // Determine theme prefix and whether to show dialog
      let themePrefix = "";
      let showThemeBuilderHint = false;

      if (filenamePrefix && jsonPrefix) {
        // Both prefixes found - proceed directly without dialog
        themePrefix = filenamePrefix;

        console.log("DEBUG - Both prefixes found, proceeding with auto-import");

        // Proceed directly with import
        setIsProcessing(true);
        setFeedback("");

        parent.postMessage(
          {
            pluginMessage: {
              type: "import-json",
              data: parsed,
              deleteMissing,
              fileName,
              themePrefix: filenamePrefix,
              variablePrefix: jsonPrefix,
            },
          },
          "*",
        );
        return;
      } else if (filenamePrefix) {
        // Only theme prefix found - use it for both (Fall 2)
        themePrefix = filenamePrefix;
        showThemeBuilderHint = true; // Show hint about variable prefix
      } else if (jsonPrefix) {
        // Only variable prefix found - ask user to confirm as theme prefix (Fall 3)
        themePrefix = jsonPrefix;
        showThemeBuilderHint = false;
      } else {
        // No prefix found - user must enter manually (Fall 4)
        themePrefix = "custom";
        showThemeBuilderHint = true; // Show hint about theme setup
      }

      // Store detected prefixes for display
      const prefixes: Array<{ value: string; source: string }> = [];
      if (filenamePrefix) {
        prefixes.push({
          value: filenamePrefix,
          source: "from filename (Theme)",
        });
      }
      if (jsonPrefix && jsonPrefix !== filenamePrefix) {
        prefixes.push({ value: jsonPrefix, source: "from color variables" });
      }
      setDetectedPrefixes(prefixes);
      setShowThemeBuilderInfo(showThemeBuilderHint);

      // Show prefix confirmation dialog
      setPrefixInput(themePrefix);
      setShowPrefixDialog(true);
      setShowPrefixButtons(prefixes.length > 0);
      setFeedback("");

      // Check for existing collections with different prefix
      parent.postMessage(
        {
          pluginMessage: {
            type: "check-existing-prefix",
            proposedPrefix: themePrefix,
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
      setIsProcessing(true);
      setShowPrefixDialog(false);
      setShowPrefixWarning(false);
      setFeedback("");

      // Always use the prefix from the input field
      const finalPrefix = prefixInput.trim() || "custom";

      parent.postMessage(
        {
          pluginMessage: {
            type: "import-json",
            data: parsed,
            deleteMissing,
            fileName,
            customPrefix: finalPrefix,
          },
        },
        "*",
      );
    } catch (e) {
      setFeedback("The selected file does not appear to be a valid JSON.");
      setIsProcessing(false);
      setShowPrefixDialog(false);
      setShowPrefixWarning(false);
    }
  };

  const handleCancelImport = () => {
    setShowPrefixDialog(false);
    setShowPrefixWarning(false);
    setPrefixInput("");
    setExistingPrefix("");
    setDetectedPrefixes([]);
    setShowPrefixButtons(true);
  };

  const handleProceedWithWarning = () => {
    setShowPrefixWarning(false);
    // Continue with the import
    handleConfirmImport();
  };

  return (
    <div className="p-fix-md flex flex-col gap-fix-md overflow-visible">
      {/* Header area */}
      <header>
        <h1 className="text-2xl">DB Custom Color Importer</h1>
        {!showPrefixDialog && !isProcessing && (
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

      {isProcessing ? (
        <DBStack gap="medium" className="items-center justify-center py-fix-lg">
          <div className="flex flex-col items-center gap-fix-md">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin"></div>
            </div>
            <DBInfotext semantic="informational">
              <div className="text-center">
                <strong>Processing...</strong>
                <br />
                Importing color variables. This may take a moment.
              </div>
            </DBInfotext>
          </div>
        </DBStack>
      ) : !showPrefixDialog ? (
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
          <DBInfotext semantic="informational">
            Collections with prefix "{existingPrefix}" already exist in this
            file. Your new colors with prefix "{prefixInput}" will be added to
            the existing collections. This means both color families will be
            available in the same collections.
          </DBInfotext>

          <DBInfotext semantic="informational">
            If you want to use another prefix for your new colors, click "Change
            Prefix" and change it.
          </DBInfotext>

          <div className="flex gap-fix-sm">
            <DBButton variant="brand" onClick={handleProceedWithWarning}>
              Proceed with Import
            </DBButton>
            <DBButton
              variant="secondary"
              onClick={() => {
                setShowPrefixWarning(false);
                setShowPrefixButtons(false);
              }}
            >
              Change Prefix
            </DBButton>
            <DBButton variant="secondary" onClick={handleCancelImport}>
              Cancel
            </DBButton>
          </div>
        </DBStack>
      ) : (
        <DBStack gap="medium" className="px-fix-xs -mx-fix-xs">
          <DBInfotext semantic="informational">
            Please specify a prefix for your collections, variables, and modes.
            This prefix will be used to organize your color variables into
            groups. For example, "db-poi-db-services" will be organized as
            "db-poi/db-services".
          </DBInfotext>

          {/* Show Theme Builder recommendation if prefixes are missing */}
          {showThemeBuilderInfo && (
            <DBInfotext semantic="warning">
              <strong>Recommendation:</strong> For best results, create your
              theme properly in the{" "}
              <a
                href="https://design-system.deutschebahn.com/theme-builder/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                DB UX Theme Builder
              </a>
              . For DB users, base your theme on the DB Theme and specify:
              <ul className="list-disc ml-fix-md mt-fix-xs">
                <li>A clear theme name (e.g., "RI", "MyProduct")</li>
                <li>
                  Optionally, a prefix for your color variables (e.g., "db",
                  "custom")
                </li>
              </ul>
              This ensures proper organization and naming consistency.
            </DBInfotext>
          )}

          {/* Show detected prefixes as options if available */}
          {detectedPrefixes.length > 0 && showPrefixButtons && (
            <div className="flex flex-col gap-fix-xs">
              <label className="text-sm font-semibold">
                Detected prefixes - select one:
              </label>
              <div className="flex flex-col gap-fix-2xs">
                {detectedPrefixes.map((prefix, index) => (
                  <DBButton
                    key={index}
                    variant={
                      prefixInput === prefix.value ? "brand" : "secondary"
                    }
                    onClick={() => setPrefixInput(prefix.value)}
                    className="justify-start"
                  >
                    <span className="flex items-center gap-fix-xs">
                      <span className="font-mono">{prefix.value}</span>
                      <span className="text-xs opacity-70">
                        ({prefix.source})
                      </span>
                    </span>
                  </DBButton>
                ))}
              </div>
            </div>
          )}

          {/* Manual input field */}
          <DBInput
            label={
              detectedPrefixes.length > 0 && showPrefixButtons
                ? "Or enter custom prefix"
                : "Enter prefix"
            }
            value={prefixInput}
            onChange={(e) => setPrefixInput(e.target.value)}
            placeholder="Enter prefix (e.g., db-poi, RI)"
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
