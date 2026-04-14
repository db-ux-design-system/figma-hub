import type { MigrationScope, MigrationUIState } from "../types";
import ReleaseSelector from "../components/ReleaseSelector";
import ScopeSelector from "../components/ScopeSelector";
import MigrationCard from "../components/MigrationCard";

interface ReleasePageProps {
  releases: string[];
  selectedRelease: string | null;
  selectedScope: MigrationScope;
  migrations: Map<string, MigrationUIState>;
  onSelectRelease: (release: string) => void;
  onSelectScope: (scope: MigrationScope) => void;
  onAnalyze: (migrationId: string) => void;
  onOpenMigration: (migrationId: string) => void;
}

const ReleasePage = ({
  releases,
  selectedRelease,
  selectedScope,
  migrations,
  onSelectRelease,
  onSelectScope,
  onAnalyze,
  onOpenMigration,
}: ReleasePageProps) => {
  const releaseMigrations = selectedRelease
    ? Array.from(migrations.values()).filter(
        (m) => m.metadata.releaseVersion === selectedRelease,
      )
    : [];

  return (
    <div className="flex flex-col gap-fix-md">
      <div className="flex gap-fix-md">
        <ReleaseSelector
          releases={releases}
          selectedRelease={selectedRelease}
          onSelect={onSelectRelease}
        />
        <ScopeSelector selectedScope={selectedScope} onSelect={onSelectScope} />
      </div>

      {releaseMigrations.length === 0 && selectedRelease && (
        <p className="text-sm opacity-70">
          Keine Migrationen für Release v{selectedRelease} verfügbar.
        </p>
      )}

      {releaseMigrations.map((ms) => (
        <MigrationCard
          key={ms.migrationId}
          metadata={ms.metadata}
          state={ms}
          onAnalyze={() => onAnalyze(ms.migrationId)}
          onOpen={() => onOpenMigration(ms.migrationId)}
        />
      ))}
    </div>
  );
};

export default ReleasePage;
