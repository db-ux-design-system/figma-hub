import { DBInfotext } from "@db-ux/react-core-components";
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
    selectedScope,
    branchStatus,
    activeMigrationId,
    error,
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

  const latestRelease = releases.length > 0 ? releases[0] : null;

  return (
    <div className="p-fix-md flex flex-col gap-fix-md">
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
          onAnalyze={startAnalysis}
          onBack={() => setActiveMigration(null)}
        />
      ) : (
        <ReleasePage
          latestRelease={latestRelease}
          selectedScope={selectedScope}
          migrations={migrations}
          onSelectScope={setScope}
          onAnalyze={startAnalysis}
          onOpenMigration={setActiveMigration}
        />
      )}
    </div>
  );
};

export default App;
