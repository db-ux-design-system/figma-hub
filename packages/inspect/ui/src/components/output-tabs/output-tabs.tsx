import {
  DBButton,
  DBTabItem,
  DBTabList,
  DBTabPanel,
  DBTabs,
} from "@db-ui/react-components";
import { OutputTabsProps, storageKey } from "./data.ts";
import { copyToClipboard } from "../../utils/copy.ts";
import { useEffect, useState } from "react";
import prettier from "prettier/standalone";
import html from "prettier/plugins/html";
import babel from "prettier/plugins/babel";
import { BuiltInParserName, LiteralUnion } from "prettier";
import { OutputNode } from "shared/data.ts";
import { formatCss } from "shared/generate";
import { generateStyles } from "shared/generate/style.ts";
import {generateCode} from "shared/generate/code";

type Tab = { key: string; label: string; code: string; language: string };

export const formatCode = async (
  code: string,
  parser: LiteralUnion<BuiltInParserName>,
): Promise<string> => {
  const plugins = parser === "html" ? [html] : [babel];

  try {
    return await prettier.format(code, {
      parser,
      plugins,
    });
  } catch (_) {
    return code;
  }
};

const getTabs = async (code: OutputNode): Promise<Tab[]> => {
  return [
    {
      key: "json",
      label: "JSON",
      code: JSON.stringify(code, undefined, 2),
      language: "json",
    },
    {
      key: "html",
      label: "Web Components",
      code: await formatCode(generateCode(code, "html"), "html"),
      language: "html",
    },
    {
      key: "react",
      label: "React",
      code: await formatCode(generateCode(code, "react"), "babel"),
      language: "tsx",
    },
  ];
};

const OutputTabs = ({ code, selectLanguage, cssCode }: OutputTabsProps) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [selectIndex, setSelectIndex] = useState<number>(0);

  useEffect(() => {
    if (code) {
      const formatTabs = async () => {
        setTabs(await getTabs(code));
      };
      formatTabs();
    } else {
      setTabs([]);
    }
  }, [code]);

  useEffect(() => {
    if (cssCode && !tabs.find((tab) => tab.key === "css")) {
      const generatedStyles = formatCss(generateStyles(cssCode));
      setTabs([
        ...tabs,
        { key: "css", label: "CSS", code: generatedStyles, language: "css" },
      ]);
    }
  }, [cssCode]);

  useEffect(() => {
    if (tabs) {
      const foundTab = tabs.find((tab) => tab.key === selectLanguage);
      if (foundTab) {
        setSelectIndex(tabs.indexOf(foundTab));
      }
    }
  }, [tabs, selectLanguage]);

  return (
    <>
      {tabs && tabs.length > 0 && selectLanguage && (
        <DBTabs initialSelectedIndex={selectIndex}>
          <DBTabList>
            {tabs.map((tab) => {
              return (
                <DBTabItem
                  onChange={() => {
                    parent.postMessage(
                      {
                        pluginMessage: {
                          type: "setStorage",
                          data: { key: storageKey, value: tab.key },
                        },
                      },
                      "*",
                    );
                  }}
                  key={`tab-item-${tab.label}`}
                >
                  {tab.label}
                </DBTabItem>
              );
            })}
          </DBTabList>

          {tabs.map((tab) => {
            return (
              <DBTabPanel className="relative" key={`tab-panel-${tab.label}`}>
                <pre>
                  <code className={`language-${tab.language}`}>{tab.code}</code>
                </pre>

                <DBButton
                  className="absolute z-50 top-fix-xs right-fix-md copy-button"
                  variant="ghost"
                  icon="copy"
                  noText
                  onClick={() => {
                    copyToClipboard(tab.code);
                    parent.postMessage(
                      { pluginMessage: { type: "notify", data: "Copied" } },
                      "*",
                    );
                  }}
                >
                  Copy code
                </DBButton>
              </DBTabPanel>
            );
          })}
        </DBTabs>
      )}
    </>
  );
};

export default OutputTabs;
