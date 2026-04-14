import { DBSelect } from "@db-ux/react-core-components";
import type { MigrationScope } from "../types";

interface ScopeSelectorProps {
  selectedScope: MigrationScope;
  onSelect: (scope: MigrationScope) => void;
}

const scopeLabels: Record<MigrationScope, string> = {
  frame: "Frame",
  page: "Seite",
  document: "Dokument",
};

const ScopeSelector = ({ selectedScope, onSelect }: ScopeSelectorProps) => {
  return (
    <DBSelect
      label="Scope"
      value={selectedScope}
      onChange={(e) =>
        onSelect((e.target as HTMLSelectElement).value as MigrationScope)
      }
    >
      {(Object.keys(scopeLabels) as MigrationScope[]).map((scope) => (
        <option key={scope} value={scope}>
          {scopeLabels[scope]}
        </option>
      ))}
    </DBSelect>
  );
};

export default ScopeSelector;
