import { DBInfotext } from "@db-ux/react-core-components";

interface BranchWarningProps {
  isBranch: boolean | null;
}

const BranchWarning = ({ isBranch }: BranchWarningProps) => {
  if (isBranch === false) {
    return (
      <DBInfotext semantic="critical">
        Du arbeitest in der Hauptdatei. Migrationen sollten in einem
        Figma-Branch durchgeführt werden.
      </DBInfotext>
    );
  }

  if (isBranch === true) {
    return (
      <DBInfotext semantic="successful">
        Du arbeitest in einem Branch. Migrationen können sicher durchgeführt
        werden.
      </DBInfotext>
    );
  }

  return (
    <DBInfotext semantic="warning">
      Migrationen sollten in einem Figma-Branch durchgeführt werden.
    </DBInfotext>
  );
};

export default BranchWarning;
