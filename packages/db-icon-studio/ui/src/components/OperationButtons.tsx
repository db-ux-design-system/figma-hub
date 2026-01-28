/**
 * OperationButtons Component
 * Provides buttons for all plugin operations
 */

import { DBButton } from "@db-ux/react-core-components";

interface OperationButtonsProps {
  onConvertOutline: () => void;
  onApplyColors: () => void;
  onScale: () => void;
  onEditDescription: () => void;
  onRunAll: () => void;
  disabled: boolean;
}

export function OperationButtons(props: OperationButtonsProps) {
  return (
    <div className="operations">
      <h3>Operations</h3>

      <div className="button-group">
        <DBButton
          onClick={props.onConvertOutline}
          disabled={props.disabled}
          variant="secondary"
        >
          Flatten & Convert to Outline
        </DBButton>
      </div>

      <div className="button-group">
        <DBButton
          onClick={props.onApplyColors}
          disabled={props.disabled}
          variant="secondary"
        >
          Apply Color Variables
        </DBButton>
        <DBButton
          onClick={props.onScale}
          disabled={props.disabled}
          variant="secondary"
        >
          Add Scaled Sizes
        </DBButton>
      </div>

      <div className="button-group">
        <DBButton
          onClick={props.onEditDescription}
          disabled={props.disabled}
          variant="secondary"
        >
          Edit Description
        </DBButton>
      </div>

      <div className="button-group primary">
        <DBButton
          onClick={props.onRunAll}
          disabled={props.disabled}
          variant="primary"
        >
          Run All Operations
        </DBButton>
      </div>
    </div>
  );
}
