import { useCallback, useEffect, useState } from "react";
import { DBButton, DBCard } from "@db-ux/react-core-components";
import { sendMessage, usePluginMessage } from "./hooks/usePluginMessage";
import type {
  ModuleInfo,
  ModuleViewProps,
  ModuleViewRegistry,
  PluginToUIMessage,
} from "./types";

// Placeholder until Task 7.1
const StampingViewPlaceholder = ({ moduleId }: ModuleViewProps) => (
  <div className="p-fix-md text-center">
    Stamping Module (ID: {moduleId}) — wird in Task 7 implementiert
  </div>
);

const moduleViewRegistry: ModuleViewRegistry = {
  stamping: StampingViewPlaceholder,
};

function App() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  useEffect(() => {
    sendMessage("getModules");
  }, []);

  const handleMessage = useCallback((msg: PluginToUIMessage) => {
    if (msg.type === "modules") {
      setModules(msg.data as ModuleInfo[]);
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
        <>
          <div className="flex items-center gap-fix-sm">
            <DBButton
              icon="arrow_left"
              variant="ghost"
              onClick={() => setActiveModuleId(null)}
            >
              Zurück
            </DBButton>
          </div>
          <header>
            <h1 className="text-2xl">{activeModule.name}</h1>
            <p className="text-sm">{activeModule.description}</p>
          </header>
          <ActiveView
            moduleId={activeModuleId!}
            sendMessage={moduleSendMessage}
          />
        </>
      ) : (
        <>
          <header>
            <h1 className="text-2xl">DB Figma Release</h1>
            <p className="text-sm">Wähle ein Modul, um loszulegen.</p>
          </header>
          <div className="flex flex-col gap-fix-sm">
            {modules.map((mod) => (
              <DBCard
                key={mod.id}
                className="cursor-pointer"
                onClick={() => setActiveModuleId(mod.id)}
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
