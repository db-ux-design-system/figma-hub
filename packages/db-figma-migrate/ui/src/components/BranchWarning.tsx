import { DBNotification } from "@db-ux/react-core-components";

interface BranchWarningProps {
  isBranch: boolean | null;
}

const BranchWarning = ({ isBranch }: BranchWarningProps) => {
  if (isBranch === false) {
    return (
      <DBNotification variant="docked" semantic="critical">
        You are working in the main file. Migrations should be performed in a
        Figma branch.
      </DBNotification>
    );
  }

  if (isBranch === true) {
    return (
      <DBNotification variant="docked" semantic="successful">
        You are working in a branch. Migrations can be performed safely.
      </DBNotification>
    );
  }

  return (
    <DBNotification variant="docked" semantic="warning">
      Migrations should be performed in a Figma branch.
    </DBNotification>
  );
};

export default BranchWarning;
