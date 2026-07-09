import { DBButton, DBCard } from "@db-ux/react-core-components";
import type { DecisionOption } from "../../types";

interface DecisionPointProps {
  options: DecisionOption[];
  onSelect: (value: string) => void;
}

const DecisionPoint = ({ options, onSelect }: DecisionPointProps) => {
  return (
    <div className="flex flex-col gap-fix-sm">
      <span className="text-sm font-bold">Please choose an option:</span>
      {options.map((opt) => (
        <DBCard
          key={opt.value}
          data-density="functional"
          className="gap-fix-xs"
        >
          <span className="font-bold">{opt.label}</span>
          {opt.description && (
            <span className="text-sm">{opt.description}</span>
          )}
          <DBButton size="small" onClick={() => onSelect(opt.value)}>
            Select
          </DBButton>
        </DBCard>
      ))}
    </div>
  );
};

export default DecisionPoint;
