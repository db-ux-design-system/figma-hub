import { DBButton, DBCard, DBInfotext } from "@db-ux/react-core-components";
import type { MigrationNodeResult, MigrationUIState } from "../types";
import ProgressIndicator from "./ProgressIndicator";

interface PreviewViewProps {
  state: MigrationUIState;
  onStartPreview: () => void;
}

const PreviewView = ({ state, onStartPreview }: PreviewViewProps) => {
  const isPreviewing = state.status === "previewing";
  const changes = state.previewChanges;

  return (
    <div className="flex flex-col gap-fix-sm">
      <DBButton
        size="small"
        variant="outlined"
        onClick={onStartPreview}
        disabled={isPreviewing}
      >
        Vorschau
      </DBButton>

      {isPreviewing && state.progress && (
        <ProgressIndicator
          label="Vorschau"
          current={state.progress.completed}
          total={state.progress.total}
        />
      )}

      {changes && changes.length > 0 && (
        <div className="flex flex-col gap-fix-xs">
          <span className="text-sm font-bold">Geplante Änderungen:</span>
          {changes.map((c: MigrationNodeResult) => (
            <DBCard key={c.nodeId} data-density="functional">
              <span className="text-sm">
                {c.nodeId}: {c.description}
              </span>
            </DBCard>
          ))}
        </div>
      )}

      {changes && changes.length === 0 && (
        <DBInfotext semantic="informational">
          Keine Änderungen geplant.
        </DBInfotext>
      )}
    </div>
  );
};

export default PreviewView;
