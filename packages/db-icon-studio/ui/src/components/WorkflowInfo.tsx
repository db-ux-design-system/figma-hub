/**
 * WorkflowInfo Component
 * Displays information about what will happen when creating an icon
 */

import { DBNotification } from "@db-ux/react-core-components";

interface WorkflowInfoProps {
  iconType: "functional" | "illustrative" | null;
}

export function WorkflowInfo({ iconType }: WorkflowInfoProps) {
  if (iconType === "illustrative") {
    return (
      <DBNotification
        semantic="informational"
        headline="Create Illustrative Icon will"
        variant="standalone"
      >
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Clean up structure (remove empty groups)</li>
          <li>Apply color variables (Base: black, Pulse: red)</li>
          <li>Open description editor</li>
        </ol>
      </DBNotification>
    );
  }

  // Functional icons
  return (
    <DBNotification
      semantic="informational"
      headline="Create Icon Set will"
      variant="standalone"
    >
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>Clean up structure (remove empty groups)</li>
        <li>Apply color variables</li>
        <li>Scale to all sizes (32, 28, 24, 20, 16, 14, 12)</li>
        <li>Open description editor</li>
      </ol>
    </DBNotification>
  );
}
