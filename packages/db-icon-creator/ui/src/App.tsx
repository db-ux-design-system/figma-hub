import { useEffect, useState } from "react";
import { DBInfotext, DBButton } from "@db-ux/react-core-components";
import {
  SelectionStatus,
  DescriptionDialog,
  ProgressIndicator,
  NameEditor,
  ValidationResults,
  WorkflowInfo,
  CompleteState,
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
  nameValidationResult: NameValidationResult | null;
  sizeValidationResult: ValidationResult | null;
  isProcessing: boolean;
  currentOperation: string | null;
  error: string | null;
  showDescriptionDialog: boolean;
  canCreateIconSet: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    selectionInfo: null,
    nameValidationResult: null,
    sizeValidationResult: null,
    isProcessing: false,
    currentOperation: null,
    error: null,
    showDescriptionDialog: false,
    canCreateIconSet: false,
  });

  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage as PluginMessage;
      handlePluginMessage(msg);
    };
    sendMessage({ type: "get-selection" }, false);
  }, []);

  const handlePluginMessage = (msg: PluginMessage) => {
    switch (msg.type) {
      case "selection-info":
        setState((prev) => ({
          ...prev,
          selectionInfo: msg.data,
          nameValidationResult: null,
          sizeValidationResult: null,
          canCreateIconSet: false,
        }));
        break;
      case "name-validation-result":
        setState((prev) => {
          const canCreate =
            msg.data.isValid && (prev.sizeValidationResult?.isValid ?? false);
          return {
            ...prev,
            nameValidationResult: msg.data,
            canCreateIconSet: canCreate,
            isProcessing: false,
          };
        });
        break;
      case "size-validation-result":
        setState((prev) => {
          const canCreate =
            (prev.nameValidationResult?.isValid ?? false) && msg.data.isValid;
          return {
            ...prev,
            sizeValidationResult: msg.data,
            canCreateIconSet: canCreate,
            isProcessing: false,
          };
        });
        break;
      case "progress":
        setState((prev) => ({ ...prev, currentOperation: msg.data }));
        break;
      case "open-description-dialog":
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentOperation: null,
          showDescriptionDialog: true,
        }));
        break;
      case "success":
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          currentOperation: null,
          error: null,
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

  const handleUpdateName = (newName: string) => {
    sendMessage({ type: "update-name", payload: newName });
  };

  const handleCreateIconSet = () => {
    sendMessage({ type: "create-icon-set" });
  };

  const handleSaveDescription = (data: DescriptionData) => {
    sendMessage({ type: "edit-description", payload: data });
    setState((prev) => ({ ...prev, showDescriptionDialog: false }));
  };

  const handleCancelDescription = () => {
    setState((prev) => ({ ...prev, showDescriptionDialog: false }));
  };

  const hasNameErrors =
    state.nameValidationResult && !state.nameValidationResult.isValid;

  return (
    <div className="flex flex-col h-screen db-bg-color-basic-level-1 overflow-hidden">
      <header className="flex-shrink-0 gap-fix-md p-fix-md">
        <h1 className="text-2xl my-fix-sm">DB Icon Creator</h1>
        <SelectionStatus
          info={state.selectionInfo}
          nameValidation={state.nameValidationResult}
          sizeValidation={state.sizeValidationResult}
        />
      </header>

      <div className="flex-1 overflow-y-auto gap-fix-md px-fix-md">
        {state.selectionInfo?.isComponentSet ? (
          state.selectionInfo.isComplete && state.showDescriptionDialog ? (
            <div className="h-full py-fix-md">
              <DescriptionDialog
                isOpen={state.showDescriptionDialog}
                onSave={handleSaveDescription}
                onCancel={handleCancelDescription}
              />
            </div>
          ) : (
            <div className="py-fix-md space-y-4">
              {state.selectionInfo.isComplete &&
              !state.showDescriptionDialog ? (
                <CompleteState />
              ) : (
                <>
                  {!state.selectionInfo.isComplete && (
                    <>
                      <ValidationResults
                        nameValidation={state.nameValidationResult}
                        sizeValidation={state.sizeValidationResult}
                      />

                      {state.canCreateIconSet && <WorkflowInfo />}

                      {hasNameErrors && state.nameValidationResult && (
                        <>
                          <NameEditor
                            currentName={
                              state.selectionInfo.componentSet?.name || ""
                            }
                            suggestion={state.nameValidationResult.suggestion}
                            errors={state.nameValidationResult.errors}
                            onUpdate={handleUpdateName}
                          />
                        </>
                      )}
                    </>
                  )}

                  {state.isProcessing && (
                    <ProgressIndicator operation={state.currentOperation} />
                  )}

                  {state.error && (
                    <DBInfotext semantic="critical" icon="error">
                      {state.error}
                    </DBInfotext>
                  )}
                </>
              )}
            </div>
          )
        ) : (
          <div className="py-fix-md"></div>
        )}
      </div>

      {state.selectionInfo?.isComponentSet &&
        state.selectionInfo.isComplete &&
        !state.showDescriptionDialog &&
        (!state.nameValidationResult || state.nameValidationResult.isValid) &&
        (!state.sizeValidationResult || state.sizeValidationResult.isValid) && (
          <footer className="flex-shrink-0 p-fix-md">
            <DBButton
              onClick={() =>
                setState((prev) => ({ ...prev, showDescriptionDialog: true }))
              }
              variant="brand"
              width="full"
            >
              Edit Description
            </DBButton>
          </footer>
        )}

      {state.selectionInfo?.isComponentSet &&
        !state.selectionInfo.isComplete &&
        state.canCreateIconSet && (
          <footer className="flex-shrink-0 p-fix-md">
            <DBButton
              onClick={handleCreateIconSet}
              disabled={state.isProcessing}
              variant="brand"
              width="full"
            >
              Create Icon Set
            </DBButton>
          </footer>
        )}
    </div>
  );
}

export default App;
