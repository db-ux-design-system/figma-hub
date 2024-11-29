import { DBButton, DBCard, DBInfotext, DBTag } from "@db-ui/react-components";
import { useEffect, useState } from "react";
import {
  isCounterMessage,
  isDataMessage,
  isErrorMessage,
  isLoadingMessage,
  isUpdateMessage,
} from "../../utils/plugin-message.ts";
import { PluginMessage } from "shared/data.ts";
import { MigrationNode } from "shared/design-migration/data.ts";

const Migration = () => {
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState<string | undefined>();
  const [analyzeCounter, setAnalyzeCounter] = useState<number>(0);
  const [data, setData] = useState<MigrationNode[] | undefined>();

  useEffect(() => {
    onmessage = (event: MessageEvent) => {
      const message: PluginMessage<any> = event.data.pluginMessage;
      if (isLoadingMessage(message)) {
        setLoading(message.data);
      } else if (isErrorMessage(message)) {
        setError(message.data);
      } else if (isCounterMessage(message)) {
        setAnalyzeCounter((prevState) => {
          return (prevState || 0) + 1;
        });
      } else if (isDataMessage(message)) {
        setData(message.data);
      } else if (isUpdateMessage(message)) {
        setData(data?.filter((node) => node.id !== message.data));
      }
    };
  });

  return (
    <div className="flex flex-col gap-fix-md mb-fix-lg">
      <DBButton
        disabled={!!loading}
        width="full"
        onClick={() => {
          setAnalyzeCounter(0);
          setData(undefined);
          parent.postMessage({ pluginMessage: { type: "analyze" } }, "*");
        }}
      >
        Analyze Page
      </DBButton>
      {loading && (
        <DBInfotext semantic="informational">
          {loading}
          {analyzeCounter > 0 ? `: ${analyzeCounter} nodes found` : ""}
        </DBInfotext>
      )}
      {error && <DBInfotext semantic="critical">{error}</DBInfotext>}
      {data && data.length === 0 ? (
        <DBInfotext semantic="successful">No migrations found</DBInfotext>
      ) : (
        data &&
        data.map((migrationNode) => {
          const { id, name, collectionName, foundModeName } = migrationNode;
          return (
            <DBCard key={id} data-density="functional" className="gap-fix-md">
              <span className="font-bold">{name}</span>
              <div className="flex gap-fix-md">
                <span>{collectionName}</span>
                <DBTag>{foundModeName}</DBTag>
              </div>
              <DBButton
                className="mx-auto"
                onClick={() => {
                  parent.postMessage(
                    { pluginMessage: { type: "migrate", data: migrationNode } },
                    "*",
                  );
                }}
              >
                Migrate
              </DBButton>
            </DBCard>
          );
        })
      )}
    </div>
  );
};

export default Migration;
