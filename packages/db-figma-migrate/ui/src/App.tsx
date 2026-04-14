import {
  DBBrand,
  DBHeader,
  DBPage,
  DBSection,
  DBInfotext,
} from "@db-ux/react-core-components";
import "./index.css";
import { usePluginMessages } from "./hooks/usePluginMessages";
import { useMigrationState } from "./hooks/useMigrationState";
import BranchWarning from "./components/BranchWarning";
import ReleasePage from "./pages/ReleasePage";
import MigrationPage from "./pages/MigrationPage";

const App = () => {
  const { sendToPlugin, lastMessage } = usePluginMessages();
  const {
    releases,
    migrations,
    selectedRelease,
    selectedScope,
    branchStatus,
    activeMigrationId,
    error,
    selectRelease,
    setScope,
    setActiveMigration,
    startAnalysis,
    startMigration,
    startBatch,
    startPreview,
    sendDecision,
  } = useMigrationState(lastMessage, sendToPlugin);

  const navigateToNode = (nodeId: string) => {
    sendToPlugin({ type: "navigate_to_node", nodeId });
  };

  const activeMigration = activeMigrationId
    ? (migrations.get(activeMigrationId) ?? null)
    : null;

  return (
    <DBPage
      variant="fixed"
      header={<DBHeader brand={<DBBrand>DB Figma Migrate</DBBrand>} />}
    >
      <DBSection spacing="none">
        <div className="flex flex-col gap-fix-md p-fix-sm">
          <BranchWarning isBranch={branchStatus} />

          {error && <DBInfotext semantic="critical">{error}</DBInfotext>}

          {activeMigration ? (
            <MigrationPage
              state={activeMigration}
              onMigrateSingle={startMigration}
              onMigrateBatch={startBatch}
              onPreview={startPreview}
              onDecision={sendDecision}
              onNavigateToNode={navigateToNode}
              onBack={() => setActiveMigration(null)}
            />
          ) : (
            <ReleasePage
              releases={releases}
              selectedRelease={selectedRelease}
              selectedScope={selectedScope}
              migrations={migrations}
              onSelectRelease={selectRelease}
              onSelectScope={setScope}
              onAnalyze={startAnalysis}
              onOpenMigration={setActiveMigration}
            />
          )}
        </div>
      </DBSection>
    </DBPage>
  );
};

export default App;
