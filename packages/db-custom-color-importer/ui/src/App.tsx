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

  const handleImport = () => {
    if (!jsonInput) {
      setFeedback("Please select a JSON file to import.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setIsLoading(true);
      setFeedback("");
      parent.postMessage(
        {
          pluginMessage: {
            type: "import-json",
            data: parsed,
            deleteMissing,
            fileName,
          },
        },
        "*",
      );
    } catch (e) {
      setFeedback("The selected file does not appear to be a valid JSON.");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* Header area */}
      <header>
        <h1 className="text-2xl">DB Custom Color Importer</h1>
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
