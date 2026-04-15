import { useCallback, useEffect, useRef, useState } from "react";
import { DBButton, DBInfotext, DBInput } from "@db-ux/react-core-components";
import { usePluginMessage } from "../../hooks/usePluginMessage";
import type {
  ModuleError,
  ModuleResult,
  ModuleViewProps,
  PluginToUIMessage,
  ProgressUpdate,
} from "../../types";

const VERSION_REGEX = /^\d+\.\d+$/;

interface ComponentEntry {
  id: string;
  name: string;
  version: string | null;
  key: string;
  publishStatus: "UNPUBLISHED" | "CURRENT" | "CHANGED" | "UNKNOWN" | "SCANNING";
}

function StampingView({
  moduleId,
  sendMessage,
  initialVersion,
}: ModuleViewProps) {
  const [version, setVersion] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [result, setResult] = useState<ModuleResult | null>(null);
  const [components, setComponents] = useState<ComponentEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showList, setShowList] = useState(false);

  const pendingActionRef = useRef<string | null>(null);
  const showListRef = useRef(showList);
  showListRef.current = showList;

  useEffect(() => {
    if (initialVersion && !version) setVersion(initialVersion);
  }, [initialVersion]);

  const isValid = VERSION_REGEX.test(version);
  const hasInput = version.length > 0;

  const handleMessage = useCallback(
    (msg: PluginToUIMessage) => {
      if (msg.type === "publishStatus") {
        const data = msg.data as { id: string; publishStatus: string };
        setComponents((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? {
                  ...c,
                  publishStatus:
                    data.publishStatus as ComponentEntry["publishStatus"],
                }
              : c,
          ),
        );
        if (data.publishStatus === "CHANGED") {
          setSelectedIds((prev) => new Set([...prev, data.id]));
        }
        return;
      }

      if (msg.module !== moduleId) return;

      if (msg.type === "progress") {
        setProgress(msg.data as ProgressUpdate);
      }

      if (msg.type === "result") {
        const moduleResult = msg.data as ModuleResult;
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setIsRunning(false);
        setProgress(null);

        if (action === "list-components" && moduleResult.success) {
          const data = moduleResult.data as { components: ComponentEntry[] };
          setComponents(data.components);
          setSelectedIds(new Set());
          setShowList(true);
        } else if (action === "detect-changed" && moduleResult.success) {
          const data = moduleResult.data as { changedIds: string[] };
          setSelectedIds(new Set(data.changedIds));
        } else {
          setResult(moduleResult);
          if (
            showListRef.current &&
            (action === "stamp-by-ids" ||
              action === "stamp-all" ||
              action === "stamp-selection") &&
            moduleResult.success
          ) {
            pendingActionRef.current = "list-components";
            sendMessage("list-components", {});
          }
        }
      }
    },
    [moduleId, sendMessage],
  );

  usePluginMessage(handleMessage);

  const loadComponents = () => {
    pendingActionRef.current = "list-components";
    setIsRunning(true);
    setResult(null);
    sendMessage("list-components", {});
  };
  const stampAll = () => {
    pendingActionRef.current = "stamp-all";
    setIsRunning(true);
    setResult(null);
    setProgress(null);
    sendMessage("stamp-all", { version });
  };
  const stampSelected = () => {
    pendingActionRef.current = "stamp-by-ids";
    setIsRunning(true);
    setResult(null);
    setProgress(null);
    sendMessage("stamp-by-ids", { version, ids: Array.from(selectedIds) });
  };
  const detectChanged = () => {
    pendingActionRef.current = "detect-changed";
    setIsRunning(true);
    sendMessage("detect-changed", {});
  };

  const toggleComponent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === components.length
        ? new Set()
        : new Set(components.map((c) => c.id)),
    );
  };

  const stampedCount =
    result?.success && result.data
      ? (result.data as { stamped: number }).stamped
      : 0;
  const resultMessage =
    result?.success && result.data
      ? (result.data as { message?: string }).message
      : null;
  const errors: ModuleError[] = result?.errors ?? [];

  return (
    <div className="flex flex-col gap-fix-md">
      <DBInput
        label="Version (Major.Minor)"
        placeholder="1.0"
        value={version}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setVersion(e.target.value)
        }
      />

      {hasInput && (
        <DBInfotext semantic={isValid ? "successful" : "critical"}>
          {isValid
            ? `Version ${version} ist gültig`
            : "Ungültiges Format — erwartet: MAJOR.MINOR (z.B. 5.2)"}
        </DBInfotext>
      )}

      <div className="flex flex-col gap-fix-sm">
        <DBButton
          variant="brand"
          disabled={!isValid || isRunning}
          onClick={stampAll}
          width="full"
        >
          Stamp All Components
        </DBButton>
        <DBButton
          variant="outlined"
          disabled={!isValid || isRunning}
          width="full"
          onClick={() => {
            pendingActionRef.current = "stamp-selection";
            setIsRunning(true);
            setResult(null);
            setProgress(null);
            sendMessage("stamp-selection", { version });
          }}
        >
          Stamp Figma Selection
        </DBButton>
        <DBButton
          variant="outlined"
          disabled={isRunning}
          onClick={loadComponents}
          width="full"
        >
          Komponenten auswählen…
        </DBButton>
      </div>

      {showList && components.length > 0 && (
        <div className="flex flex-col gap-fix-sm border rounded p-fix-sm max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between gap-fix-xs">
            <span className="text-sm font-semibold">
              {selectedIds.size} / {components.length} ausgewählt
            </span>
            <div className="flex gap-fix-xs">
              <DBButton
                variant="ghost"
                size="small"
                disabled={isRunning}
                onClick={detectChanged}
              >
                Geänderte erkennen
              </DBButton>
              <DBButton variant="ghost" size="small" onClick={toggleAll}>
                {selectedIds.size === components.length ? "Keine" : "Alle"}
              </DBButton>
            </div>
          </div>

          {components.map((comp) => (
            <label
              key={comp.id}
              className="flex items-center gap-fix-xs cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(comp.id)}
                onChange={() => toggleComponent(comp.id)}
              />
              <span className="flex-1">
                {comp.name}
                {comp.publishStatus === "SCANNING" && (
                  <span className="ml-1 text-xs opacity-60">⏳</span>
                )}
                {comp.publishStatus === "CHANGED" && (
                  <span className="ml-1 text-xs text-[color:var(--db-warning)]">
                    ● geändert
                  </span>
                )}
                {comp.publishStatus === "CURRENT" && (
                  <span className="ml-1 text-xs opacity-40">✓</span>
                )}
                {comp.publishStatus === "UNPUBLISHED" && (
                  <span className="ml-1 text-xs opacity-40">neu</span>
                )}
              </span>
              {comp.version && (
                <span className="text-xs opacity-60">v{comp.version}</span>
              )}
            </label>
          ))}

          <DBButton
            variant="brand"
            disabled={!isValid || isRunning || selectedIds.size === 0}
            onClick={stampSelected}
            width="full"
          >
            Stamp {selectedIds.size} Komponente
            {selectedIds.size !== 1 ? "n" : ""}
          </DBButton>
        </div>
      )}

      {isRunning && progress && (
        <DBInfotext semantic="informational">
          Verarbeite {progress.processed} von {progress.total} Komponenten
          {progress.currentComponent ? ` — ${progress.currentComponent}` : ""}
        </DBInfotext>
      )}

      {result && result.success && (
        <DBInfotext semantic="successful">
          {resultMessage || `Fertig — ${stampedCount} Komponenten gestampt.`}
        </DBInfotext>
      )}

      {errors.length > 0 && (
        <div className="flex flex-col gap-fix-xs">
          <DBInfotext semantic="critical">{errors.length} Fehler:</DBInfotext>
          <ul className="list-disc pl-fix-md text-sm">
            {errors.map((err) => (
              <li key={err.componentId}>
                <strong>{err.componentName}</strong>: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StampingView;
