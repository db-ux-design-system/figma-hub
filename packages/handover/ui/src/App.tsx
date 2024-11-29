import "./index.css";
import { useEffect, useState } from "react";
import { isConfigMessage, isDataMessage } from "./utils/plugin-message.ts";
import {
  DBBrand,
  DBButton,
  DBCard,
  DBHeader,
  DBPage,
  DBSection,
  DBSelect,
} from "@db-ui/react-components";
import { Node, PluginMessage } from "shared/data.ts";
import { HandoverConfig } from "shared/handover/data.ts";

const App = () => {
  const [pages, setPages] = useState<Node[]>([]);
  const [configs, setConfigs] = useState<HandoverConfig[]>([]);

  useEffect(() => {
    onmessage = (event: MessageEvent) => {
      const message: PluginMessage<any> = event.data.pluginMessage;
      if (isDataMessage(message)) {
        setPages(message.data);
      }
      if (isConfigMessage(message)) {
        setConfigs(message.data);
      }
    };
  });

  return (
    <DBPage
      variant="fixed"
      header={<DBHeader brand={<DBBrand>Configuration</DBBrand>}></DBHeader>}
    >
      {pages.length > 0 && (
        <DBSection className="h-full" spacing="none">
          <div className="flex flex-col gap-fix-sm py-fix-xs">
            <div className="flex gap-fix-md">
              <DBButton
                icon="plus"
                width="full"
                onClick={() => {
                  setConfigs((previous) => {
                    return [
                      ...previous,
                      { pageId: pages[0].id, mode: "light" },
                    ];
                  });
                }}
              >
                Add
              </DBButton>
              <DBButton
                icon="save"
                width="full"
                variant="brand"
                onClick={() => {
                  parent.postMessage(
                    { pluginMessage: { type: "save", config: configs } },
                    "*",
                  );
                }}
              >
                Save
              </DBButton>
            </div>
            {configs?.map((hConfig, index) => {
              return (
                <DBCard className="gap-fix-sm">
                  <DBSelect
                    onChange={(event) =>
                      setConfigs((prevState: HandoverConfig[]) =>
                        prevState.map((hConfig, hIndex) => {
                          if (index === hIndex) {
                            return { ...hConfig, pageId: event.target.value };
                          }

                          return hConfig;
                        }),
                      )
                    }
                    label="Page"
                    defaultValue={hConfig.pageId}
                  >
                    {pages.map((page) => (
                      <option value={page.id}>{page.name}</option>
                    ))}
                  </DBSelect>
                  <DBSelect
                    label="Mode"
                    defaultValue={hConfig.mode}
                    onChange={(event) =>
                      setConfigs((prevState: HandoverConfig[]) =>
                        prevState.map((hConfig, hIndex) => {
                          if (index === hIndex) {
                            return { ...hConfig, mode: event.target.value };
                          }

                          return hConfig;
                        }),
                      )
                    }
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </DBSelect>
                </DBCard>
              );
            })}
          </div>
        </DBSection>
      )}
    </DBPage>
  );
};

export default App;
