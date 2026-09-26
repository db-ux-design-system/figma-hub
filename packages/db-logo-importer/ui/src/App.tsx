import React, { useState, useEffect, useRef } from "react";
import {
  DBButton,
  DBNotification,
} from "@db-ux/react-core-components";

type FeedbackSemantic = "successful" | "warning" | "critical";

interface Feedback {
  message: string;
  semantic: FeedbackSemantic;
}

const App = () => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listener for messages from the plugin backend (code.ts)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const pluginMessage = event.data?.pluginMessage;
      if (!pluginMessage?.feedback) return;

      setFeedback({
        message: pluginMessage.feedback,
        // The plugin sends the severity explicitly; fall back to critical so an
        // unlabelled message is never mistaken for a success.
        semantic: pluginMessage.semantic ?? "critical",
      });
      setIsLoading(false); // Loading ends when feedback is received
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFeedback(null); // Clear old feedback
    }
  };

  const handleImport = () => {
    if (!file) {
      setFeedback({
        message: "Please select a SVG file to import.",
        semantic: "critical",
      });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = () => {
      // The SVG itself is validated by the plugin, which owns that rule.
      parent.postMessage(
        {
          pluginMessage: {
            type: "import-svg",
            svg: reader.result as string,
            filename: file.name,
          },
        },
        "*"
      );
    };

    reader.onerror = () => {
      setFeedback({
        message: "Error reading the SVG file.",
        semantic: "critical",
      });
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* Header area */}
      <header>
        <h1 className="text-2xl">DB Logo Importer</h1>
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

      {/* Upload Area */}
      <div
        className="rounded-[var(--db-border-radius-sm)] p-fix-lg flex flex-col items-center gap-fix-md"
        style={{
          border: 'var(--db-border-width-3xs) dashed var(--db-adaptive-on-bg-basic-emphasis-60-default)',
        }}
      >
        <p className="text-center text-sm m-0">
          Use the{" "}
          <a
            href="https://marketingportal.extranet.deutschebahn.com/marketingportal/Marke-und-Design/Basiselemente/Logo/Logozusatz-mit-Tool"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            DB brand logo generator
          </a>{" "}
          to create a custom logo SVG
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />

        <DBButton
          variant="filled"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse
        </DBButton>

        {file && (
          <p className="text-sm text-adaptive-on-basic-emphasis-80-default">{file.name}</p>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <DBNotification variant="standalone" semantic={feedback.semantic}>
          {feedback.message}
        </DBNotification>
      )}

      {/* Import Button */}
      <DBButton
        icon="upload"
        variant="brand"
        onClick={handleImport}
        disabled={isLoading || !file}
        width="full"
      >
        {isLoading ? "Importing..." : "Import SVG"}
      </DBButton>
    </div>
  );
};

export default App;
