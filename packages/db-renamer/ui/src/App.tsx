import { useState } from "react";
import {
  DBButton,
  DBInput,
  DBCheckbox,
  DBSelect,
  DBTabs,
  DBTabList,
  DBTabItem,
  DBTabPanel,
  DBIcon,
} from "@db-ux/react-core-components";
import "./index.css";

type NodeType =
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "FRAME"
  | "GROUP"
  | "SECTION"
  | "TEXT"
  | "RECTANGLE"
  | "ELLIPSE"
  | "POLYGON"
  | "STAR"
  | "VECTOR"
  | "LINE"
  | "SLICE";

const nodeTypeOptions: { label: string; value: NodeType }[] = [
  { label: "Components", value: "COMPONENT" },
  { label: "Variants", value: "COMPONENT_SET" },
  { label: "Instance", value: "INSTANCE" },
  { label: "Frame", value: "FRAME" },
  { label: "Group", value: "GROUP" },
  { label: "Section", value: "SECTION" },
  { label: "Text", value: "TEXT" },
  { label: "Image", value: "RECTANGLE" },
  { label: "Line", value: "LINE" },
  { label: "Shape", value: "ELLIPSE" },
  { label: "Vector", value: "VECTOR" },
  { label: "Slice", value: "SLICE" },
];

const caseOptions = [
  { label: "Title Case", value: "title" },
  { label: "Sentence case", value: "sentence" },
  { label: "Header-Case", value: "header" },
  { label: "PascalCase", value: "pascal" },
  { label: "camelCase", value: "camel" },
  { label: "lowercase", value: "lower" },
  { label: "UPPERCASE", value: "upper" },
  { label: "CONSTANT_CASE", value: "constant" },
  { label: "snake_case", value: "snake" },
  { label: "param-case", value: "param" },
  { label: "path/case", value: "path" },
  { label: "dot.case", value: "dot" },
  { label: "no case", value: "no" },
];

