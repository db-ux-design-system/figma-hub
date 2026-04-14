import { DBButton, DBCard, DBTag } from "@db-ux/react-core-components";
import type { MigrationMetadata, MigrationUIState } from "../types";
import ProgressIndicator from "./ProgressIndicator";

interface MigrationCardProps {
  metadata: MigrationMetadata;
  state: MigrationUIState;
  onAnalyze: () => void;
  onOpen: () => void;
}

const statusLabels: Record<MigrationUIState["status"], string> = {
  idle: "Nicht gestartet",
  analyzing: "Analyse läuft…",
  ready: "Bereit",
  migrating: "Migration läuft…",
  previewing: "Vorschau…",
  completed: "Abgeschlossen",
};

const MigrationCard = ({
  metadata,
  state,
  onAnalyze,
  onOpen,
}: MigrationCardProps) => {
  const isAutomatic = metadata.executionMode === "automatic";

  return (
    <DBCard data-density="functional" className="gap-fix-sm">
      <div className="flex items-center justify-between">
        <span className="font-bold">{metadata.title}</span>
        <DBTag>{isAutomatic ? "Automatisch" : "Halb-automatisch"}</DBTag>
      </div>
      <p className="text-sm">{metadata.description}</p>
      <span className="text-xs opacity-70">{statusLabels[state.status]}</span>

      {state.status === "analyzing" && state.progress && (
        <ProgressIndicator
          label="Nodes gescannt"
          current={state.progress.completed}
        />
      )}

      {state.error && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}

      <div className="flex gap-fix-sm">
        {state.status === "idle" && (
          <DBButton size="small" variant="outlined" onClick={onAnalyze}>
            Analyse starten
          </DBButton>
        )}
        {(state.status === "ready" || state.status === "completed") && (
          <DBButton size="small" onClick={onOpen}>
            Öffnen
          </DBButton>
        )}
      </div>
    </DBCard>
  );
};

export default MigrationCard;
