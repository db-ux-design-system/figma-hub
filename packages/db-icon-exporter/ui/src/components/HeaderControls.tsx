// components/HeaderControls.tsx
import { DBInput, DBTag } from "@db-ux/react-core-components";

interface HeaderControlsProps {
  iconType: string;
  versionNumber: string;
  searchTerm: string;
  selectedIconsCount: number;
  totalIconSets: number;
  totalFilteredSets: number;
  onVersionChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectFromExportPage: () => void;
  onClearSelection: () => void;
}

export const HeaderControls = ({
  iconType,
  versionNumber,
  searchTerm,
  selectedIconsCount,
  totalIconSets,
  totalFilteredSets,
  onVersionChange,
  onSearchChange,
  onSelectAll,
  onSelectFromExportPage,
  onClearSelection,
}: HeaderControlsProps) => {
  return (
    <header className="flex-shrink-0 border-b border-gray-100 gap-fix-md p-fix-md">
      <h1 className="text-xl my-fix-sm">
        DB Theme {iconType || "Unbekannt"} Icon Exporter
      </h1>

      <div className="flex gap-fix-sm mb-fix-sm">
        <DBInput
          label="Version (optional)"
          placeholder="z.B. 1.2.4"
          value={versionNumber}
          onInput={(e: React.FormEvent<HTMLInputElement>) => {
            onVersionChange(e.currentTarget.value);
          }}
          className="w-32"
        />
        <DBInput
          label="Filter Icons"
          placeholder=""
          value={searchTerm}
          onInput={(e: React.FormEvent<HTMLInputElement>) => {
            onSearchChange(e.currentTarget.value);
          }}
          className="flex-1"
        />
      </div>

      <div className="flex gap-fix-md">
        {selectedIconsCount === totalIconSets ? (
          <DBTag>
            <button onClick={onClearSelection}>Clear selection</button>
          </DBTag>
        ) : selectedIconsCount > 0 ? (
          <>
            <DBTag>
              <button onClick={onSelectAll}>Select all</button>
            </DBTag>
            <DBTag>
              <button onClick={onSelectFromExportPage}>
                Select Export-Page
              </button>
            </DBTag>
            <DBTag>
              <button onClick={onClearSelection}>Clear selection</button>
            </DBTag>
          </>
        ) : (
          <>
            <DBTag>
              <button onClick={onSelectAll}>
                Select all icon sets ({totalFilteredSets})
              </button>
            </DBTag>
            <DBTag>
              <button onClick={onSelectFromExportPage}>
                Select Export-Page
              </button>
            </DBTag>
          </>
        )}
      </div>
    </header>
  );
};
