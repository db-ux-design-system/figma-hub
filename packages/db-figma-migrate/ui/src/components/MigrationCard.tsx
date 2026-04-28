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
  idle: "Not started",
  analyzing: "Analyzing…",
  ready: "Ready",
  migrating: "Migrating…",
  previewing: "Preview…",
  completed: "Completed",
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
        <DBTag>{isAutomatic ? "Automatic" : "Semi-automatic"}</DBTag>
      </div>
      <p className="text-sm">{metadata.description}</p>
      <span className="text-xs opacity-70">{statusLabels[state.status]}</span>
      {state.status === "analyzing" && state.progress && (
        <ProgressIndicator
          label="Nodes scanned"
          current={state.progress.completed}
        />
      )}
      {state.error && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}
      // TODO: Integrate information overlay with detailed scope of release
      version
      <div className="flex gap-fix-sm">
        {state.status === "idle" && (
          <DBButton size="small" variant="outlined" onClick={onAnalyze}>
            Start analysis
          </DBButton>
        )}
        {(state.status === "ready" || state.status === "completed") && (
          <>
            <DBButton size="small" onClick={onOpen}>
              Open
            </DBButton>
            <DBButton size="small" variant="outlined" onClick={onAnalyze}>
              Rescan
            </DBButton>
          </>
        )}
      </div>
    </DBCard>
  );
};

export default MigrationCard;
