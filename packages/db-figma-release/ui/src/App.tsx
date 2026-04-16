import { useCallback, useEffect, useState } from "react";
import { DBCard } from "@db-ux/react-core-components";
import { sendMessage, usePluginMessage } from "./hooks/usePluginMessage";
import type {
  ModuleInfo,
  ModuleViewRegistry,
  PluginToUIMessage,
} from "./types";

import StampingView from "./modules/stamping/StampingView";

const moduleViewRegistry: ModuleViewRegistry = {
  stamping: StampingView,
};

function App() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [selectionVersion, setSelectionVersion] = useState<
    string | undefined
  >();
  const [hasCanvasSelection, setHasCanvasSelection] = useState(false);

  useEffect(() => {
    sendMessage("getModules");
    sendMessage("getStorage");
  }, []);

  const handleMessage = useCallback((msg: PluginToUIMessage) => {
    if (msg.type === "modules") {
      setModules(msg.data as ModuleInfo[]);
    }
    if (msg.type === "storage") {
      const storageData = msg.data as { lastModule?: string } | undefined;
      if (storageData?.lastModule) {
        setActiveModuleId(storageData.lastModule);
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
        />
      ) : (
        <>
          <header>
            <h1 className="text-2xl">DB Figma Release</h1>
            <p className="text-sm">Choose a option to start</p>
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
        </>
      )}
    </div>
  );
}

export default App;
