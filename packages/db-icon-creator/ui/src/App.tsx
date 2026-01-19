/**
 * DB Icon Creator - Main App Component
 *
 * Main application component that orchestrates the plugin UI
 */

import { useEffect, useState } from "react";
import { DBDivider, DBInfotext } from "@db-ui/react-components";
import {
  SelectionStatus,
  IconTypeIndicator,
  OperationButtons,
  ValidationResults,
  DescriptionDialog,
  ProgressIndicator,
  EmptyState,
} from "./components";
import type {
  SelectionInfo,
  ValidationResult,
  NameValidationResult,
  PluginMessage,
  UIMessage,
  DescriptionData,
} from "./types";

interface AppState {
  selectionInfo: SelectionInfo | null;
  validationResult: ValidationResult | null;
  nameValidationResult: NameValidationResult | null;
  isProcessing: boolean;
  currentOperation: string | null;
  error: string | null;
  showDescriptionDialog: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    selectionInfo: null,
    validationResult: null,
    nameValidationResult: null,
    isProcessing: false,
    currentOperation: null,
    error: null,
    showDescriptionDialog: false,
  });

  useEffect(() => {
    // Listen to messages from plugin
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage as PluginMessage;
      handlePluginMessage(msg);
    };

    // Request initial selection info
    sendMessage({ type: "get-selection" }, false);
  }, []);

  const handlePluginMessage = (msg: PluginMessage) => {
    switch (msg.type) {
      case "selection-info":
        setState((prev) => ({
          ...prev,
          selectionInfo: msg.data,
          // Clear validation results when selection changes
          validationResult: null,
          nameValidationResult: null,
        }));
        break;
      case "validation-result":
        setState((prev) => ({
          ...prev,
          validationResult: msg.data,
          isProcessing: false,
        }));
        break;
      case "name-validation-result":
        setState((prev) => ({
          ...prev,
          nameValidationResult: msg.data,
          isProcessing: false,
        }));
        break;
      case "progress":
        setState((prev) => ({ ...prev, currentOperation: msg.data }));
        break;
      case "success":
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentOperation: null,
          error: null,
          showDescriptionDialog: false,
        }));
        break;
      case "error":
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentOperation: null,
          error: msg.error,
        }));
        break;
    }
  };

  const sendMessage = (msg: UIMessage, setProcessing = true) => {
    if (setProcessing) {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));
    }
    parent.postMessage({ pluginMessage: msg }, "*");
  };

  const handleEditDescription = () => {
    setState((prev) => ({ ...prev, showDescriptionDialog: true }));
  };

  const handleSaveDescription = (data: DescriptionData) => {
    sendMessage({ type: "edit-description", payload: data });
  };

  const handleCancelDescription = () => {
    setState((prev) => ({ ...prev, showDescriptionDialog: false }));
  };

  return (
    <div className="app">
      <h2>DB Icon Creator</h2>

      <SelectionStatus info={state.selectionInfo} />

      {state.selectionInfo?.isComponentSet && (
        <>
          <IconTypeIndicator type={state.selectionInfo.iconType} />

          <DBDivider />

          <OperationButtons
            onConvertOutline={() => sendMessage({ type: "convert-outline" })}
            onApplyColors={() => sendMessage({ type: "apply-colors" })}
            onScale={() => sendMessage({ type: "scale" })}
            onEditDescription={handleEditDescription}
            onRunAll={() => sendMessage({ type: "run-all" })}
            disabled={state.isProcessing}
          />

          {state.validationResult && (
            <ValidationResults result={state.validationResult} type="vector" />
          )}

          {state.nameValidationResult && (
            <ValidationResults
              result={state.nameValidationResult}
              type="name"
            />
          )}

          {state.isProcessing && (
            <ProgressIndicator operation={state.currentOperation} />
          )}

          {state.error && (
            <DBInfotext semantic="critical" icon="error">
              {state.error}
            </DBInfotext>
          )}

          <DescriptionDialog
            isOpen={state.showDescriptionDialog}
            onSave={handleSaveDescription}
            onCancel={handleCancelDescription}
          />
        </>
      )}

      {!state.selectionInfo?.isComponentSet && (
        <EmptyState message="Please select a Component Set to begin" />
      )}
    </div>
  );
}

export default App;
