/**
 * Export action buttons component (sticky at bottom).
 * Memoized to prevent unnecessary re-renders.
 */

import { memo } from "react";
import { DBButton } from "@db-ux/react-core-components";

interface ExportButtonsProps {
  selectedCount: number;
  hasVersion: boolean;
  onExportFull: () => void;
  onExportInfoOnly: () => void;
  onExportChangelogOnly: () => void;
}

export const ExportButtons = memo(function ExportButtons({
  selectedCount,
  hasVersion,
  onExportFull,
  onExportInfoOnly,
  onExportChangelogOnly,
}: ExportButtonsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 sticky bottom-0 border-t border-gray-200 p-4 bg-white">
      <div className="flex gap-fix-sm p-fix-md justify-item-end flex-row-reverse">
        <DBButton
          onClick={onExportFull}
          variant="brand"
          iconLeading="upload"
          showIcon
        >
          Full Export
        </DBButton>
        <DBButton onClick={onExportInfoOnly} variant="outlined">
          Only Description
        </DBButton>
        {hasVersion && (
          <DBButton onClick={onExportChangelogOnly} variant="outlined">
            Only Changelog
          </DBButton>
        )}
      </div>
    </div>
  );
});
