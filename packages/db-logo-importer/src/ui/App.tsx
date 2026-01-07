import React, { useState, useEffect } from "react";
import "./index.css";
import { DBButton, DBInput, DBInfotext } from "@db-ux/react-core-components";

const App = () => {
  const [feedback, setFeedback] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listener für Nachrichten vom Plugin-Backend (code.ts)
  useEffect(() => {
    window.onmessage = (event) => {
      const { pluginMessage } = event.data;
      if (pluginMessage && pluginMessage.feedback) {
        setFeedback(pluginMessage.feedback);
        setIsLoading(false); // Laden beenden, wenn Feedback kommt
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFeedback(""); // Altes Feedback löschen
    }
  };

  const handleImport = () => {
    if (!file) {
      setFeedback("Please select an SVG file.");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      if (!result || !result.includes("<svg")) {
        setFeedback("The selected file does not appear to be a valid SVG.");
        setIsLoading(false);
        return;
      }

      // Sende Daten an Figma
      parent.postMessage(
        {
          pluginMessage: {
            type: "import-svg",
            svg: result,
            filename: file.name,
          },
        },
        "*"
      );
    };

    reader.onerror = () => {
      setFeedback("Error reading the SVG file.");
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-3 flex flex-col gap-6">
      {/* Header Bereich */}
      <header>
        <h1>DB Logo Importer</h1>
        <p className="text-sm">
          Please download the logo svg from the{" "}
          <a
            href="https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Logo/Logozusatz-mit-Tool"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Marketingportal
          </a>
          .
        </p>
      </header>

      {/* Input Sektion */}
      <div className="flex flex-col gap-5">
        <DBInput
          label="Logo SVG auswählen"
          showLabel={false}
          type="file"
          accept="image/svg+xml"
          onChange={handleFileChange}
          className="w-full"
        />

        <DBButton variant="brand" onClick={handleImport}>
          {isLoading ? "Importing..." : "Import SVG"}
        </DBButton>
      </div>

      {/* Feedback / Status */}
      {feedback && (
        <div>
          <DBInfotext
            semantic={feedback.includes("Success") ? "successful" : "critical"}
          >
            {feedback}
          </DBInfotext>
        </div>
      )}
    </div>
  );
};

export default App;
