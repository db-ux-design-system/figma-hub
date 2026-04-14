import {
  DBButton,
  DBCard,
  DBInfotext,
  DBTag,
} from "@db-ux/react-core-components";
import type { MigrationUIState } from "../types";
import ProgressIndicator from "../components/ProgressIndicator";
import MigrationReportView from "../components/MigrationReport";
import GuidedMigrationView from "../components/GuidedMigration/GuidedMigrationView";

interface MigrationPageProps {
  state: MigrationUIState;
  onMigrateSingle: (migrationId: string, nodeId: string) => void;
  onMigrateBatch: (migrationId: string, nodeIds: string[]) => void;
  onPreview: (migrationId: string) => void;
  onDecision: (migrationId: string, nodeId: string, decision: unknown) => void;
  onNavigateToNode: (nodeId: string) => void;
  onBack: () => void;
}

const MigrationPage = ({
  state,
  onMigrateSingle,
  onMigrateBatch,
  onDecision,
  onNavigateToNode,
  onBack,
}: MigrationPageProps) => {
  const { metadata, nodes, versionWarnings, status, progress, report, error } =
    state;
  const isAutomatic = metadata.executionMode === "automatic";
  const isSemiAutomatic = metadata.executionMode === "semi-automatic";

  return (
    <div className="flex flex-col gap-fix-md">
      <DBButton size="small" variant="ghost" onClick={onBack}>
        ← Zurück
      </DBButton>

      <div className="flex items-center gap-fix-sm">
        <span className="font-bold text-lg">{metadata.title}</span>
        <DBTag>{isAutomatic ? "Automatisch" : "Halb-automatisch"}</DBTag>
      </div>
      <p className="text-sm">{metadata.description}</p>

      {/* Version warnings */}
      {versionWarnings.length > 0 && (
        <div className="flex flex-col gap-fix-xs">
          {versionWarnings.map((w) => (
            <DBInfotext
              key={w.nodeId}
              semantic={w.majorVersionGap > 1 ? "critical" : "warning"}
            >
              {w.nodeName}: Version {w.currentVersion ?? "unbekannt"} –{" "}
              {w.compatible
                ? "kompatibel"
                : `nicht kompatibel (Gap: ${w.majorVersionGap})`}
            </DBInfotext>
          ))}
        </div>
      )}

      {error && <DBInfotext semantic="critical">{error}</DBInfotext>}

      {/* Progress */}
      {status === "migrating" && progress && (
        <ProgressIndicator
          label="Migration"
          current={progress.completed}
          total={progress.total}
        />
      )}

      {/* Node list — shown for both automatic and semi-automatic */}
      {status === "ready" && nodes.length > 0 && (
        <div className="flex flex-col gap-fix-md">
          {/* Instructions */}
          <DBInfotext semantic="informational">
            <strong>Vorgehen:</strong> Aktualisiere zuerst die Instanzen manuell
            in Figma (Rechtsklick → „Update Instance" oder ↻). Klicke danach auf
            „Inhalte wiederherstellen", um die zwischengespeicherten Texte
            zurückzuschreiben.
          </DBInfotext>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">
              {nodes.length} Instanz(en) mit überschriebenen Texten
            </span>
            <DBButton
              size="small"
              onClick={() =>
                onMigrateBatch(
                  state.migrationId,
                  nodes.map((n) => n.id),
                )
              }
            >
              Alle wiederherstellen
            </DBButton>
          </div>

          {nodes.map((node) => (
            <DBCard
              key={node.id}
              data-density="functional"
              className="gap-fix-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{node.name}</span>
                <DBTag>{node.details.component ?? node.type}</DBTag>
              </div>
              <div className="flex flex-col gap-fix-2xs text-xs">
                {Object.entries(node.details)
                  .filter(
                    ([k]) => k !== "component" && k !== "mainComponentName",
                  )
                  .map(([k, v]) => (
                    <span key={k}>
                      <strong>{k}</strong>: „{v}"
                    </span>
                  ))}
              </div>
              <DBButton
                size="small"
                variant="outlined"
                onClick={() => onMigrateSingle(state.migrationId, node.id)}
              >
                Inhalte wiederherstellen
              </DBButton>
            </DBCard>
          ))}
        </div>
      )}

      {/* Semi-automatic: decision point */}
      {isSemiAutomatic && status === "migrating" && state.currentStep && (
        <GuidedMigrationView
          state={state}
          onDecision={(nodeId, decision) =>
            onDecision(state.migrationId, nodeId, decision)
          }
        />
      )}

      {/* Report */}
      {status === "completed" && report && (
        <MigrationReportView
          report={report}
          onNavigateToNode={onNavigateToNode}
        />
      )}

      {status === "ready" && nodes.length === 0 && !report && (
        <DBInfotext semantic="successful">
          Keine betroffenen Nodes gefunden.
        </DBInfotext>
      )}
    </div>
  );
};

export default MigrationPage;
