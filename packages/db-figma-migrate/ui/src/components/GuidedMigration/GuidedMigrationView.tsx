import { DBInfotext } from "@db-ux/react-core-components";
import type { MigrationUIState } from "../../types";
import ProgressIndicator from "../ProgressIndicator";
import DecisionPoint from "./DecisionPoint";

interface GuidedMigrationViewProps {
  state: MigrationUIState;
  onDecision: (nodeId: string, decision: unknown) => void;
}

const GuidedMigrationView = ({
  state,
  onDecision,
}: GuidedMigrationViewProps) => {
  const { currentStep, decisionOptions, decisionNodeId, progress } = state;

  if (!currentStep) {
    return (
      <DBInfotext semantic="informational">Waiting for next step…</DBInfotext>
    );
  }

  return (
    <div className="flex flex-col gap-fix-sm">
      <span className="font-bold">{currentStep.title}</span>
      <p className="text-sm">{currentStep.description}</p>

      {progress && (
        <ProgressIndicator
          label="Progress"
          current={progress.completed}
          total={progress.total}
        />
      )}

      {currentStep.type === "decision" && decisionOptions && decisionNodeId && (
        <DecisionPoint
          options={decisionOptions}
          onSelect={(value) => onDecision(decisionNodeId, value)}
        />
      )}

      {currentStep.type === "action" && (
        <DBInfotext semantic="informational">
          Automatic step is being executed…
        </DBInfotext>
      )}
    </div>
  );
};

export default GuidedMigrationView;
