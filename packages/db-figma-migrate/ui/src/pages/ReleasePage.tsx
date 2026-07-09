import type { MigrationScope, MigrationUIState } from "../types";
import ScopeSelector from "../components/ScopeSelector";
import MigrationCard from "../components/MigrationCard";

interface ReleasePageProps {
  latestRelease: string | null;
  selectedScope: MigrationScope;
  migrations: Map<string, MigrationUIState>;
  onSelectScope: (scope: MigrationScope) => void;
  onAnalyze: (migrationId: string) => void;
  onOpenMigration: (migrationId: string) => void;
}

const ReleasePage = ({
  latestRelease,
  selectedScope,
  migrations,
  onSelectScope,
  onAnalyze,
  onOpenMigration,
}: ReleasePageProps) => {
  const releaseMigrations = latestRelease
    ? Array.from(migrations.values()).filter(
        (m) => m.metadata.releaseVersion === latestRelease,
      )
    : [];

  return (
    <div className="flex flex-col gap-fix-lg">
      <div className="flex flex-col gap-fix-2xs">
        {latestRelease && (
          <h1 className="text-lg m0">Migration to v{latestRelease}</h1>
        )}
        <ScopeSelector selectedScope={selectedScope} onSelect={onSelectScope} />
      </div>

      {releaseMigrations.length === 0 && latestRelease && (
        <p className="text-sm opacity-70">
          No migrations available for release v{latestRelease}.
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
