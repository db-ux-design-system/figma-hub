import { DBSelect } from "@db-ux/react-core-components";

interface ReleaseSelectorProps {
  releases: string[];
  selectedRelease: string | null;
  onSelect: (release: string) => void;
}

const ReleaseSelector = ({
  releases,
  selectedRelease,
  onSelect,
}: ReleaseSelectorProps) => {
  if (releases.length === 0) {
    return null;
  }

  return (
    <DBSelect
      label="Release"
      value={selectedRelease ?? ""}
      onChange={(e) => onSelect((e.target as HTMLSelectElement).value)}
    >
      {releases.map((r) => (
        <option key={r} value={r}>
          v{r}
        </option>
      ))}
    </DBSelect>
  );
};

export default ReleaseSelector;
