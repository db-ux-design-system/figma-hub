import { useCallback, useEffect, useState } from "react";
import {
  DBButton,
  DBCard,
  DBInfotext,
  DBInput,
  DBTag,
} from "@db-ux/react-core-components";
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
  const [documentName, setDocumentName] = useState<string | undefined>();
  const [figmaToken, setFigmaToken] = useState<string | undefined>();
  const [isBranch, setIsBranch] = useState<boolean | null>(null);
  const [libraries, setLibraries] = useState<
    Array<{ name: string; fileKey: string }>
  >([]);
  const [currentLibrary, setCurrentLibrary] = useState<{
    name: string;
    fileKey: string;
  } | null>(null);

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
            documentName?: string;
            figmaToken?: string;
            libraries?: Array<{ name: string; fileKey: string }>;
            currentLibrary?: { name: string; fileKey: string } | null;
            customLibraries?: Array<{ name: string; fileKey: string }>;
          }
        | undefined;
      if (storageData?.figmaToken) {
        setFigmaToken(storageData.figmaToken);
      }
      if (storageData?.fileKey) {
        setFileKey(storageData.fileKey);
      }
      if (storageData?.documentName) {
        setDocumentName(storageData.documentName);
      }
      if (storageData?.libraries) {
        setLibraries(storageData.libraries);
      }
      if (storageData?.currentLibrary !== undefined) {
        setCurrentLibrary(storageData.currentLibrary ?? null);
      }
      if (storageData?.customLibraries) {
        setCustomLibraries(storageData.customLibraries);
      }
      if (storageData?.customLibraries) {
        setCustomLibraries(storageData.customLibraries);
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

  // Detect branch via REST API
  useEffect(() => {
    if (!figmaToken || !fileKey) return;
    (async () => {
      try {
        const res = await fetch(
          `https://api.figma.com/v1/files/${fileKey}?branch_data=true&depth=1`,
          { headers: { "X-Figma-Token": figmaToken } },
        );
        if (!res.ok) return;
        const data = await res.json();
        setIsBranch(!!data.mainFileKey);
      } catch {
        /* ignore */
      }
    })();
  }, [figmaToken, fileKey]);

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

  const [tokenInput, setTokenInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [shareLinkInput, setShareLinkInput] = useState("");
  const [addingLib, setAddingLib] = useState(false);
  const [fileKeyLinkInput, setFileKeyLinkInput] = useState("");
  const [customLibraries, setCustomLibraries] = useState<
    Array<{ name: string; fileKey: string }>
  >([]);

  useEffect(() => {
    if (figmaToken) setTokenInput(figmaToken);
  }, [figmaToken]);

  /** Parse file key from a Figma share URL */
  function parseFileKey(url: string): string | null {
    const match = url.match(
      /figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/,
    );
    return match ? match[1] : null;
  }

  /** Parse file name from a Figma share URL (the slug after the file key) */
  function parseFileName(url: string): string | null {
    const match = url.match(
      /figma\.com\/(?:file|design|proto)\/[a-zA-Z0-9]+\/([^?#]+)/,
    );
    if (!match) return null;
    // URL slug uses dashes for spaces, decode and clean up
    return decodeURIComponent(match[1]).replace(/-+/g, " ").trim();
  }

  /** Add a library via share link — parses name from URL, falls back to API */
  const addLibraryFromLink = async () => {
    const key = parseFileKey(shareLinkInput);
    if (!key) return;

    // Check if already in the list
    if (
      libraries.some((l) => l.fileKey === key) ||
      customLibraries.some((l) => l.fileKey === key)
    ) {
      setShareLinkInput("");
      return;
    }

    setAddingLib(true);

    // Use the actual document name if the link points to the current file,
    // otherwise try URL slug, then API
    let name: string | null = null;
    if (key === fileKey && documentName) {
      name = documentName;
    } else {
      name = parseFileName(shareLinkInput);
      if (!name && figmaToken) {
        try {
          const res = await fetch(
            `https://api.figma.com/v1/files/${key}?depth=1`,
            { headers: { "X-Figma-Token": figmaToken } },
          );
          const data = await res.json();
          name = data.name ?? null;
        } catch {
          /* ignore */
        }
      }
    }

    const next = [...customLibraries, { name: name ?? key, fileKey: key }];
    setCustomLibraries(next);
    sendMessage("setStorage", undefined, undefined, {
      customLibraries: next,
    });
    sendMessage("getModules");
    setShareLinkInput("");
    setAddingLib(false);
  };

  // Merge hardcoded + custom libraries for display and pass-through
  const allLibraries = [...libraries, ...customLibraries];

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
      {/* <DBInfotext semantic="successful">
        Build: {__BUILD_TIME__} | {documentName ?? "?"}
      </DBInfotext> */}
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
          documentName={documentName}
          isBranch={isBranch}
          figmaToken={figmaToken}
          libraries={allLibraries}
          onSaveToken={saveToken}
        />
      ) : (
        <>
          <header>
            <h1 className="text-2xl">DB Figma Release</h1>
            <p className="text-sm">Choose a module to start</p>
            {currentLibrary && (
              <p className="text-xs opacity-60">
                Current file: {currentLibrary.name}
              </p>
            )}
          </header>

          {/* File key setup — shown when the current file hasn't been identified yet */}
          {!fileKey && (
            <DBCard>
              <p className="text-sm font-semibold">File nicht erkannt</p>
              <p className="text-xs opacity-60">
                Füge den Share-Link dieser Datei ein, um sie zu identifizieren.
                Das muss nur einmal gemacht werden.
              </p>
              <div className="flex gap-fix-xs items-end mt-fix-xs">
                <DBInput
                  label="Share-Link dieser Datei"
                  placeholder="https://www.figma.com/design/..."
                  value={fileKeyLinkInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFileKeyLinkInput(e.target.value)
                  }
                />
                <DBButton
                  variant="brand"
                  disabled={
                    !fileKeyLinkInput.trim() || !parseFileKey(fileKeyLinkInput)
                  }
                  onClick={() => {
                    const key = parseFileKey(fileKeyLinkInput);
                    if (!key) return;
                    sendMessage("setStorage", undefined, undefined, {
                      fileKey: key,
                    });
                    setFileKey(key);
                    setFileKeyLinkInput("");
                    // Re-fetch modules to update disabled state
                    sendMessage("getModules");
                  }}
                >
                  Speichern
                </DBButton>
              </div>
            </DBCard>
          )}

          <div className="flex flex-col gap-fix-sm">
            {modules.map((mod) => (
              <DBCard
                key={mod.id}
                className={mod.disabled ? "" : "cursor-pointer"}
                style={mod.disabled ? { opacity: 0.5 } : undefined}
                onClick={() => {
                  if (mod.disabled) return;
                  setActiveModuleId(mod.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg m-0 font-semibold">{mod.name}</h2>
                  {mod.runIn && (
                    <DBTag>
                      {mod.runIn === "branch" ? "Run in branch" : "Run in main"}
                    </DBTag>
                  )}
                </div>
                <p className="text-sm">{mod.description}</p>
                {mod.disabled && (
                  <DBInfotext semantic="warning">
                    Nicht verfügbar – diese Datei ist keine bekannte Library.
                  </DBInfotext>
                )}
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

                <p className="text-sm font-semibold mt-fix-xs">Libraries</p>
                {allLibraries.map((lib, i) => {
                  const isCustom = i >= libraries.length;
                  return (
                    <div
                      key={lib.fileKey}
                      className="flex gap-fix-xs items-center text-sm"
                    >
                      <span className="font-semibold flex-1">{lib.name}</span>
                      <span className="opacity-40 text-xs">
                        {lib.fileKey.slice(0, 8)}…
                      </span>
                      {isCustom && (
                        <DBButton
                          variant="ghost"
                          size="small"
                          icon="cross"
                          noText
                          onClick={() => {
                            const next = customLibraries.filter(
                              (l) => l.fileKey !== lib.fileKey,
                            );
                            setCustomLibraries(next);
                            sendMessage("setStorage", undefined, undefined, {
                              customLibraries: next,
                            });
                          }}
                        >
                          Remove
                        </DBButton>
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-fix-xs items-end">
                  <DBInput
                    label="Add via Figma Share Link"
                    placeholder="https://www.figma.com/design/..."
                    value={shareLinkInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setShareLinkInput(e.target.value)
                    }
                  />
                  <DBButton
                    variant="outlined"
                    disabled={
                      !shareLinkInput.trim() ||
                      !parseFileKey(shareLinkInput) ||
                      addingLib
                    }
                    onClick={addLibraryFromLink}
                  >
                    {addingLib ? "…" : "Add"}
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
