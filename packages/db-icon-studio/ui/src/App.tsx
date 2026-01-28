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
  existingDescription: DescriptionData | null;
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
    existingDescription: null,
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
          existingDescription: null,
          canCreateIconSet: false,
        }));
        break;
      case "existing-description":
        setState((prev) => ({
          ...prev,
          existingDescription: msg.data,
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
          // Warnings don't block creation, only errors do
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

  const handleCreateIllustrativeIcon = () => {
    sendMessage({ type: "create-illustrative-icon" });
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
        <h1 className="text-2xl my-fix-sm">DB Icon Studio</h1>
        <SelectionStatus
          info={state.selectionInfo}
          nameValidation={state.nameValidationResult}
          sizeValidation={state.sizeValidationResult}
        />
      </header>

      <div className="flex-1 overflow-y-auto gap-fix-md px-fix-md">
        {state.selectionInfo?.isComponentSet ||
        state.selectionInfo?.isComponent ||
        state.selectionInfo?.isMasterIconFrame ? (
          state.selectionInfo.isComplete && state.showDescriptionDialog ? (
            <div className="h-full py-fix-md">
              <DescriptionDialog
                isOpen={state.showDescriptionDialog}
                iconType={state.selectionInfo.iconType}
                iconName={
                  state.selectionInfo.componentSet?.name ||
                  state.selectionInfo.component?.name ||
                  ""
                }
                initialData={state.existingDescription || undefined}
                onSave={handleSaveDescription}
                onCancel={handleCancelDescription}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {state.selectionInfo.isComplete &&
              !state.showDescriptionDialog &&
              (!state.nameValidationResult ||
                state.nameValidationResult.isValid) &&
              (!state.sizeValidationResult ||
                state.sizeValidationResult.isValid) ? (
                <CompleteState iconType={state.selectionInfo.iconType} />
              ) : (
                <>
                  <ValidationResults
                    nameValidation={state.nameValidationResult}
                    sizeValidation={state.sizeValidationResult}
                    isMasterIconFrame={state.selectionInfo.isMasterIconFrame}
                  />

                  {state.canCreateIconSet && (
                    <WorkflowInfo iconType={state.selectionInfo.iconType} />
                  )}

                  {hasNameErrors && state.nameValidationResult && (
                    <>
                      <NameEditor
                        currentName={
                          state.selectionInfo.componentSet?.name ||
                          state.selectionInfo.component?.name ||
                          ""
                        }
                        suggestion={state.nameValidationResult.suggestion}
                        onUpdate={handleUpdateName}
                      />
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

      {/* Edit Description Button - for complete icons */}
      {(state.selectionInfo?.isComponentSet ||
        state.selectionInfo?.isComponent) &&
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
              {state.selectionInfo.iconType === "functional"
                ? "Edit Icon Set Description"
                : "Edit Icon Description"}
            </DBButton>
          </footer>
        )}

      {/* Create Icon Set Button - for functional icons */}
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

      {/* Create Illustrative Icon Button - for illustrative icons */}
      {state.selectionInfo?.isComponent &&
        !state.selectionInfo.isComplete &&
        state.canCreateIconSet && (
          <footer className="flex-shrink-0 p-fix-md">
            <DBButton
              onClick={handleCreateIllustrativeIcon}
              disabled={state.isProcessing}
              variant="brand"
              width="full"
            >
              Create Illustrative Icon
            </DBButton>
          </footer>
        )}
    </div>
  );
}

export default App;
