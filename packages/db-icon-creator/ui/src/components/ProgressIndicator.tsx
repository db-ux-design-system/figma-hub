/**
 * ProgressIndicator Component
 * Displays current operation progress
 */

import { DBInfotext } from "@db-ui/react-components";

interface ProgressIndicatorProps {
  operation: string | null;
}

export function ProgressIndicator({ operation }: ProgressIndicatorProps) {
  if (!operation) return null;

  return (
    <DBInfotext semantic="informational" icon="time">
      <strong>Processing...</strong>
      <p>{operation}</p>
    </DBInfotext>
  );
}
