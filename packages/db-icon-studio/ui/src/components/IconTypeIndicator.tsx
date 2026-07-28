/**
 * IconTypeIndicator Component
 * Displays the icon type (functional or illustrative) with appropriate styling
 */

import {} from "@db-ux/react-core-components";

interface IconTypeIndicatorProps {
  type: "functional" | "illustrative" | null;
}

export function IconTypeIndicator({ type }: IconTypeIndicatorProps) {
  if (!type) return null;

  return (
    <div className="icon-type">
      <span className="label">Icon Type:</span>
      {type === "functional" ? "Functional" : "Illustrative"}
    </div>
  );
}
