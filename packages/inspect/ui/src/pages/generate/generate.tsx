import { DBButton, DBInfotext } from "@db-ui/react-components";
import { useEffect, useState } from "react";
import OutputTabs from "../../components/output-tabs";
import {
  isBaseDataMessage,
  isCssDataMessage,
  isErrorMessage,
  isLoadingMessage,
  isSelectionChangeMessage,
  isStorage,
} from "../../utils/plugin-message.ts";
import { storageKey } from "../../components/output-tabs/data.ts";
import { Node, PluginMessage } from "shared/data.ts";
import hljs from "highlight.js";

const Generate = () => {
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState<string | undefined>();
  const [code, setCode] = useState<Node | null>(null);
  const [cssCode, setCssCode] = useState<Node | null>(null);
  const [selectLanguage, setSelectLanguage] = useState<string | null>();

  useEffect(() => {
    onmessage = (event: MessageEvent) => {
      const message: PluginMessage<any> = event.data.pluginMessage;
      if (isSelectionChangeMessage(message)) {
        const validRoot = message.data;
        if (!validRoot) {
          setError("Please select only one root frame");
        }
      } else if (isBaseDataMessage(message)) {
        setCode(message.data);
      } else if (isCssDataMessage(message)) {
        setCssCode(message.data);
      } else if (isLoadingMessage(message)) {
        setLoading(message.data);
      } else if (isErrorMessage(message)) {
        setError(message.data);
      } else if (isStorage(message)) {
        setSelectLanguage(message.data);
      }
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: "getStorage",
          data: {
            key: storageKey,
          },
        },
      },
      "*",
    );
  });

  useEffect(() => {
    if (code && loading && !cssCode) {
      parent.postMessage({ pluginMessage: { type: "css" } }, "*");
    }
  }, [code, loading, cssCode]);

  useEffect(() => {
    hljs.configure({
      languages: [
        "js",
        "ts",
        "jsx",
        "tsx",
        "css",
        "scss",
        "html",
        "shell",
        "json",
      ],
    });

    hljs.highlightAll();
  });

  return (
    <>
      <h1>Generate</h1>
      <div className="flex gap-fix-md items-center content-center">
        <DBButton
          icon="person"
          disabled={!!error}
          onClick={() => {
            setCode(null);
            setCssCode(null);
            parent.postMessage({ pluginMessage: { type: "generate" } }, "*");
          }}
        >
          Generate
        </DBButton>
        {loading && <DBInfotext semantic="informational">{loading}</DBInfotext>}
      </div>
      {error && <DBInfotext semantic="critical">{error}</DBInfotext>}
      {code && (
        <>
          <h2>Output:</h2>
          <OutputTabs
            code={code}
            cssCode={cssCode}
            selectLanguage={selectLanguage}
          />
        </>
      )}
    </>
  );
};

export default Generate;
