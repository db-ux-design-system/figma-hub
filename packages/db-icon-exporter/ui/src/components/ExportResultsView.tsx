// components/ExportResultsView.tsx
import { DBButton, DBTextarea } from "@db-ux/react-core-components";

interface ExportResultsViewProps {
  mode: "full" | "info-only";
  gitlabJsonSelected: string;
  gitlabJsonAll: string;
  marketingCsv: string;
  onBack: () => void;
  onCopy: (text: string, label: string) => void;
}

export const ExportResultsView = ({
  mode,
  gitlabJsonSelected,
  gitlabJsonAll,
  marketingCsv,
  onBack,
  onCopy,
}: ExportResultsViewProps) => {
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
            {mode === "full" ? "Full" : "Info Only"} Export done
          </h1>
        </div>
      </header>

      {/* Scrollbarer Content */}
      <div className="flex-1 p-4 space-y-6 gap-fix-md p-fix-md">
        {/* GitLab Descriptions - Selected Icons */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                📄 GitLab Descriptions (Selected Icons)
              </p>
            </div>
            <DBButton
              size="small"
              showIcon
              icon="copy"
              variant="filled"
              onClick={() =>
                onCopy(gitlabJsonSelected, "GitLab Descriptions (Selected)")
              }
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label="GitLab Descriptions (Selected)"
            showLabel={false}
            value={gitlabJsonSelected}
            readOnly
          ></DBTextarea>
        </div>

        {/* GitLab Descriptions - ALL Icons */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                📄 GitLab Descriptions (All Icons)
              </p>
            </div>
            <DBButton
              size="small"
              showIcon
              icon="copy"
              variant="filled"
              onClick={() => onCopy(gitlabJsonAll, "GitLab Descriptions (All)")}
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label="GitLab Descriptions (All)"
            showLabel={false}
            value={gitlabJsonAll}
            readOnly
          ></DBTextarea>
        </div>

        {/* Marketing Portal CSV */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                📊 Marketing Portal Code (All Icons)
              </p>
            </div>
            <DBButton
              size="small"
              variant="filled"
              showIcon
              icon="copy"
              onClick={() => onCopy(marketingCsv, "Marketing Portal CSV")}
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label="Marketing Portal CSV"
            showLabel={false}
            value={marketingCsv}
            readOnly
          ></DBTextarea>
        </div>
      </div>
    </div>
  );
};
