figma.showUI(__html__, { width: 500, height: 600 });

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

interface RenameMessage {
  type: "rename";
  findText: string;
  replaceText: string;
  caseSensitive: boolean;
  nodeTypes: NodeType[];
  onlyParents: boolean;
}

interface TransformMessage {
  type: "transform";
  caseType: string;
  nodeTypes: NodeType[];
  onlyParents: boolean;
}

interface CleanMessage {
  type: "clean";
  cleanSpecialChars: boolean;
  cleanDigits: boolean;
  cleanExtraSpaces: boolean;
  nodeTypes: NodeType[];
  onlyParents: boolean;
}

const toTitleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
const toSentenceCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
const toHeaderCase = (str: string) =>
  str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("-");
const toPascalCase = (str: string) =>
  str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
const toCamelCase = (str: string) => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};
const toConstantCase = (str: string) =>
  str
    .replace(/[\s-]+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/__+/g, "_")
    .replace(/^_/, "")
    .toUpperCase();
const toSnakeCase = (str: string) =>
  str
    .replace(/[\s-]+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/__+/g, "_")
    .replace(/^_/, "")
    .toLowerCase();
const toParamCase = (str: string) =>
  str
    .replace(/[\s_]+/g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/--+/g, "-")
    .replace(/^-/, "")
    .toLowerCase();
const toPathCase = (str: string) =>
  str
    .replace(/[\s-_]+/g, "/")
    .replace(/([a-z])([A-Z])/g, "$1/$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1/$2")
    .replace(/\/\/+/g, "/")
    .replace(/^\//, "")
    .toLowerCase();
const toDotCase = (str: string) =>
  str
    .replace(/[\s-_]+/g, ".")
    .replace(/([a-z])([A-Z])/g, "$1.$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1.$2")
    .replace(/\.\.+/g, ".")
    .replace(/^\./, "")
    .toLowerCase();
const toNoCase = (str: string) =>
  str
    .replace(/[\s-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s\s+/g, " ")
    .replace(/^\s/, "")
    .toLowerCase();

const transformCase = (str: string, caseType: string): string => {
  switch (caseType) {
    case "title":
      return toTitleCase(str);
    case "sentence":
      return toSentenceCase(str);
    case "header":
      return toHeaderCase(str);
    case "pascal":
      return toPascalCase(str);
    case "camel":
      return toCamelCase(str);
    case "lower":
      return str.toLowerCase();
    case "upper":
      return str.toUpperCase();
    case "constant":
      return toConstantCase(str);
    case "snake":
      return toSnakeCase(str);
    case "param":
      return toParamCase(str);
    case "path":
      return toPathCase(str);
    case "dot":
      return toDotCase(str);
    case "no":
      return toNoCase(str);
    default:
      return str;
  }
};

const cleanText = (
  str: string,
  cleanSpecialChars: boolean,
  cleanDigits: boolean,
  cleanExtraSpaces: boolean,
): string => {
  let result = str;
  if (cleanSpecialChars) result = result.replace(/[^a-zA-Z0-9\s-_]/g, "");
  if (cleanDigits) result = result.replace(/\d/g, "");
  if (cleanExtraSpaces) result = result.replace(/\s+/g, " ").trim();
  return result;
};

const processNodes = (
  nodes: readonly SceneNode[],
  processor: (node: SceneNode) => void,
  nodeTypes: NodeType[],
  onlyParents: boolean,
) => {
  let count = 0;

  const traverse = (node: SceneNode, isTopLevel: boolean) => {
    const shouldProcess =
      nodeTypes.includes(node.type as NodeType) && (!onlyParents || isTopLevel);

    if (shouldProcess) {
      processor(node);
      count++;
    }

    if ("children" in node && !onlyParents) {
      for (const child of node.children) {
        traverse(child, false);
      }
    }
  };

  nodes.forEach((node) => traverse(node, true));
  return count;
};

figma.ui.onmessage = async (
  msg: RenameMessage | TransformMessage | CleanMessage,
) => {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Please select at least one layer");
    return;
  }

  console.log("Message:", msg);
  console.log(
    "Selection:",
    selection.map((n) => ({ name: n.name, type: n.type })),
  );

  let count = 0;

  if (msg.type === "rename") {
    count = processNodes(
      selection,
      (node) => {
        const newName = msg.caseSensitive
          ? node.name.replace(new RegExp(msg.findText, "g"), msg.replaceText)
          : node.name.replace(new RegExp(msg.findText, "gi"), msg.replaceText);
        console.log(`Renaming "${node.name}" to "${newName}"`);
        node.name = newName;
      },
      msg.nodeTypes,
      msg.onlyParents,
    );
  } else if (msg.type === "transform") {
    count = processNodes(
      selection,
      (node) => {
        const newName = transformCase(node.name, msg.caseType);
        console.log(
          `Transforming "${node.name}" to "${newName}" (${msg.caseType})`,
        );
        node.name = newName;
      },
      msg.nodeTypes,
      msg.onlyParents,
    );
  } else if (msg.type === "clean") {
    count = processNodes(
      selection,
      (node) => {
        node.name = cleanText(
          node.name,
          msg.cleanSpecialChars,
          msg.cleanDigits,
          msg.cleanExtraSpaces,
        );
      },
      msg.nodeTypes,
      msg.onlyParents,
    );
  }

  figma.notify(`Renamed ${count} layer${count !== 1 ? "s" : ""}`);
};
