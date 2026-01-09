import React, { useState, useEffect } from "react";
import {
  DBButton,
  DBInput,
  DBInfotext,
  DBStack,
} from "@db-ux/react-core-components";

const App = () => {
  const [feedback, setFeedback] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listener for messages from the plugin backend (code.ts)
  useEffect(() => {
    window.onmessage = (event) => {
      const { pluginMessage } = event.data;
      if (pluginMessage && pluginMessage.feedback) {
        setFeedback(pluginMessage.feedback);
        setIsLoading(false); // Loading ends when feedback is received
      }
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFeedback(""); // Clear old feedback
    }
  };

  const handleImport = () => {
    if (!file) {
      setFeedback("Please select a SVG file.");
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

      // Send data to Figma
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
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* Header Bereich */}
      <header>
        <h2>DB Logo Importer</h2>
        <p className="text-sm">
          Please use the{" "}
          <a
            href="https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Logo/Logozusatz-mit-Tool"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            DB brand logo generator
          </a>{" "}
          to create a custom logo for your project or product.
        </p>
        <p className="text-sm">
          Please also read the{" "}
          <a
            href="https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13920-21204"
            rel="noopener noreferrer"
            target="_blank"
            className="underline"
          >
            documentation
          </a>{" "}
          on how to integrate the created SVG into the{" "}
          <a
            href="https://www.figma.com/design/WXIWe7Cj9bKUAanFfMZlUK/feat--initial-design-logo---pulse--1430--1575?node-id=13656-3564"
            rel="noopener noreferrer"
            target="_blank"
            className="underline"
          >
            logo component
          </a>
          .
        </p>
      </header>

      {/* Input Sektion */}
      <DBStack>
        <DBInput
          label="Choose SVG File"
          showLabel={false}
          type="file"
          accept="image/svg+xml"
          onChange={handleFileChange}
          className="w-full"
        />

        <DBButton
          icon="upload"
          variant="brand"
          onClick={handleImport}
          disabled={isLoading}
        >
          {isLoading ? "Importing..." : "Import SVG"}
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
};

export default App;