const App = () => {
  // Tab 1: Rename
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Tab 2: Transform
  const [caseType, setCaseType] = useState("title");

  // Tab 3: Clean
  const [cleanSpecialChars, setCleanSpecialChars] = useState(false);
  const [cleanDigits, setCleanDigits] = useState(false);
  const [cleanExtraSpaces, setCleanExtraSpaces] = useState(true);

  // Common
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<NodeType[]>(
    nodeTypeOptions.map((opt) => opt.value),
  );
  const [onlyParents, setOnlyParents] = useState(true);

  const toggleNodeType = (type: NodeType) => {
    setSelectedNodeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const selectAllNodeTypes = () => {
    setSelectedNodeTypes(nodeTypeOptions.map((opt) => opt.value));
  };

  const deselectAllNodeTypes = () => {
    setSelectedNodeTypes([]);
  };

  const handleRename = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "rename",
          findText,
          replaceText,
          caseSensitive,
          nodeTypes: selectedNodeTypes,
          onlyParents,
        },
      },
      "*",
    );
  };

  const handleTransform = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "transform",
          caseType,
          nodeTypes: selectedNodeTypes,
          onlyParents,
        },
      },
      "*",
    );
  };

  const handleClean = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "clean",
          cleanSpecialChars,
          cleanDigits,
          cleanExtraSpaces,
          nodeTypes: selectedNodeTypes,
          onlyParents,
        },
      },
      "*",
    );
  };

  const [activeTab, setActiveTab] = useState(0);

  const handleAction = () => {
    console.log("Active tab:", activeTab);
    if (activeTab === 0) {
      handleRename();
    } else if (activeTab === 1) {
      handleTransform();
    } else {
      handleClean();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-fix-md">
        {/* Tabs */}
        <DBTabs
          width="full"
          alignment="center"
          initialSelectedIndex={activeTab}
        >
          <DBTabList>
            <DBTabItem onChange={() => setActiveTab(0)}>Rename</DBTabItem>
            <DBTabItem onChange={() => setActiveTab(1)}>Transform</DBTabItem>
            <DBTabItem onChange={() => setActiveTab(2)}>Clean</DBTabItem>
          </DBTabList>

          {/* Tab Panel 1: Rename */}
          <DBTabPanel className="mt-fix-lg">
            <div className="flex flex-col gap-fix-sm">
              <div className="flex items-end items-center gap-fix-sm">
                <DBInput
                  label="Find"
                  variant="floating"
                  value={findText}
                  onInput={(e: any) => setFindText(e.target.value)}
                  invalidMessage=""
                  className="flex-1"
                />
                <DBIcon icon="arrow_right" />
                <DBInput
                  label="Replace"
                  variant="floating"
                  value={replaceText}
                  onInput={(e: any) => setReplaceText(e.target.value)}
                  invalidMessage=""
                  className="flex-1"
                />
              </div>
              <DBCheckbox
                label="Case sensitive"
                checked={caseSensitive}
                onChange={(e: any) => setCaseSensitive(e.target.checked)}
                invalidMessage=""
                size="small"
              />
            </div>
          </DBTabPanel>

          {/* Tab Panel 2: Transform */}
          <DBTabPanel className="mt-fix-lg">
            <DBSelect
              variant="floating"
              label="Select case"
              value={caseType}
              onChange={(e: any) => setCaseType(e.target.value)}
              invalidMessage=""
            >
              {caseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </DBSelect>
          </DBTabPanel>

          {/* Tab Panel 3: Clean */}
          <DBTabPanel className="mt-fix-lg">
            <div className="flex flex-col gap-fix-md">
              <DBCheckbox
                label="Clean all special characters"
                checked={cleanSpecialChars}
                onChange={(e: any) => setCleanSpecialChars(e.target.checked)}
                invalidMessage=""
                size="small"
              />
              <DBCheckbox
                label="Clean all digits"
                checked={cleanDigits}
                onChange={(e: any) => setCleanDigits(e.target.checked)}
                invalidMessage=""
                size="small"
              />
              <DBCheckbox
                label="Clean all extra spaces"
                checked={cleanExtraSpaces}
                onChange={(e: any) => setCleanExtraSpaces(e.target.checked)}
                invalidMessage=""
                size="small"
              />
            </div>
          </DBTabPanel>
        </DBTabs>
      </div>

      {/* Common Options & Action Button - Sticky at bottom */}
      <div className="flex-shrink-0 border-t p-fix-md bg-white">
        <p className="text-sm font-bold mb-fix-sm">Apply to:</p>
        <div className="flex justify-between mb-fix-sm">
          {selectedNodeTypes.length === nodeTypeOptions.length ? (
            <DBButton
              size="small"
              variant="filled"
              onClick={deselectAllNodeTypes}
            >
              Deselect all
            </DBButton>
          ) : (
            <DBButton
              size="small"
              variant="filled"
              onClick={selectAllNodeTypes}
            >
              Select all
            </DBButton>
          )}
        </div>
        <div className="grid grid-cols-2 gap-fix-xs mb-fix-md">
          {nodeTypeOptions.map((opt) => (
            <DBCheckbox
              key={opt.value}
              label={opt.label}
              checked={selectedNodeTypes.includes(opt.value)}
              onChange={() => toggleNodeType(opt.value)}
              invalidMessage=""
              size="small"
            />
          ))}
        </div>
        <div className="mb-fix-md">
          <DBCheckbox
            label="Only apply to parent layers"
            checked={onlyParents}
            onChange={(e: any) => setOnlyParents(e.target.checked)}
            invalidMessage=""
            size="small"
          />
        </div>
        <DBButton
          variant="brand"
          width="full"
          onClick={handleAction}
          className="mt-fix-md"
        >
          {activeTab === 0 ? "Rename" : activeTab === 1 ? "Transform" : "Clean"}
        </DBButton>
      </div>
    </div>
  );
};

export default App;
