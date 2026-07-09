import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DBButton,
  DBCheckbox,
  DBInfotext,
  DBInput,
  DBNotification,
} from "@db-ux/react-core-components";
import { usePluginMessage } from "../../hooks/usePluginMessage";
import type {
  ModuleResult,
  ModuleViewProps,
  PluginToUIMessage,
  ProgressUpdate,
} from "../../types";

interface VersionEntry {
  id: string;
  label: string | null;
  description: string | null;
  created_at: string;
  user: { handle: string; img_url: string };
}

const PUBLISH_PATTERN = /components published|komponenten veröffentlicht/i;
const IGNORE_PATTERN = /^(ready for dev|completed|marked as ready)$/i;

function isMerge(v: VersionEntry): boolean {
  return !!v.label && !isPublish(v) && !isIgnored(v);
}

function isPublish(v: VersionEntry): boolean {
  return !!v.label && PUBLISH_PATTERN.test(v.label);
}

function isIgnored(v: VersionEntry): boolean {
  return !!v.label && IGNORE_PATTERN.test(v.label.trim());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function ChangelogView({
  moduleId,
  moduleName,
  moduleDescription,
  sendMessage,
  onBack,
  fileKey,
  documentName,
  isBranch,
  figmaToken,
  libraries = [],
}: ModuleViewProps) {
  const [allVersions, setAllVersions] = useState<
    Array<VersionEntry & { libraryName: string }>
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseNote, setReleaseNote] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState("");
  const [writeResult, setWriteResult] = useState<string | null>(null);
  const [changedByPage, setChangedByPage] = useState<Record<string, string[]>>(
    {},
  );
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ProgressUpdate | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasChangelogPage, setHasChangelogPage] = useState<boolean | null>(
    null,
  );

  // Check if Changelog page exists on mount
  useEffect(() => {
    sendMessage("check-page", {});
  }, [sendMessage]);

  // Auto-detect current library from file key
  const currentLibrary =
    libraries.find((lib) => lib.fileKey === fileKey) ?? null;
  const currentLibraryName = currentLibrary?.name ?? null;

  // Only fetch the current library's history
  const targetLibraries = currentLibrary ? [currentLibrary] : [];

  const handleMessage = useCallback(
    (msg: PluginToUIMessage) => {
      if (msg.module !== moduleId) return;
      if (msg.type === "progress") {
        setScanProgress(msg.data as ProgressUpdate);
      }
      if (msg.type === "result") {
        const res = msg.data as ModuleResult;
        if (res.success) {
          const data = res.data as Record<string, unknown>;
          if (data.hasChangelogPage !== undefined) {
            setHasChangelogPage(data.hasChangelogPage as boolean);
          } else if (data.changedByPage) {
            setChangedByPage(data.changedByPage as Record<string, string[]>);
            setScanning(false);
            setScanProgress(null);
          } else if (data.message) {
            setWriteResult(data.message as string);
          }
        } else {
          setError(res.errors?.[0]?.message ?? "Unknown error");
          setScanning(false);
          setScanProgress(null);
        }
      }
    },
    [moduleId],
  );

  usePluginMessage(handleMessage);

  const fetchHistory = async () => {
    if (!figmaToken || targetLibraries.length === 0) return;
    setLoading(true);
    setError(null);
    setReleaseNote(null);
    try {
      const results = await Promise.all(
        targetLibraries.map(async (lib) => {
          const res = await fetch(
            `https://api.figma.com/v1/files/${lib.fileKey}/versions`,
            { headers: { "X-Figma-Token": figmaToken } },
          );
          if (!res.ok) {
            throw new Error(`${lib.name}: API Error ${res.status}`);
          }
          const data = await res.json();
          const entries = (data.versions ?? []) as VersionEntry[];
          return entries
            .filter((v) => v.label && !IGNORE_PATTERN.test(v.label.trim()))
            .map((v) => ({ ...v, libraryName: lib.name }));
        }),
      );

      const merged = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      setAllVersions(merged);

      const autoSelected = new Set<string>();
      const seenPublishForLib = new Set<string>();
      for (const v of merged) {
        if (seenPublishForLib.has(v.libraryName)) continue;
        if (isPublish(v)) {
          seenPublishForLib.add(v.libraryName);
          continue;
        }
        if (isMerge(v)) autoSelected.add(v.id);
      }
      setSelectedIds(autoSelected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    }
    setLoading(false);
  };

  const { recentMerges, lastPublishByLib } = useMemo(() => {
    const merges: Array<VersionEntry & { libraryName: string }> = [];
    const pubByLib: Record<string, VersionEntry & { libraryName: string }> = {};
    const seenPublishForLib = new Set<string>();
    for (const v of allVersions) {
      if (seenPublishForLib.has(v.libraryName)) continue;
      if (isPublish(v)) {
        pubByLib[v.libraryName] = v;
        seenPublishForLib.add(v.libraryName);
        continue;
      }
      if (isMerge(v)) merges.push(v);
    }
    return { recentMerges: merges, lastPublishByLib: pubByLib };
  }, [allVersions]);

  const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateReleaseNote = () => {
    const selected = recentMerges.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0) return;

    const byLib = new Map<string, typeof selected>();
    for (const v of selected) {
      const list = byLib.get(v.libraryName) ?? [];
      list.push(v);
      byLib.set(v.libraryName, list);
    }

    const lines: string[] = [];
    for (const [libName, entries] of byLib) {
      if (byLib.size > 1) lines.push(`### ${libName}`);
      for (let i = 0; i < entries.length; i++) {
        const v = entries[i];
        const title = v.label?.trim();
        if (i > 0) lines.push("");
        lines.push(`**${title}**`);
        if (v.description) {
          for (const line of v.description.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // If the line already starts with a bullet, keep it as-is
            if (/^[-–•*]/.test(trimmed)) {
              lines.push(trimmed);
            } else {
              lines.push(`- ${trimmed}`);
            }
          }
        }
      }
      if (byLib.size > 1) lines.push("");
    }
    setReleaseNote(lines.join("\n"));
  };

  const releaseNoteWithComponents = useMemo(() => {
    if (!releaseNote) return null;
    const pages = Object.entries(changedByPage).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    if (pages.length === 0) return releaseNote;
    const lines = [releaseNote, "", "Affected components:"];
    for (const [page, components] of pages) {
      lines.push(`- ${page}: ${components.join(", ")}`);
    }
    return lines.join("\n");
  }, [releaseNote, changedByPage]);

  return (
    <div className="flex flex-col gap-fix-md">
      <div className="sticky top-0 z-10 bg-[var(--db-adaptive-bg-basic-level-1-default)] pb-fix-sm flex flex-col gap-fix-sm">
        <div>
          <DBButton icon="arrow_left" variant="ghost" onClick={onBack}>
            Back
          </DBButton>
          <h1 className="text-2xl">{moduleName}</h1>
          <p className="text-sm">{moduleDescription}</p>
          {(documentName || currentLibraryName) && (
            <p className="text-xs opacity-60">
              Current file: {documentName ?? currentLibraryName}
            </p>
          )}
        </div>

        {!figmaToken && (
          <DBInfotext semantic="warning">
            No API token configured. Go back and set it in Settings.
          </DBInfotext>
        )}

        {isBranch && (
          <DBInfotext semantic="warning">
            Du befindest dich in einem Branch. Das Changelog sollte nur in der
            Main-Datei geschrieben werden.
          </DBInfotext>
        )}

        <DBButton
          variant="outlined"
          disabled={!figmaToken || targetLibraries.length === 0 || loading}
          onClick={fetchHistory}
          width="full"
        >
          {loading ? "Loading…" : "Load Version History"}
        </DBButton>
      </div>

      {error && (
        <div className="fixed top-fix-md left-fix-md right-fix-md z-50">
          <DBNotification
            variant="overlay"
            semantic="critical"
            closeable
            onClose={() => setError(null)}
          >
            {error}
          </DBNotification>
        </div>
      )}

      {recentMerges.length > 0 && (
        <div className="flex flex-col gap-fix-sm">
          <p className="text-sm font-semibold">
            {recentMerges.length} merge{recentMerges.length !== 1 ? "s" : ""}{" "}
            since last publish
          </p>

          {Object.entries(lastPublishByLib).length > 0 && (
            <div className="flex flex-col gap-fix-2xs text-xs opacity-60">
              {Object.entries(lastPublishByLib).map(([lib, pub]) => (
                <span key={lib}>
                  {lib}: {pub.description ?? pub.label} (
                  {formatDate(pub.created_at)})
                </span>
              ))}
            </div>
          )}

          {recentMerges.map((v) => (
            <div key={v.id} className="flex flex-col gap-fix-2xs text-sm">
              <div className="flex items-center gap-fix-xs">
                <DBCheckbox
                  checked={selectedIds.has(v.id)}
                  onChange={() => toggleEntry(v.id)}
                  size="small"
                >
                  {libraries.length > 1 && targetLibraries.length > 1 && (
                    <span className="opacity-50">[{v.libraryName}] </span>
                  )}
                  {v.label}
                </DBCheckbox>
                <span className="flex-1" />
                <span className="text-xs opacity-40 whitespace-nowrap">
                  {formatDate(v.created_at)}
                </span>
              </div>
              {v.description && (
                <div className="text-xs opacity-60 m-0 ml-fix-lg">
                  {v.description.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    const isBullet = /^[-–•*]\s*/.test(trimmed);
                    if (isBullet) {
                      return (
                        <div key={i} className="flex gap-fix-2xs">
                          <span>•</span>
                          <span>{trimmed.replace(/^[-–•*]\s*/, "")}</span>
                        </div>
                      );
                    }
                    return <div key={i}>{trimmed}</div>;
                  })}
                </div>
              )}
            </div>
          ))}

          <DBButton
            variant="brand"
            disabled={selectedIds.size === 0}
            onClick={generateReleaseNote}
            width="full"
          >
            Generate Release Note ({selectedIds.size})
          </DBButton>
        </div>
      )}

      {releaseNoteWithComponents && (
        <div className="flex flex-col gap-fix-sm">
          <p className="text-sm font-semibold">
            Release Note
            {scanning && (
              <span className="opacity-60"> — scanning components</span>
            )}
          </p>
          <pre className="text-sm whitespace-pre-wrap border rounded p-fix-sm bg-[var(--db-adaptive-bg-basic-level-2-default)]">
            {releaseNoteWithComponents}
          </pre>
          {hasChangelogPage && (
            <div className="flex gap-fix-sm items-end">
              <DBInput
                label="Version (e.g. 4.2.0)"
                placeholder="4.2.0"
                value={versionInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setVersionInput(e.target.value)
                }
                validation={
                  versionInput.length > 0 &&
                  !/^\d+\.\d+\.\d+$/.test(versionInput.trim())
                    ? "invalid"
                    : "no-validation"
                }
                invalidMessage="MAJOR.MINOR.PATCH"
              />
              <DBButton
                variant="brand"
                disabled={
                  !/^\d+\.\d+\.\d+$/.test(versionInput.trim()) || scanning
                }
                onClick={() => {
                  const now = new Date();
                  const date = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
                  sendMessage("write-entry", {
                    title: `${currentLibraryName ?? "Core"} – v${versionInput.trim()}`,
                    date,
                    body: releaseNoteWithComponents,
                  });
                }}
              >
                Write to Changelog
              </DBButton>
            </div>
          )}
          <DBButton
            variant="outlined"
            size="small"
            onClick={() => {
              const el = document.createElement("textarea");
              el.value = releaseNoteWithComponents;
              document.body.appendChild(el);
              el.select();
              document.execCommand("copy");
              document.body.removeChild(el);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "✓ Copied" : "Copy to clipboard"}
          </DBButton>
        </div>
      )}

      {writeResult && (
        <div className="fixed top-fix-md left-fix-md right-fix-md z-50">
          <DBNotification
            variant="overlay"
            semantic="successful"
            closeable
            onClose={() => setWriteResult(null)}
          >
            {writeResult}
          </DBNotification>
        </div>
      )}

      {scanning && (
        <div className="fixed top-fix-md left-fix-md right-fix-md z-50">
          <DBNotification variant="overlay" semantic="informational">
            {scanProgress
              ? `Scanning ${scanProgress.processed} / ${scanProgress.total}`
              : "Scanning components"}
          </DBNotification>
        </div>
      )}

      {allVersions.length > 0 && recentMerges.length === 0 && (
        <DBInfotext semantic="informational">
          No merges since last publish.
        </DBInfotext>
      )}

      {allVersions.length === 0 &&
        !loading &&
        !error &&
        figmaToken &&
        libraries.length > 0 && (
          <DBInfotext semantic="informational">
            Click "Load Version History" to fetch entries.
          </DBInfotext>
        )}

      {libraries.length === 0 && !loading && (
        <DBInfotext semantic="warning">No libraries configured.</DBInfotext>
      )}

      {targetLibraries.length === 0 && libraries.length > 0 && !loading && (
        <DBInfotext semantic="warning">
          This file is not a known library.
        </DBInfotext>
      )}
    </div>
  );
}

export default ChangelogView;
