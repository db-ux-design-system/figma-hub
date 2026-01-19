/**
 * EmptyState Component
 * Displays a message when no Component Set is selected
 */

import { DBInfotext } from "@db-ui/react-components";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <DBInfotext semantic="informational" icon="information">
        {message}
      </DBInfotext>
    </div>
  );
}
