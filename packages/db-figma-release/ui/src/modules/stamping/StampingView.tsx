import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DBAccordion,
  DBAccordionItem,
  DBBadge,
  DBButton,
  DBCheckbox,
  DBInput,
  DBNotification,
} from "@db-ux/react-core-components";
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
  pageName: string;
}

function StampingView({
  moduleId,
  moduleName,
  moduleDescription,
  sendMessage,
  onBack,
  initialVersion,
  hasCanvasSelection,
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

  const toggleGroup = (groupComponents: ComponentEntry[]) => {
    const groupIds = groupComponents.map((c) => c.id);
    const allSelected = groupIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of groupIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const groupedComponents = useMemo(() => {
    const groups = new Map<string, ComponentEntry[]>();
    for (const comp of components) {
      const group = groups.get(comp.pageName) ?? [];
      group.push(comp);
      groups.set(comp.pageName, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [components]);

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
      <div className="sticky top-0 z-10 bg-[var(--db-adaptive-bg-basic-level-1-default)] pb-fix-sm flex flex-col gap-fix-sm">
        <div>
          <DBButton icon="arrow_left" variant="ghost" onClick={onBack}>
            Back
          </DBButton>
          <h1 className="text-2xl">{moduleName}</h1>
          <p className="text-sm">{moduleDescription}</p>
        </div>

        <div className="flex gap-fix-sm items-start">
          <DBInput
            label="Release"
            placeholder="1.0"
            value={version}
            showLabel={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setVersion(e.target.value)
            }
            validation={hasInput && !isValid ? "invalid" : "no-validation"}
            invalidMessage="MAJOR.MINOR"
          />
          <DBButton
            variant="brand"
            disabled={!isValid || isRunning}
            onClick={stampAll}
            width="full"
          >
            Stamp All
          </DBButton>
          <DBButton
            variant="outlined"
            disabled={
              !isValid ||
              isRunning ||
              (selectedIds.size === 0 && !hasCanvasSelection)
            }
            width="full"
            onClick={() => {
              if (selectedIds.size > 0) {
                stampSelected();
              } else {
                pendingActionRef.current = "stamp-selection";
                setIsRunning(true);
                setResult(null);
                setProgress(null);
                sendMessage("stamp-selection", { version });
              }
            }}
          >
            {selectedIds.size > 0
              ? `Stamp ${selectedIds.size} component${selectedIds.size !== 1 ? "s" : ""}`
              : "Stamp Selection"}
          </DBButton>
        </div>
        <div className="flex gap-fix-sm">
          <DBButton
            variant="outlined"
            disabled={isRunning}
            onClick={loadComponents}
            width="full"
            size="small"
          >
            Select components
          </DBButton>
          <DBButton
            variant="outlined"
            disabled={isRunning}
            width="full"
            size="small"
            onClick={() => {
              pendingActionRef.current = "update-status";
              setIsRunning(true);
              setResult(null);
              sendMessage("update-status", {});
            }}
          >
            Update table
          </DBButton>
          <DBButton
            variant="outlined"
            disabled={isRunning}
            width="full"
            size="small"
            onClick={() => {
              pendingActionRef.current = "clear-all";
              setIsRunning(true);
              setResult(null);
              sendMessage("clear-all", {});
            }}
          >
            Delete all stamps
          </DBButton>
        </div>

        {showList && components.length > 0 && (
          <div className="flex items-center justify-between gap-fix-xs">
            <span className="text-sm font-semibold">
              {selectedIds.size} / {components.length} selected
            </span>
            <div className="flex gap-fix-xs">
              <DBButton
                variant="ghost"
                size="small"
                disabled={isRunning}
                onClick={detectChanged}
              >
                Select changed
              </DBButton>
              <DBButton variant="ghost" size="small" onClick={toggleAll}>
                {selectedIds.size === components.length
                  ? "Select none"
                  : "Select all"}
              </DBButton>
            </div>
          </div>
        )}
      </div>

      {showList && components.length > 0 && (
        <DBAccordion variant="divider" behavior="multiple">
          {groupedComponents.map(([pageName, groupComps]) => {
            const groupIds = groupComps.map((c) => c.id);
            const selectedInGroup = groupIds.filter((id) =>
              selectedIds.has(id),
            ).length;
            return (
              <DBAccordionItem
                key={pageName}
                headline={
                  <div className="flex items-center justify-between w-full gap-fix-xs">
                    <span>
                      <strong>{pageName}</strong> ({selectedInGroup}/
                      {groupComps.length})
                    </span>
                    <DBButton
                      variant="ghost"
                      size="small"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleGroup(groupComps);
                      }}
                    >
                      {selectedInGroup === groupComps.length
                        ? "Deselect all"
                        : "Select all"}
                    </DBButton>
                  </div>
                }
              >
                <div className="flex flex-col gap-fix-xs">
                  {groupComps.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-fix-xs text-sm"
                    >
                      <DBCheckbox
                        onChange={() => toggleComponent(comp.id)}
                        checked={selectedIds.has(comp.id)}
                        size="small"
                      >
                        {comp.name}
                      </DBCheckbox>
                      <span className="flex-1">
                        {comp.publishStatus === "SCANNING" && (
                          <span className="ml-1 text-xs opacity-60">⏳</span>
                        )}
                        {comp.publishStatus === "CHANGED" && (
                          <DBBadge semantic="warning">changed</DBBadge>
                        )}
                        {comp.publishStatus === "UNPUBLISHED" && (
                          <DBBadge semantic="successful">new</DBBadge>
                        )}
                      </span>
                      {comp.version && (
                        <span className="text-xs opacity-60">
                          v{comp.version}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </DBAccordionItem>
            );
          })}
        </DBAccordion>
      )}

      <div className="fixed top-fix-md right-fix-md z-50 w-72">
        {isRunning && (
          <DBNotification variant="overlay" semantic="informational">
            {progress
              ? `Stamping ${progress.processed} / ${progress.total}`
              : "Processing"}
            {/* {progress?.currentComponent} */}
          </DBNotification>
        )}

        {result && result.success && (
          <DBNotification
            variant="overlay"
            semantic="successful"
            closeable
            onClose={() => setResult(null)}
          >
            {resultMessage || `${stampedCount} components stamped`}
          </DBNotification>
        )}

        {errors.length > 0 && (
          <DBNotification
            variant="overlay"
            semantic="critical"
            closeable
            onClose={() => setResult(null)}
            headline={`${errors.length} Error${errors.length !== 1 ? "s" : ""}`}
          >
            {errors.map((err) => (
              <div key={err.componentId}>
                {err.componentName}: {err.message}
              </div>
            ))}
          </DBNotification>
        )}
      </div>
    </div>
  );
}

export default StampingView;
