/**
 * Status panel component for managing changelog status of selected icons.
 * Memoized to prevent unnecessary re-renders.
 */

import { memo } from "react";
import { DBTag } from "@db-ux/react-core-components";
import { SelectedIcon, ChangelogStatus } from "../types";

const statusConfig = {
  feat: { emoji: "⭐️", label: "feat" },
  fix: { emoji: "🪲", label: "fix" },
  refactor: { emoji: "🔁", label: "refactor" },
  docs: { emoji: "📝", label: "docs" },
  chore: { emoji: "🔧", label: "chore" },
  deprecated: { emoji: "⚠️", label: "deprecated" },
};

const allStatuses: ChangelogStatus[] = [
  "feat",
  "fix",
  "refactor",
  "docs",
  "chore",
  "deprecated",
];

interface StatusPanelProps {
  selectedIcons: SelectedIcon[];
  selectAllStatus: ChangelogStatus | null;
  getIconSetName: (iconName: string) => string;
  onStatusChange: (iconId: string, status: ChangelogStatus) => void;
  onBulkStatusChange: (status: ChangelogStatus) => void;
}

export const StatusPanel = memo(function StatusPanel({
  selectedIcons,
  selectAllStatus,
  getIconSetName,
  onStatusChange,
  onBulkStatusChange,
}: StatusPanelProps) {
  if (selectedIcons.length === 0) {
    return null;
  }

  return (
    <div className="p-4 pb-32 border-t border-gray-200 pb-fix-sm">
      <h4 className="text-sm mb-0">
        Selected: {selectedIcons.length} icon set
        {selectedIcons.length > 1 ? "s" : ""}
      </h4>

      {/* Header with "Select All" for each status */}
      <div className="flex gap-fix-xs mb-fix-sm mt-fix-sm">
        <p className="text-sm my-fix-xs w-1/4 font-semibold">Select all</p>
        <div className="flex w-3/4 gap-fix-sm items-center">
          {allStatuses.map((s) => (
            <DBTag key={`select-all-${s}`} showCheckState={false}>
              <label htmlFor={`select-all-${s}`}>
                <input
                  type="radio"
                  name="select-all-status"
                  id={`select-all-${s}`}
                  value={s}
                  checked={selectAllStatus === s}
                  onChange={() => onBulkStatusChange(s)}
                />
                {statusConfig[s].emoji} {statusConfig[s].label}
              </label>
            </DBTag>
          ))}
        </div>
      </div>

      {/* Border under Select All */}
      <div className="border-t border-gray-200 mb-fix-sm"></div>

      <div className="space-y-3 gap-fix-sm">
        {selectedIcons.map(({ icon, status }) => {
          const setName = getIconSetName(icon.name);
          return (
            <div className="flex gap-fix-xs" key={icon.id}>
              <p className="text-sm my-fix-xs w-1/4">{setName}</p>
              <div className="flex w-3/4 gap-fix-sm items-center">
                {allStatuses.map((s) => (
                  <DBTag showCheckState={false} key={`${icon.id}-${s}`}>
                    <label htmlFor={`status-${icon.id}-${s}`}>
                      <input
                        type="radio"
                        name={`status-${icon.id}`}
                        id={`status-${icon.id}-${s}`}
                        value={s}
                        checked={status === s}
                        onChange={() => onStatusChange(icon.id, s)}
                      />
                      {statusConfig[s].emoji} {statusConfig[s].label}
                    </label>
                  </DBTag>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
