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
          <li>
            <strong>Clean up structure</strong> (remove empty groups and frames)
          </li>
          <li>
            Apply <strong>color variables</strong> (Base: black, Pulse: red)
          </li>
          <li>
            Open <strong>description editor</strong>
          </li>
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
        <li>
          <strong>Clean up structure</strong> (remove empty groups and frames)
        </li>
        <li>
          Apply <strong>color variables</strong>
        </li>
        <li>
          Scale to <strong>all sizes</strong> (32, 28, 24, 20, 16, 14, 12)
        </li>
        <li>
          Open <strong>description editor</strong>
        </li>
      </ol>
    </DBNotification>
  );
}
