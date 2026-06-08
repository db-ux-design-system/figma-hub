/**
 * NameEditor Component
 * Form for editing icon name
 */

import { useState } from "react";
import { DBButton, DBInput } from "@db-ux/react-core-components";

interface NameEditorProps {
  currentName: string;
  suggestion?: string;
  onUpdate: (newName: string) => void;
}

export function NameEditor({
  currentName,
  suggestion,
  onUpdate,
}: NameEditorProps) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onUpdate(name.trim());
    }
  };

  const useSuggestion = () => {
    if (suggestion) {
      setName(suggestion);
    }
  };

  return (
    <div className="flex flex-col name-editor space-y-4 gap-fix-md mt-fix-sm">
      <h3 className="text-lg mb-0">
        🪲 Fix wrong icon name
        <br />
      </h3>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 gap-fix-sm"
      >
        <div className="flex flex-row gap-fix-2xs items-end">
          <div className="flex-1 w-1/2">
            <DBInput
              label={"Suggestion: " + suggestion}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
              placeholder="e.g., bell-disabled"
            />
          </div>

          {suggestion && (
            <div className="flex flex-col w-1/2">
              <DBButton variant="filled" onClick={useSuggestion}>
                Use Suggestion
              </DBButton>
            </div>
          )}
        </div>
        <DBButton variant="brand">Update Name</DBButton>
      </form>
    </div>
  );
}
