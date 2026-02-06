/**
 * Export screen component showing export results.
 */

import { DBButton, DBTextarea } from "@db-ux/react-core-components";
import { ExportData } from "../types";
import { PackageSection } from "./PackageSection";

interface ExportScreenProps {
  exportData: ExportData;
  onBack: () => void;
  onCopy: (content: string, label: string) => void;
}

export function ExportScreen({
  exportData,
  onBack,
  onCopy,
}: ExportScreenProps) {
  if (!exportData.mode) {
    return (
      <div className="p-4">
        <p className="text-sm">⏳ Generating export data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex-shrink-0 p-4 gap-fix-md p-fix-md pb-0">
        <div className="flex items-center gap-fix-xl mb-fix-sm">
          <DBButton
            icon="arrow_left"
            showIcon
            noText
            variant="ghost"
            onClick={onBack}
          >
            Back
          </DBButton>
          <h1 className="text-xl my-fix-sm">
            {exportData.mode === "full" ? "Full" : "Info Only"} Export done
          </h1>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 p-4 space-y-6 gap-fix-md p-fix-md overflow-y-auto">
        {/* GitLab Descriptions - Group by package, show Selected and All side-by-side */}
        {Object.keys(exportData.gitlabJsonSelected).map((filename) => {
          const selectedContent = exportData.gitlabJsonSelected[filename];
          const allContent = exportData.gitlabJsonAll[filename];
          const packageName = filename.replace(".json", "");

          return (
            <PackageSection
              key={`package-${filename}`}
              packageName={packageName}
              selectedContent={selectedContent}
              allContent={allContent}
              onCopy={onCopy}
            />
          );
        })}

        {/* Marketing Portal CSV */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-fix-sm">
            <h6>📊 Marketing Portal Code (All Icons)</h6>

            <DBButton
              size="small"
              variant="filled"
              showIcon
              icon="copy"
              onClick={() =>
                onCopy(exportData.marketingCsv, "Marketing Portal CSV")
              }
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label="Marketing Portal CSV"
            showLabel={false}
            value={exportData.marketingCsv}
            readOnly
          ></DBTextarea>
        </div>
      </div>
    </div>
  );
}
