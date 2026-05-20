import { useCallback, useMemo, useState } from "react";
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
} from "../../types";

interface VersionEntry {
  id: string;
  label: string | null;
  description: string | null;
  created_at: string;
  user: { handle: string; img_url: string };
}

const PUBLISH_PATTERN = /components published|komponenten veröffentlicht/i;
const VERSION_BUMP_PATTERN = /^version[\s\-_]*bump/i;

function isMerge(v: VersionEntry): boolean {
  return !!v.label && !isPublish(v) && !isVersionBump(v);
}

function isPublish(v: VersionEntry): boolean {
  return !!v.label && PUBLISH_PATTERN.test(v.label);
}

function isVersionBump(v: VersionEntry): boolean {
  return !!v.label && VERSION_BUMP_PATTERN.test(v.label.trim());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/**
 * Extracts the version string from a version bump label or changelog entry title.
 * e.g. "version bump v4.8.0" → "4.8.0", "Core – v4.7.0" → "4.7.0"
 */
function extractVersion(text: string): string | null {
  const match = text.match(/v?(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

interface LibraryConfig {
  changelogTitle: string;
  versionPrefix: string;
}

const LIBRARY_CONFIG: Record<string, LibraryConfig> = {
  HiaxnfH92ilbE4gfboFMA0: {
    changelogTitle: "Core Foundation",
    versionPrefix: "v",
  },
  mlJ6R0GkfR15a93KSlqXtB: { changelogTitle: "Core", versionPrefix: "v" },
  jS7unqZw51v07eYyXR6qP0: {
    changelogTitle: "🧪 Core Lab",
    versionPrefix: "lab",
  },
};

function getLibraryConfig(fileKey?: string): LibraryConfig {
  if (fileKey && LIBRARY_CONFIG[fileKey]) return LIBRARY_CONFIG[fileKey];
  return { changelogTitle: "Core", versionPrefix: "v" };
}

function ChangelogView({
  moduleId,
  moduleName,
  moduleDescription,
  sendMessage,
  onBack,
  fileKey,
  figmaToken,
}: ModuleViewProps) {
  const libConfig = getLibraryConfig(fileKey);
  const [allVersions, setAllVersions] = useState<VersionEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseNote, setReleaseNote] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState("");
  const [writeResult, setWriteResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastEntryTitle, setLastEntryTitle] = useState<string | null>(null);

  const handleMessage = useCallback(
    (msg: PluginToUIMessage) => {
      if (msg.module !== moduleId) return;

      if (msg.type === "result") {
        const res = msg.data as ModuleResult;
        if (res.success) {
          const data = res.data as Record<string, unknown>;
          if (data.lastEntryTitle !== undefined) {
            setLastEntryTitle(data.lastEntryTitle as string | null);
          } else if (data.message) {
            setWriteResult(data.message as string);
          }
        } else {
          setError(res.errors?.[0]?.message ?? "Unknown error");
        }
      }
    },
    [moduleId],
  );

  usePluginMessage(handleMessage);

  const fetchHistory = async () => {
    if (!fileKey || !figmaToken) return;
    setLoading(true);
    setError(null);
    setReleaseNote(null);

    // Read last changelog entry from the artboard
    sendMessage("read-last-entry", {});

    try {
      // Fetch all pages until we find a publish/version bump or run out of pages
      let allEntries: VersionEntry[] = [];
      let nextPage: string | undefined = undefined;
      let foundStop = false;

      do {
        const url = nextPage
          ? nextPage
          : `https://api.figma.com/v1/files/${fileKey}/versions`;
        const res = await fetch(url, {
          headers: { "X-Figma-Token": figmaToken },
        });
        if (!res.ok) {
          setError(`API Error ${res.status}: ${await res.text()}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const entries = (data.versions ?? []) as VersionEntry[];
        allEntries = allEntries.concat(entries);

        // Check if we've found a stopping point (publish or version bump)
        const labeled = entries.filter((v) => v.label);
        for (const v of labeled) {
          if (isPublish(v) || isVersionBump(v)) {
            foundStop = true;
            break;
          }
        }

        nextPage = data.pagination?.next_page ?? undefined;
      } while (!foundStop && nextPage);

      // Keep only labeled entries
      const labeled = allEntries.filter((v) => v.label);
      setAllVersions(labeled);

      // Auto-select: all merges before the first publish or version bump
      const autoSelected = new Set<string>();
      for (const v of labeled) {
        if (isPublish(v) || isVersionBump(v)) break;
        if (isMerge(v)) autoSelected.add(v.id);
      }
      setSelectedIds(autoSelected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    }
    setLoading(false);
  };

  // Collect all version bumps that are missing from the changelog artboard
  const { recentMerges, missingBumps } = useMemo(() => {
    const merges: VersionEntry[] = [];
    const bumps: VersionEntry[] = [];
    const lastVersion = lastEntryTitle ? extractVersion(lastEntryTitle) : null;

    for (const v of allVersions) {
      if (isPublish(v)) break;
      if (isVersionBump(v)) {
        // Check if this bump is already in the changelog
        const bumpVer = v.label ? extractVersion(v.label) : null;
        if (bumpVer && lastVersion && bumpVer === lastVersion) {
          // This bump matches the last changelog entry — stop here
          break;
        }
        bumps.push(v);
      } else if (isMerge(v)) {
        merges.push(v);
      }
    }
    return { recentMerges: merges, missingBumps: bumps };
  }, [allVersions, lastEntryTitle]);

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

    const lines: string[] = [];
    for (const v of selected) {
      const title = v.label?.trim();
      lines.push(`- ${title}`);
      if (v.description) {
        for (const line of v.description.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // If the line already starts with a list marker, just indent it
          if (/^[-•*]/.test(trimmed)) {
            lines.push(`  ${trimmed}`);
          } else {
            lines.push(`  - ${trimmed}`);
          }
        }
      }
    }
    setReleaseNote(lines.join("\n"));
  };

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

        {!figmaToken && (
          <DBInfotext semantic="warning">
            No API token configured. Go back and set it in Settings.
          </DBInfotext>
        )}

        <DBButton
          variant="brand"
          disabled={!figmaToken || !fileKey || loading}
          onClick={fetchHistory}
          width="full"
        >
          {loading ? "Loading…" : "Load Version History"}
        </DBButton>
      </div>

      {error && (
        <div className="fixed top-fix-md right-fix-md z-50 w-72">
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

      {(recentMerges.length > 0 || missingBumps.length > 0) && (
        <div className="flex flex-col gap-fix-sm">
          {lastEntryTitle && (
            <DBInfotext
              semantic={missingBumps.length === 0 ? "successful" : "warning"}
            >
              Last Changelog entry: {lastEntryTitle}
            </DBInfotext>
          )}

          {missingBumps.length > 0 && (
            <div className="flex flex-col gap-fix-xs">
              <p className="text-sm font-semibold">Missing in Changelog:</p>
              {missingBumps.map((v) => {
                const bumpVer = v.label ? extractVersion(v.label) : null;
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm px-fix-xs py-fix-2xs rounded bg-[var(--db-adaptive-bg-basic-level-2-default)]"
                  >
                    <span className="font-medium">{v.label}</span>
                    <div className="flex items-center gap-fix-xs">
                      <span className="text-xs opacity-40">
                        {formatDate(v.created_at)}
                      </span>
                      <DBButton
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          sendMessage("write-entry", {
                            title: `${libConfig.changelogTitle} – ${libConfig.versionPrefix}${bumpVer ?? v.label?.replace(VERSION_BUMP_PATTERN, "").trim()}`,
                            date: formatDate(v.created_at),
                            body: "- version bump",
                          });
                        }}
                      >
                        Write
                      </DBButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {recentMerges.length > 0 && (
            <>
              <p className="text-sm font-semibold">
                {recentMerges.length} merge
                {recentMerges.length !== 1 ? "s" : ""} since last version
              </p>

              {recentMerges.map((v) => (
                <div key={v.id} className="flex flex-col gap-fix-2xs text-sm">
                  <div className="flex items-center gap-fix-xs">
                    <DBCheckbox
                      checked={selectedIds.has(v.id)}
                      onChange={() => toggleEntry(v.id)}
                      size="small"
                    >
                      {v.label}
                    </DBCheckbox>
                    <span className="flex-1" />
                    <span className="text-xs opacity-40 whitespace-nowrap">
                      {formatDate(v.created_at)}
                    </span>
                  </div>
                  {v.description && (
                    <p className="text-xs opacity-60 pl-[28px] whitespace-pre-line">
                      {v.description}
                    </p>
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
            </>
          )}
        </div>
      )}

      {releaseNote && (
        <div className="flex flex-col gap-fix-sm">
          <p className="text-sm font-semibold">Release Note</p>
          <pre className="text-sm whitespace-pre-wrap border rounded p-fix-sm bg-[var(--db-adaptive-bg-basic-level-2-default)]">
            {releaseNote}
          </pre>
          <div className="flex gap-fix-sm items-end">
            <DBInput
              label="Version (e.g. 4.2.0)"
              placeholder="4.2.0"
              value={versionInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setVersionInput(e.target.value)
              }
            />
            <DBButton
              variant="brand"
              disabled={!versionInput.trim()}
              onClick={() => {
                const now = new Date();
                const date = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
                sendMessage("write-entry", {
                  title: `${libConfig.changelogTitle} – ${libConfig.versionPrefix}${versionInput.trim()}`,
                  date,
                  body: releaseNote,
                });
              }}
            >
              Write to Changelog
            </DBButton>
          </div>
          <DBButton
            variant="outlined"
            size="small"
            onClick={() => {
              const el = document.createElement("textarea");
              el.value = releaseNote;
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
        <div className="fixed top-fix-md right-fix-md z-50 w-72">
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

      {allVersions.length > 0 &&
        recentMerges.length === 0 &&
        missingBumps.length === 0 && (
          <DBInfotext semantic="informational">
            No merges since last publish.
          </DBInfotext>
        )}

      {allVersions.length === 0 &&
        !loading &&
        !error &&
        figmaToken &&
        fileKey && (
          <DBInfotext semantic="informational">
            Click "Load Version History" to fetch entries.
          </DBInfotext>
        )}
    </div>
  );
}

export default ChangelogView;
