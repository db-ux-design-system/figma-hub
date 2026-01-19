/**
 * WorkflowInfo Component
 * Displays information about what will happen when creating an icon set
 */

import { DBNotification } from "@db-ux/react-core-components";

export function WorkflowInfo() {
  return (
    <DBNotification
      semantic="informational"
      headline="Create Icon Set will"
      variant="standalone"
    >
      <ol className="list-decimal pl-5 mt-2 space-y-1">
        <li>Flatten all layers in each variant</li>
        <li>Convert to outline stroke</li>
        <li>Apply color variables</li>
        <li>Scale to all sizes (32, 28, 24, 20, 16, 14, 12)</li>
        <li>Open description editor</li>
      </ol>
    </DBNotification>
  );
}
