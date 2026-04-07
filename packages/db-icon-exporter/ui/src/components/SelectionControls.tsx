/**
 * Selection control buttons for bulk operations.
 * Memoized to prevent unnecessary re-renders.
 */

import { memo } from "react";
import { DBTag } from "@db-ux/react-core-components";

interface SelectionControlsProps {
  selectedCount: number;
  totalCount: number;
  totalFilteredSets: number;
  onSelectAll: () => void;
  onSelectExportPage: () => void;
  onClearSelection: () => void;
}

export const SelectionControls = memo(function SelectionControls({
  selectedCount,
  totalCount,
  totalFilteredSets,
  onSelectAll,
  onSelectExportPage,
  onClearSelection,
}: SelectionControlsProps) {
  if (selectedCount === totalCount) {
    return (
      <div className="flex gap-fix-md">
        <DBTag>
          <button onClick={onClearSelection}>Clear selection</button>
        </DBTag>
      </div>
    );
  }

  if (selectedCount > 0) {
    return (
      <div className="flex gap-fix-md">
        <DBTag>
          <button onClick={onSelectAll}>Select all</button>
        </DBTag>
        <DBTag>
          <button onClick={onSelectExportPage}>Select Export-Page</button>
        </DBTag>
        <DBTag>
          <button onClick={onClearSelection}>Clear selection</button>
        </DBTag>
      </div>
    );
  }

  return (
    <div className="flex gap-fix-md">
      <DBTag>
        <button onClick={onSelectAll}>
          Select all icon sets ({totalFilteredSets})
        </button>
      </DBTag>
      <DBTag>
        <button onClick={onSelectExportPage}>Select Export-Page</button>
      </DBTag>
    </div>
  );
});
