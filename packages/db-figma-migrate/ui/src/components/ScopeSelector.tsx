import { DBSelect } from "@db-ux/react-core-components";
import type { MigrationScope } from "../types";

interface ScopeSelectorProps {
  selectedScope: MigrationScope;
  onSelect: (scope: MigrationScope) => void;
}

const scopeLabels: Record<MigrationScope, string> = {
  frame: "Frame",
  page: "Page",
  document: "Document",
};

// TODO: Switch to DBCustomSelect once the mobile-variant issue in Figma plugin iframes is resolved
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
