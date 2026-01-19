/**
 * SelectionStatus Component
 * Displays the current selection status and information
 */

import { DBInfotext, DBCard } from "@db-ui/react-components";
import type { SelectionInfo } from "../types";

interface SelectionStatusProps {
  info: SelectionInfo | null;
}

export function SelectionStatus({ info }: SelectionStatusProps) {
  if (!info) {
    return (
      <DBInfotext semantic="informational" icon="information">
        Loading selection...
      </DBInfotext>
    );
  }

  if (!info.isComponentSet) {
    return (
      <DBInfotext semantic="warning" icon="warning">
        No Component Set selected. Please select a Component Set.
      </DBInfotext>
    );
  }

  return (
    <DBCard>
      <div className="selection-info">
        <div className="info-row">
          <strong>Component Set:</strong> {info.componentSet?.name}
        </div>
        <div className="info-row">
          <strong>Variants:</strong> {info.variantCount}
        </div>
      </div>
    </DBCard>
  );
}
