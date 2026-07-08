// components/SelectedIconsPanel.tsx
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

interface SelectedIconsPanelProps {
  selectedIcons: SelectedIcon[];
  selectAllStatus: ChangelogStatus | null;
  getIconSetName: (iconName: string) => string;
  onSetAllIconsToStatus: (status: ChangelogStatus) => void;
  onUpdateIconStatus: (iconId: string, status: ChangelogStatus) => void;
}

export const SelectedIconsPanel = ({
  selectedIcons,
  selectAllStatus,
  getIconSetName,
  onSetAllIconsToStatus,
  onUpdateIconStatus,
}: SelectedIconsPanelProps) => {
  if (selectedIcons.length === 0) {
    return null;
  }

  const allStatuses: ChangelogStatus[] = [
    "feat",
    "fix",
    "refactor",
    "docs",
    "chore",
    "deprecated",
  ];

  return (
    <div className="p-4 pb-32 border-t border-gray-200 pb-fix-sm">
      <h4 className="text-sm mb-0">
        Ausgewählt: {selectedIcons.length} Icon-Sets
      </h4>

      {/* Header mit "Select All" für jeden Status */}
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
                  onChange={() => onSetAllIconsToStatus(s)}
                />
                {statusConfig[s].emoji} {statusConfig[s].label}
              </label>
            </DBTag>
          ))}
        </div>
      </div>

      {/* Border unter Select All */}
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
                        onChange={() => onUpdateIconStatus(icon.id, s)}
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
};
