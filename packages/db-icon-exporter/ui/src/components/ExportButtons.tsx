// components/ExportButtons.tsx
import { DBButton } from "@db-ux/react-core-components";

interface ExportButtonsProps {
  selectedIconsCount: number;
  hasVersion: boolean;
  onExportFull: () => void;
  onExportInfoOnly: () => void;
  onExportChangelogOnly: () => void;
}

export const ExportButtons = ({
  selectedIconsCount,
  hasVersion,
  onExportFull,
  onExportInfoOnly,
  onExportChangelogOnly,
}: ExportButtonsProps) => {
  if (selectedIconsCount === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 sticky bottom-0 border-t border-gray-200 p-4 bg-white">
      <div className="flex gap-fix-sm p-fix-md">
        <DBButton onClick={onExportFull} variant="primary">
          📦 Vollständig exportieren (Assets + Infos)
        </DBButton>
        <DBButton onClick={onExportInfoOnly} variant="secondary">
          📋 Nur Infos exportieren
        </DBButton>
        {hasVersion && (
          <DBButton onClick={onExportChangelogOnly} variant="secondary">
            📝 Nur Changelog erstellen
          </DBButton>
        )}
      </div>
    </div>
  );
};
