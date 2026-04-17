import { useCallback, useEffect, useState } from "react";
import { DBButton, DBCard, DBInput } from "@db-ux/react-core-components";
import { sendMessage, usePluginMessage } from "./hooks/usePluginMessage";
import type {
  ModuleInfo,
  ModuleViewRegistry,
  PluginToUIMessage,
} from "./types";

import StampingView from "./modules/stamping/StampingView";
import ChangelogView from "./modules/changelog/ChangelogView";

const moduleViewRegistry: ModuleViewRegistry = {
  stamping: StampingView,
  changelog: ChangelogView,
};

function App() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [selectionVersion, setSelectionVersion] = useState<
    string | undefined
  >();
  const [hasCanvasSelection, setHasCanvasSelection] = useState(false);
  const [fileKey, setFileKey] = useState<string | undefined>();
  const [figmaToken, setFigmaToken] = useState<string | undefined>();

  useEffect(() => {
    sendMessage("getModules");
    sendMessage("getStorage");
  }, []);

  const handleMessage = useCallback((msg: PluginToUIMessage) => {
    if (msg.type === "modules") {
      setModules(msg.data as ModuleInfo[]);
    }
    if (msg.type === "storage") {
      const storageData = msg.data as
        | {
            lastModule?: string;
            fileKey?: string;
            figmaToken?: string;
          }
        | undefined;
      console.log("storage received:", storageData);
      if (storageData?.lastModule) {
        setActiveModuleId(storageData.lastModule);
      }
      if (storageData?.figmaToken) {
        setFigmaToken(storageData.figmaToken);
      }
      if (storageData?.fileKey) {
        setFileKey(storageData.fileKey);
      }
    }
    if (msg.type === "selectionVersion") {
      const data = msg.data as
        | { version: string | null; hasComponents?: boolean }
        | undefined;
      setSelectionVersion(data?.version ?? undefined);
      setHasCanvasSelection(data?.hasComponents ?? false);
    }
  }, []);

  usePluginMessage(handleMessage);

  const activeModule = modules.find((m) => m.id === activeModuleId);
  const ActiveView = activeModuleId ? moduleViewRegistry[activeModuleId] : null;

  const moduleSendMessage = useCallback(
    (action: string, payload?: unknown) => {
      if (activeModuleId) {
        sendMessage("execute", activeModuleId, action, payload);
      }
    },
    [activeModuleId],
  );

  const saveToken = useCallback((token: string) => {
    setFigmaToken(token);
    sendMessage("setStorage", undefined, undefined, { figmaToken: token });
  }, []);

  const saveFileKey = useCallback((key: string) => {
    setFileKey(key);
    sendMessage("setStorage", undefined, undefined, { fileKey: key });
  }, []);

  const [tokenInput, setTokenInput] = useState("");
  const [fileKeyInput, setFileKeyInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (figmaToken) setTokenInput(figmaToken);
  }, [figmaToken]);

  useEffect(() => {
    if (fileKey) setFileKeyInput(fileKey);
  }, [fileKey]);

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {activeModule && ActiveView ? (
        <ActiveView
          moduleId={activeModuleId!}
          moduleName={activeModule.name}
          moduleDescription={activeModule.description}
          sendMessage={moduleSendMessage}
          onBack={() => setActiveModuleId(null)}
          initialVersion={selectionVersion}
          hasCanvasSelection={hasCanvasSelection}
          fileKey={fileKey}
          figmaToken={figmaToken}
          onSaveToken={saveToken}
        />
      ) : (
        <>
          <header>
            <h1 className="text-2xl">DB Figma Release</h1>
            <p className="text-sm">Choose a module to start</p>
          </header>
          <div className="flex flex-col gap-fix-sm">
            {modules.map((mod) => (
              <DBCard
                key={mod.id}
                className="cursor-pointer"
                onClick={() => {
                  setActiveModuleId(mod.id);
                  sendMessage("setStorage", undefined, undefined, {
                    lastModule: mod.id,
                  });
                }}
              >
                <h2 className="text-lg font-semibold">{mod.name}</h2>
                <p className="text-sm">{mod.description}</p>
              </DBCard>
            ))}
          </div>

          <div className="border-t pt-fix-sm mt-fix-sm">
            <DBButton
              variant="ghost"
              size="small"
              icon={showSettings ? "chevron_up" : "chevron_down"}
              onClick={() => setShowSettings(!showSettings)}
            >
              Settings
            </DBButton>
            {showSettings && (
              <div className="flex flex-col gap-fix-sm mt-fix-xs">
                <div className="flex gap-fix-sm items-end">
                  <DBInput
                    label="Figma API Token"
                    placeholder="figd_..."
                    value={tokenInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTokenInput(e.target.value)
                    }
                  />
                  <DBButton
                    variant="outlined"
                    disabled={!tokenInput.trim() || tokenInput === figmaToken}
                    onClick={() => saveToken(tokenInput.trim())}
                  >
                    Save
                  </DBButton>
                </div>
                <div className="flex gap-fix-sm items-end">
                  <DBInput
                    label="File Key (from URL: figma.com/design/<key>/…)"
                    placeholder="abc123XYZ..."
                    value={fileKeyInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFileKeyInput(e.target.value)
                    }
                  />
                  <DBButton
                    variant="outlined"
                    disabled={!fileKeyInput.trim() || fileKeyInput === fileKey}
                    onClick={() => saveFileKey(fileKeyInput.trim())}
                  >
                    Save
                  </DBButton>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
