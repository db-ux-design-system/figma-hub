/**
 * Search header component with version input and icon filter.
 */

import { DBInput } from "@db-ux/react-core-components";

interface SearchHeaderProps {
  versionNumber: string;
  searchTerm: string;
  onVersionChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function SearchHeader({
  versionNumber,
  searchTerm,
  onVersionChange,
  onSearchChange,
}: SearchHeaderProps) {
  return (
    <div className="flex gap-fix-sm mb-fix-sm">
      <DBInput
        label="Version (optional)"
        placeholder="e.g. 1.2.4"
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
  );
}
