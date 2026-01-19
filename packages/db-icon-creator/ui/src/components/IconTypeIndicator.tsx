/**
 * IconTypeIndicator Component
 * Displays the icon type (functional or illustrative) with appropriate styling
 */

import { DBBadge } from "@db-ui/react-components";

interface IconTypeIndicatorProps {
  type: "functional" | "illustrative" | null;
}

export function IconTypeIndicator({ type }: IconTypeIndicatorProps) {
  if (!type) return null;

  return (
    <div className="icon-type">
      <span className="label">Icon Type:</span>
      <DBBadge
        semantic={type === "functional" ? "informational" : "successful"}
        emphasis="strong"
      >
        {type === "functional" ? "Functional" : "Illustrative"}
      </DBBadge>
    </div>
  );
}
