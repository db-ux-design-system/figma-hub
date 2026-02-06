/**
 * Package section component showing GitLab JSON for selected and all icons.
 */

import { DBButton, DBTextarea } from "@db-ux/react-core-components";

interface PackageSectionProps {
  packageName: string;
  selectedContent: string;
  allContent: string;
  onCopy: (content: string, label: string) => void;
}

export function PackageSection({
  packageName,
  selectedContent,
  allContent,
  onCopy,
}: PackageSectionProps) {
  return (
    <div className="space-y-2">
      {/* Package Header */}
      <h6 className="mb-0 pb-0">📦 Package: {packageName}</h6>

      {/* Selected and All side-by-side */}
      <div className="grid grid-cols-2 gap-fix-lg">
        {/* Selected Icons */}
        <div>
          <div className="flex justify-between items-center mb-fix-sm">
            <p className="text-sm my-0">Selected Icons</p>
            <DBButton
              size="small"
              showIcon
              icon="copy"
              variant="filled"
              onClick={() =>
                onCopy(selectedContent, `${packageName} - Selected`)
              }
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label={`${packageName} - Selected`}
            showLabel={false}
            value={selectedContent}
            readOnly
          ></DBTextarea>
        </div>

        {/* All Icons */}
        <div>
          <div className="flex justify-between items-center mb-fix-sm">
            <p className="text-sm my-0">All Icons</p>
            <DBButton
              size="small"
              showIcon
              icon="copy"
              variant="filled"
              onClick={() => onCopy(allContent, `${packageName} - All`)}
            >
              Copy
            </DBButton>
          </div>
          <DBTextarea
            label={`${packageName} - All`}
            showLabel={false}
            value={allContent}
            readOnly
          ></DBTextarea>
        </div>
      </div>

      {/* Divider between packages */}
      <div className="pt-fix-sm"></div>
    </div>
  );
}
