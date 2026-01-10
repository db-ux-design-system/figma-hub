import React, { useState, useEffect, useRef } from "react";
import {
  DBButton,
  DBInput,
  DBStack,
  DBInfotext,
  DBCheckbox,
} from "@db-ux/react-core-components";

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  // Listener for messages from the plugin backend (code.ts)
  useEffect(() => {
    window.onmessage = (event) => {
      const { pluginMessage } = event.data;
      if (pluginMessage && pluginMessage.feedback) {
        setFeedback(pluginMessage.feedback);
        setIsLoading(false); // Loading ends when feedback is received
        setDeleteMissing(false); // Reset checkbox after import
        setFile(null); // Reset file state
        setJsonInput(""); // Reset JSON input
        setInputKey((k) => k + 1); // Force DBInput remount
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFeedback(""); // Clear old feedback
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonInput(event.target?.result as string);
      };
      reader.readAsText(selectedFile);
    } else {
      setFile(null);
      setJsonInput("");
    }
  };

  const handleImport = () => {
    console.log("yes", file);
    if (!file) {
      setFeedback("Please select a JSON file to import.");
      return;
    }

    setIsLoading(true);

    try {
      const parsed = JSON.parse(jsonInput);
      console.log("parsed", parsed);
      parent.postMessage(
        {
          pluginMessage: {
            type: "import-json",
            data: parsed,
            deleteMissing,
          },
        },
        "*"
      );
    } catch (e) {
      setFeedback("The selected file does not appear to be a valid JSON.");
    }
  };

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* Header area */}
      <header>
        <h2>DB Custom Color Importer</h2>
        <p className="text-sm">
          Select a JSON file with custom colors that you created and exported in
          the{" "}
          <a
            href="https://design-system.deutschebahn.com/theme-builder/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            DB UX Theme Builder
          </a>
          .
        </p>
      </header>
      <DBStack gap="medium">
        <DBInput
          key={inputKey}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          label="select file"
          showLabel={false}
          inputRef={fileInputRef}
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
          semantic={feedback.includes("Success") ? "successful" : "critical"}
        >
          {feedback}
        </DBInfotext>
      )}
    </div>
  );
}

export default App;
